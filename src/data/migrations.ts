/**
 * Versioned migrations. Each entry is applied once, in order, inside a
 * transaction, and recorded in `schema_migrations`.
 *
 * RULES
 *   - Never edit or reorder a migration that has shipped: users already have
 *     data shaped by it. Change the schema by appending a new version.
 *   - After adding a migration, update schema.ts to the new shape and run
 *     `npm run check:schema` — it applies every migration to a scratch
 *     database and fails if the result differs from schema.ts.
 *
 * Driver-agnostic on purpose (plain SQL strings): migrate.ts runs these with
 * expo-sqlite on device; scripts/check-schema.ts runs them with node:sqlite.
 * A migration may add a `backfill` step for what SQL alone cannot compute; it
 * runs after the statements, in the same transaction, through MigrationDb.
 */

import { axesJsonSql } from './cupAxes.ts';
import { changeOf, dnaCupFromRow, type DnaCup, type DnaRow } from './tasteDna.ts';

/** What a backfill step may do, whichever driver runs it. */
export type MigrationDb = {
  all<T>(sql: string, params?: (string | number | null)[]): Promise<T[]>;
  run(sql: string, params?: (string | number | null)[]): Promise<void>;
};

export type Migration = {
  readonly version: number;
  readonly name: string;
  readonly statements: readonly string[];
  readonly backfill?: (db: MigrationDb) => Promise<void>;
  /**
   * Run with foreign keys OFF: a table rebuild (SQLite's 12-step ALTER) of a
   * table others reference. With them on, DROP TABLE does an implicit DELETE
   * that fires the children's ON DELETE actions: rebuilding bags would null
   * every cups.bag_id, rebuilding cups would delete every cup_axes row. The
   * PRAGMA is a no-op inside a transaction, so the runner sets it before
   * BEGIN, runs PRAGMA foreign_key_check before COMMIT (a dangling reference
   * fails the migration), and turns them back on after.
   */
  readonly foreignKeysOff?: true;
};

/** Epoch milliseconds, portable across SQLite versions. */
const NOW_MS = `CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)`;

/**
 * Every cup's dna_change, worked out again in logged order, each at its own
 * logged time (no clock, so the result is deterministic). The reset rule is
 * insertCup's: a cup logged on or after settings.reset_at counts from the
 * reset; one logged before it counts from the start (the reset had not
 * happened when it was saved; only the latest reset time is stored).
 * Migration 11's backfill; scripts/check-schema.ts checks it.
 */
export async function replayDnaChanges(db: MigrationDb): Promise<void> {
  const [settings] = await db.all<{ reset_at: number | null }>('SELECT reset_at FROM settings');
  const resetAt = settings?.reset_at ?? null;
  const rows = await db.all<DnaRow & { id: number }>(
    `SELECT c.id, c.rating, c.logged_at, c.flavours, ${axesJsonSql('c')} AS axes FROM cups c ORDER BY c.logged_at, c.id`
  );
  const earlier: DnaCup[] = [];
  for (const row of rows) {
    const cup = dnaCupFromRow(row);
    const reset = resetAt != null && cup.logged_at >= resetAt ? resetAt : null;
    await db.run('UPDATE cups SET dna_change = ? WHERE id = ?', [JSON.stringify(changeOf(earlier, cup, reset)), row.id]);
    earlier.push(cup);
  }
}

export const migrations: readonly Migration[] = [
  {
    version: 1,
    name: 'initial schema',
    statements: [
      `CREATE TABLE beans (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        roaster TEXT,
        origin TEXT,
        region TEXT,
        process TEXT CHECK (process IN ('washed', 'natural', 'honey', 'other')),
        roast_level TEXT CHECK (roast_level IN ('light', 'medium-light', 'medium', 'medium-dark', 'dark', 'other')),
        notes TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(notes) AND json_type(notes) = 'array'),
        opened_at INTEGER
      )`,
      `CREATE TABLE places (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('cafe', 'store')),
        lat REAL,
        lng REAL,
        external_id TEXT UNIQUE
      )`,
      `CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        brand TEXT NOT NULL,
        name TEXT,
        container TEXT CHECK (container IN ('can', 'bottle', 'carton', 'pouch')),
        volume_ml INTEGER CHECK (volume_ml > 0)
      )`,
      `CREATE TABLE cups (
        id INTEGER PRIMARY KEY,
        created_at INTEGER NOT NULL DEFAULT (${NOW_MS}),
        logged_at INTEGER,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        mode TEXT NOT NULL CHECK (mode IN ('made_it', 'barista', 'packaged')),
        photo_uri TEXT,
        note TEXT,
        bean_id INTEGER REFERENCES beans(id) ON DELETE SET NULL,
        brew_method TEXT,
        grinder TEXT,
        grind_setting REAL,
        water_temp_c REAL,
        ratio REAL,
        place_id INTEGER REFERENCES places(id) ON DELETE SET NULL,
        drink_type TEXT,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        bought_at_place_id INTEGER REFERENCES places(id) ON DELETE SET NULL
      )`,
      // logged_at defaults to created_at. SQLite cannot default one column from
      // another, and a BEFORE trigger cannot rewrite NEW, so the column is
      // nullable in DDL and filled here — the app never reads a NULL.
      `CREATE TRIGGER cups_logged_at_default AFTER INSERT ON cups
        WHEN NEW.logged_at IS NULL
        BEGIN
          UPDATE cups SET logged_at = NEW.created_at WHERE id = NEW.id;
        END`,
      `CREATE INDEX cups_logged_at ON cups (logged_at)`,
      `CREATE INDEX cups_bean_id ON cups (bean_id)`,
      `CREATE INDEX cups_place_id ON cups (place_id)`,
      `CREATE INDEX cups_product_id ON cups (product_id)`,
      `CREATE INDEX cups_bought_at_place_id ON cups (bought_at_place_id)`,
    ],
  },
  {
    /*
     * V1's capture → Taste DNA loop, in one migration (design/data-model.md
     * "V1 migration scope", decided 2026-10-10):
     *   - beans → bags (the unit a cup is logged from; §1 Words), with roast
     *     date, size, photo and the finished state; roast level in 4 steps,
     *     process + anaerobic, both without 'other' (unmapped values → NULL)
     *   - gear (one default per category)
     *   - cups: rating nullable (drafts later); the bag's details COPIED onto
     *     the cup at logging (bean_*), references kept (bag_id, brewer_id,
     *     grinder_id); flavour tags (JSON, ≤ 5) and the four axes (0–100)
     *   - settings: the two V1 first-setup answers, one row
     * SQLite cannot drop NOT NULL or change a CHECK in place, so beans and cups
     * are rebuilt; existing cups get their copies backfilled from their bag.
     */
    version: 2,
    name: 'capture loop: bags, gear, cup copies, tasting note, settings',
    statements: [
      `CREATE TABLE bags (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        roaster TEXT,
        origin TEXT,
        region TEXT,
        process TEXT CHECK (process IN ('washed', 'natural', 'honey', 'anaerobic')),
        roast_level TEXT CHECK (roast_level IN ('light', 'medium', 'medium-dark', 'dark')),
        notes TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(notes) AND json_type(notes) = 'array'),
        roasted_at INTEGER,
        opened_at INTEGER,
        finished_at INTEGER,
        size_g INTEGER CHECK (size_g > 0),
        photo_uri TEXT
      )`,
      `INSERT INTO bags (id, name, roaster, origin, region, process, roast_level, notes, opened_at)
        SELECT id, name, roaster, origin, region,
               CASE WHEN process IN ('washed', 'natural', 'honey') THEN process END,
               CASE WHEN roast_level IN ('light', 'medium', 'medium-dark', 'dark') THEN roast_level END,
               notes, opened_at
          FROM beans`,
      `CREATE TABLE gear (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('brewer', 'grinder', 'kettle', 'scale')),
        maker TEXT,
        settings_note TEXT,
        is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
        photo_uri TEXT,
        added_at INTEGER NOT NULL DEFAULT (${NOW_MS})
      )`,
      // One default per category (5a pre-fills it; 3e's "My default grinder").
      `CREATE UNIQUE INDEX gear_one_default_per_category ON gear (category) WHERE is_default = 1`,
      `CREATE TABLE cups_new (
        id INTEGER PRIMARY KEY,
        created_at INTEGER NOT NULL DEFAULT (${NOW_MS}),
        logged_at INTEGER,
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        mode TEXT NOT NULL CHECK (mode IN ('made_it', 'barista', 'packaged')),
        photo_uri TEXT,
        note TEXT,
        flavours TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(flavours) AND json_type(flavours) = 'array' AND json_array_length(flavours) <= 5),
        axis_acidity INTEGER CHECK (axis_acidity BETWEEN 0 AND 100),
        axis_body INTEGER CHECK (axis_body BETWEEN 0 AND 100),
        axis_roast INTEGER CHECK (axis_roast BETWEEN 0 AND 100),
        axis_sweetness INTEGER CHECK (axis_sweetness BETWEEN 0 AND 100),
        bag_id INTEGER REFERENCES bags(id) ON DELETE SET NULL,
        bean_name TEXT,
        bean_roaster TEXT,
        bean_origin TEXT,
        bean_region TEXT,
        bean_process TEXT CHECK (bean_process IN ('washed', 'natural', 'honey', 'anaerobic')),
        bean_roast_level TEXT CHECK (bean_roast_level IN ('light', 'medium', 'medium-dark', 'dark')),
        bean_roasted_at INTEGER,
        brewer_id INTEGER REFERENCES gear(id) ON DELETE SET NULL,
        brew_method TEXT,
        grinder_id INTEGER REFERENCES gear(id) ON DELETE SET NULL,
        grinder TEXT,
        grind_setting REAL,
        water_temp_c REAL,
        ratio REAL,
        place_id INTEGER REFERENCES places(id) ON DELETE SET NULL,
        drink_type TEXT,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        bought_at_place_id INTEGER REFERENCES places(id) ON DELETE SET NULL
      )`,
      `INSERT INTO cups_new (id, created_at, logged_at, rating, mode, photo_uri, note,
                             bag_id, bean_name, bean_roaster, bean_origin, bean_region, bean_process, bean_roast_level,
                             brew_method, grinder, grind_setting, water_temp_c, ratio,
                             place_id, drink_type, product_id, bought_at_place_id)
        SELECT c.id, c.created_at, c.logged_at, c.rating, c.mode, c.photo_uri, c.note,
               c.bean_id, b.name, b.roaster, b.origin, b.region, b.process, b.roast_level,
               c.brew_method, c.grinder, c.grind_setting, c.water_temp_c, c.ratio,
               c.place_id, c.drink_type, c.product_id, c.bought_at_place_id
          FROM cups c LEFT JOIN bags b ON b.id = c.bean_id`,
      `DROP TABLE cups`,
      `DROP TABLE beans`,
      `ALTER TABLE cups_new RENAME TO cups`,
      `CREATE TRIGGER cups_logged_at_default AFTER INSERT ON cups
        WHEN NEW.logged_at IS NULL
        BEGIN
          UPDATE cups SET logged_at = NEW.created_at WHERE id = NEW.id;
        END`,
      `CREATE INDEX cups_logged_at ON cups (logged_at)`,
      `CREATE INDEX cups_bag_id ON cups (bag_id)`,
      `CREATE INDEX cups_brewer_id ON cups (brewer_id)`,
      `CREATE INDEX cups_grinder_id ON cups (grinder_id)`,
      `CREATE INDEX cups_place_id ON cups (place_id)`,
      `CREATE INDEX cups_product_id ON cups (product_id)`,
      `CREATE INDEX cups_bought_at_place_id ON cups (bought_at_place_id)`,
      `CREATE TABLE settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        drinks_out INTEGER CHECK (drinks_out IN (0, 1)),
        coffee_style TEXT CHECK (coffee_style IN ('black', 'with_milk', 'depends'))
      )`,
      `INSERT INTO settings (id) VALUES (1)`,
    ],
  },
  {
    /*
     * Taste DNA history and two settings (design/data-model.md "Migration 3",
     * decided 2026-10-11), batched as everything visible at the time:
     *   - cups.dna_change: the profile before / after this cup, stored at save
     *     and never recomputed (5c, 8f's shifts; taste-dna.md item 5)
     *   - settings.reset_at: Reset counts cups from this time (V1.5; column only)
     *   - settings.setup_done: the first setup was finished or skipped (the
     *     flow is stage 3+). Set to 1 where cups or bags already exist: an
     *     existing user is past setup.
     * Backfill: existing cups are replayed once, in logged order, each at its
     * own logged time (no clock), so the result is deterministic. Creating
     * history where none exists, once, is not overwriting history.
     */
    version: 3,
    name: 'taste DNA history, reset date, first-setup flag',
    statements: [
      `ALTER TABLE cups ADD COLUMN dna_change TEXT CHECK (dna_change IS NULL OR json_valid(dna_change))`,
      `ALTER TABLE settings ADD COLUMN reset_at INTEGER`,
      `ALTER TABLE settings ADD COLUMN setup_done INTEGER NOT NULL DEFAULT 0 CHECK (setup_done IN (0, 1))`,
      `UPDATE settings SET setup_done = 1 WHERE EXISTS (SELECT 1 FROM cups) OR EXISTS (SELECT 1 FROM bags)`,
    ],
    /*
     * The replay that stood here (each cup's dna_change from the engine of
     * the day, over axis_* columns) was taken out on 2026-11-13: the engine
     * it called now reads cup_axes on the 1–5 scale, and migration 11
     * replays every cup's dna_change once more on that scale, so whatever
     * this one wrote would be overwritten before anything read it. A
     * database older than 3 has dna_change NULL between 3 and 11, and
     * nothing reads it there.
     */
  },
  {
    /*
     * Packaged's product name on the cup (design/data-model.md "Migration 4",
     * decided 2026-10-14; Design Round 7: one name, no brand field):
     *   - cups.product_name: the name as typed, brand included ("BOSS Black")
     *   - cups.product_id and the products table are dropped: nothing but the
     *     dev seed ever wrote products (brand NOT NULL, no screen entered one).
     *     A future brand goes on cups — do not revive the table.
     * SQLite can't drop a column with a foreign key, so cups is rebuilt once.
     * An existing product's brand and name become the cup's product_name.
     */
    version: 4,
    name: 'packaged product name on the cup; products dropped',
    statements: [
      `CREATE TABLE cups_new (
        id INTEGER PRIMARY KEY,
        created_at INTEGER NOT NULL DEFAULT (${NOW_MS}),
        logged_at INTEGER,
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        mode TEXT NOT NULL CHECK (mode IN ('made_it', 'barista', 'packaged')),
        photo_uri TEXT,
        note TEXT,
        flavours TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(flavours) AND json_type(flavours) = 'array' AND json_array_length(flavours) <= 5),
        axis_acidity INTEGER CHECK (axis_acidity BETWEEN 0 AND 100),
        axis_body INTEGER CHECK (axis_body BETWEEN 0 AND 100),
        axis_roast INTEGER CHECK (axis_roast BETWEEN 0 AND 100),
        axis_sweetness INTEGER CHECK (axis_sweetness BETWEEN 0 AND 100),
        bag_id INTEGER REFERENCES bags(id) ON DELETE SET NULL,
        bean_name TEXT,
        bean_roaster TEXT,
        bean_origin TEXT,
        bean_region TEXT,
        bean_process TEXT CHECK (bean_process IN ('washed', 'natural', 'honey', 'anaerobic')),
        bean_roast_level TEXT CHECK (bean_roast_level IN ('light', 'medium', 'medium-dark', 'dark')),
        bean_roasted_at INTEGER,
        brewer_id INTEGER REFERENCES gear(id) ON DELETE SET NULL,
        brew_method TEXT,
        grinder_id INTEGER REFERENCES gear(id) ON DELETE SET NULL,
        grinder TEXT,
        grind_setting REAL,
        water_temp_c REAL,
        ratio REAL,
        place_id INTEGER REFERENCES places(id) ON DELETE SET NULL,
        drink_type TEXT,
        product_name TEXT,
        bought_at_place_id INTEGER REFERENCES places(id) ON DELETE SET NULL,
        dna_change TEXT CHECK (dna_change IS NULL OR json_valid(dna_change))
      )`,
      `INSERT INTO cups_new (id, created_at, logged_at, rating, mode, photo_uri, note, flavours, axis_acidity, axis_body, axis_roast, axis_sweetness, bag_id, bean_name, bean_roaster, bean_origin, bean_region, bean_process, bean_roast_level, bean_roasted_at, brewer_id, brew_method, grinder_id, grinder, grind_setting, water_temp_c, ratio, place_id, drink_type, product_name, bought_at_place_id, dna_change)
        SELECT c.id, c.created_at, c.logged_at, c.rating, c.mode, c.photo_uri, c.note, c.flavours, c.axis_acidity, c.axis_body, c.axis_roast, c.axis_sweetness, c.bag_id, c.bean_name, c.bean_roaster, c.bean_origin, c.bean_region, c.bean_process, c.bean_roast_level, c.bean_roasted_at, c.brewer_id, c.brew_method, c.grinder_id, c.grinder, c.grind_setting, c.water_temp_c, c.ratio, c.place_id, c.drink_type,
               NULLIF(TRIM(COALESCE(p.brand, '') || ' ' || COALESCE(p.name, '')), ''), c.bought_at_place_id, c.dna_change
          FROM cups c LEFT JOIN products p ON p.id = c.product_id`,
      `DROP TABLE cups`,
      `DROP TABLE products`,
      `ALTER TABLE cups_new RENAME TO cups`,
      `CREATE TRIGGER cups_logged_at_default AFTER INSERT ON cups
        WHEN NEW.logged_at IS NULL
        BEGIN
          UPDATE cups SET logged_at = NEW.created_at WHERE id = NEW.id;
        END`,
      `CREATE INDEX cups_logged_at ON cups (logged_at)`,
      `CREATE INDEX cups_bag_id ON cups (bag_id)`,
      `CREATE INDEX cups_brewer_id ON cups (brewer_id)`,
      `CREATE INDEX cups_grinder_id ON cups (grinder_id)`,
      `CREATE INDEX cups_place_id ON cups (place_id)`,
      `CREATE INDEX cups_bought_at_place_id ON cups (bought_at_place_id)`,
    ],
  },
  {
    /*
     * Search history (Design Round 15 · Search, 18a): the last terms typed
     * into search, newest first. One row per term, ignoring case: a term
     * searched again moves to the top (repository.ts addSearchTerm keeps 5).
     * Overturns Design Round 10, 22 ("no recent searches in V1").
     */
    version: 5,
    name: 'search history',
    statements: [
      `CREATE TABLE search_history (
        id INTEGER PRIMARY KEY,
        term TEXT NOT NULL,
        searched_at INTEGER NOT NULL
      )`,
    ],
  },
  {
    /*
     * The café's name copied onto the cup (todo.md T-13, Uryu 2026-10-31),
     * as the bag's and the gear's already are: a cup is the fact it was, so
     * renaming a place never rewrites past cups. place_id stays, the same
     * reference + copy shape as bag_id / bean_name and brewer_id / brew_method.
     *   - cups.place_name: the Barista café's name when the cup was logged
     *   - cups.bought_at_name: Packaged's "bought at", the same shape. V1 has
     *     no way to enter it, so it stays empty (schema.ts says why)
     * Existing cups take their place's current name, once.
     *
     * And drink names in one form (Uryu, 2026-10-31): a drink added by hand
     * now takes the flavour tags' form (constants/drinks.js normalizeDrink),
     * and the ones stored before are put in it once. Only spaces and the
     * first letter change, never what was ordered: left as they were, a
     * lower-case "latte" would keep coming back, since the sheet shows the
     * latest spelling and picking it saves it again.
     */
    version: 6,
    name: 'place names copied onto cups',
    statements: [
      `ALTER TABLE cups ADD COLUMN place_name TEXT`,
      `ALTER TABLE cups ADD COLUMN bought_at_name TEXT`,
      `UPDATE cups SET place_name = (SELECT name FROM places WHERE places.id = cups.place_id) WHERE place_id IS NOT NULL`,
      `UPDATE cups SET bought_at_name = (SELECT name FROM places WHERE places.id = cups.bought_at_place_id) WHERE bought_at_place_id IS NOT NULL`,
    ],
    backfill: async (db) => {
      // Frozen here, not imported: a shipped migration must not change when
      // the app's normalizer does.
      const form = (text: string) => {
        const t = text.trim().replace(/\s+/g, (run) => run[0]);
        return t.charAt(0).toUpperCase() + t.slice(1);
      };
      const rows = await db.all<{ id: number; drink_type: string }>('SELECT id, drink_type FROM cups WHERE drink_type IS NOT NULL');
      for (const row of rows) {
        const next = form(row.drink_type) || null;
        if (next !== row.drink_type) await db.run('UPDATE cups SET drink_type = ? WHERE id = ?', [next, row.id]);
      }
    },
  },
  {
    /*
     * Try next's "Not for me" (design/try-next-v1.md, "the shape of migration
     * 7"; Design Round 23, 25d; 2026-11-08). One row per dismissed suggestion,
     * never shown again. settings is one typed row, so a list doesn't go there.
     * key says what was dismissed, by kind (repository.ts loadTryNext):
     *   bag:<name>\u001f<roaster>   the bean, lower-cased: buying it again makes
     *                               a new bag row, which mustn't bring it back
     *   cafe:<place id>
     *   brewer:<bag id>:<gear id>
     *   tag:<word>                  lower-cased
     * Undo (25d) deletes the row.
     */
    version: 7,
    name: 'try next dismissals',
    statements: [
      `CREATE TABLE try_next_dismissed (
        key TEXT PRIMARY KEY,
        kind TEXT NOT NULL CHECK (kind IN ('bag', 'cafe', 'brewer', 'tag')),
        dismissed_at INTEGER NOT NULL
      )`,
    ],
  },
  {
    /*
     * Notices and this phone's notification state (7a / 7b, 8i; Uryu,
     * 2026-11-11). The notices themselves ship in the app
     * (src/constants/notices.js); a row is only that one was delivered here,
     * and when it was read:
     *   notices  id (the bundled notice's), delivered_at, read_at (NULL: unread)
     *   device   one row: notices_version, the app version whose notices were
     *            last delivered (NULL: a new install, which gets notices but
     *            no updates), and notify_stale, the "Bag going stale" switch
     *            (off until the user turns it on, when iOS asks for permission)
     * Both are this phone's, so neither goes in a backup (backupFormat.ts
     * LOCAL_TABLES): a restore never touches them, and permission is per phone.
     */
    version: 8,
    name: 'notices and device state',
    statements: [
      `CREATE TABLE notices (
        id TEXT PRIMARY KEY,
        delivered_at INTEGER NOT NULL,
        read_at INTEGER
      )`,
      `CREATE TABLE device (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        notices_version TEXT,
        notify_stale INTEGER NOT NULL DEFAULT 0 CHECK (notify_stale IN (0, 1))
      )`,
      `INSERT INTO device (id) VALUES (1)`,
    ],
  },
  {
    /*
     * A bag's best-before date (data-model.md "Best-before"; Uryu, 2026-11-11):
     * supermarket beans print it instead of a roast date. A local midnight,
     * like roasted_at. Both may be set. Not copied onto cups. Existing bags
     * get NULL, which shows exactly what they showed before.
     */
    version: 9,
    name: 'best-before date on bags',
    statements: [`ALTER TABLE bags ADD COLUMN best_before INTEGER`],
  },
  {
    /*
     * 3c's date sheet remembers the kind last chosen (Design Round 27 B1,
     * 29a): Roasted on by default, so a supermarket shopper flips it once.
     * This phone's own (device). NULL: Roasted on. Its own migration, not
     * folded into 9: a dev build may already have run 9.
     */
    version: 10,
    name: "the date sheet's last kind",
    statements: [`ALTER TABLE device ADD COLUMN bag_date_kind TEXT CHECK (bag_date_kind IN ('roasted', 'bestBefore'))`],
  },
  {
    /*
     * Five unipolar tasting axes in a join table (Turn 29 / 30; data-model.md
     * "cup_axes", Uryu 2026-11-13):
     *   - cup_axes(cup_id, axis, value): one row per axis assessed. NOT NOTED
     *     IS THE ABSENCE OF A ROW: no NULL value, no sentinel. value 1–5 in
     *     halves; the CHECK refuses 3.7 (value × 2 must be whole). No CHECK
     *     list on axis: the registry (constants/tasteAxes.js) decides which
     *     axes exist, so a new one needs no migration.
     *   - The old bipolar 0–100 columns go. Only Body and Sweetness carry
     *     over: they were already one-directional (Light → Full body, Low →
     *     High sweetness), so 0 / 25 / 50 / 75 / 100 is 1 / 2 / 3 / 4 / 5
     *     (rounded to the nearest whole step, as the 5-step slider stored
     *     them). Acidity (Acid ↔ Bitter) mixed two of the new axes and Roast
     *     (perceived) is not Bitterness, so neither is carried: those cups
     *     read Not noted there. Decided by Uryu, 2026-11-13.
     *   - Every cup's dna_change is replayed once on the new scale: the old
     *     snapshots are 0–100 with a roast key, which no tag can read. Like
     *     migration 3, this creates history in the current unit; it is not a
     *     re-decision of what a cup did.
     */
    version: 11,
    name: 'unipolar tasting axes in cup_axes',
    statements: [
      `CREATE TABLE cup_axes (
        cup_id INTEGER NOT NULL REFERENCES cups(id) ON DELETE CASCADE,
        axis TEXT NOT NULL,
        value REAL NOT NULL CHECK (value BETWEEN 1 AND 5 AND value * 2 = CAST(value * 2 AS INTEGER)),
        PRIMARY KEY (cup_id, axis)
      ) WITHOUT ROWID`,
      `INSERT INTO cup_axes (cup_id, axis, value) SELECT id, 'body', 1 + ROUND(axis_body / 25.0) FROM cups WHERE axis_body IS NOT NULL`,
      `INSERT INTO cup_axes (cup_id, axis, value) SELECT id, 'sweetness', 1 + ROUND(axis_sweetness / 25.0) FROM cups WHERE axis_sweetness IS NOT NULL`,
      `ALTER TABLE cups DROP COLUMN axis_acidity`,
      `ALTER TABLE cups DROP COLUMN axis_body`,
      `ALTER TABLE cups DROP COLUMN axis_roast`,
      `ALTER TABLE cups DROP COLUMN axis_sweetness`,
    ],
    backfill: replayDnaChanges,
  },
  {
    /*
     * Process gains "other" (Turn 31 brief, 2026-11-14; data-model.md
     * "Process: categorical"): washed · natural · honey · anaerobic · other.
     * Process is the one bag field with no free-text escape (32e's sheet has
     * no search and no "use as written"), so carbonic maceration, giling
     * basah and co-ferments need somewhere to go. Unlike roast_level, where
     * "other" was rejected because an ordered scale needs a position for
     * every value, process is categorical: "other" compares as itself.
     *
     * SQLite can't change a CHECK, so bags and cups (whose bean_process copies
     * the bag's) are rebuilt as they stand, the list the only change, their
     * indexes and the logged_at trigger recreated. Foreign keys are off for
     * the rebuild (foreignKeysOff): cups.bag_id and every cup_axes row
     * survive. Rows are copied as they are; existing values all remain valid.
     */
    version: 12,
    name: "process takes 'other'",
    foreignKeysOff: true,
    statements: [
      `CREATE TABLE bags_new (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        roaster TEXT,
        origin TEXT,
        region TEXT,
        process TEXT CHECK (process IN ('washed', 'natural', 'honey', 'anaerobic', 'other')),
        roast_level TEXT CHECK (roast_level IN ('light', 'medium', 'medium-dark', 'dark')),
        notes TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(notes) AND json_type(notes) = 'array'),
        roasted_at INTEGER,
        opened_at INTEGER,
        finished_at INTEGER,
        size_g INTEGER CHECK (size_g > 0),
        photo_uri TEXT,
        best_before INTEGER
      )`,
      `INSERT INTO bags_new (id, name, roaster, origin, region, process, roast_level, notes, roasted_at, opened_at, finished_at, size_g, photo_uri, best_before)
        SELECT id, name, roaster, origin, region, process, roast_level, notes, roasted_at, opened_at, finished_at, size_g, photo_uri, best_before FROM bags`,
      `DROP TABLE bags`,
      `ALTER TABLE bags_new RENAME TO bags`,
      `CREATE TABLE cups_new (
        id INTEGER PRIMARY KEY,
        created_at INTEGER NOT NULL DEFAULT (${NOW_MS}),
        logged_at INTEGER,
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        mode TEXT NOT NULL CHECK (mode IN ('made_it', 'barista', 'packaged')),
        photo_uri TEXT,
        note TEXT,
        flavours TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(flavours) AND json_type(flavours) = 'array' AND json_array_length(flavours) <= 5),
        bag_id INTEGER REFERENCES bags(id) ON DELETE SET NULL,
        bean_name TEXT,
        bean_roaster TEXT,
        bean_origin TEXT,
        bean_region TEXT,
        bean_process TEXT CHECK (bean_process IN ('washed', 'natural', 'honey', 'anaerobic', 'other')),
        bean_roast_level TEXT CHECK (bean_roast_level IN ('light', 'medium', 'medium-dark', 'dark')),
        bean_roasted_at INTEGER,
        brewer_id INTEGER REFERENCES gear(id) ON DELETE SET NULL,
        brew_method TEXT,
        grinder_id INTEGER REFERENCES gear(id) ON DELETE SET NULL,
        grinder TEXT,
        grind_setting REAL,
        water_temp_c REAL,
        ratio REAL,
        place_id INTEGER REFERENCES places(id) ON DELETE SET NULL,
        drink_type TEXT,
        product_name TEXT,
        bought_at_place_id INTEGER REFERENCES places(id) ON DELETE SET NULL,
        dna_change TEXT CHECK (dna_change IS NULL OR json_valid(dna_change)),
        place_name TEXT,
        bought_at_name TEXT
      )`,
      `INSERT INTO cups_new (id, created_at, logged_at, rating, mode, photo_uri, note, flavours, bag_id, bean_name, bean_roaster, bean_origin, bean_region, bean_process, bean_roast_level, bean_roasted_at, brewer_id, brew_method, grinder_id, grinder, grind_setting, water_temp_c, ratio, place_id, drink_type, product_name, bought_at_place_id, dna_change, place_name, bought_at_name)
        SELECT id, created_at, logged_at, rating, mode, photo_uri, note, flavours, bag_id, bean_name, bean_roaster, bean_origin, bean_region, bean_process, bean_roast_level, bean_roasted_at, brewer_id, brew_method, grinder_id, grinder, grind_setting, water_temp_c, ratio, place_id, drink_type, product_name, bought_at_place_id, dna_change, place_name, bought_at_name FROM cups`,
      `DROP TABLE cups`,
      `ALTER TABLE cups_new RENAME TO cups`,
      `CREATE INDEX cups_logged_at ON cups (logged_at)`,
      `CREATE INDEX cups_bag_id ON cups (bag_id)`,
      `CREATE INDEX cups_brewer_id ON cups (brewer_id)`,
      `CREATE INDEX cups_grinder_id ON cups (grinder_id)`,
      `CREATE INDEX cups_place_id ON cups (place_id)`,
      `CREATE INDEX cups_bought_at_place_id ON cups (bought_at_place_id)`,
      `CREATE TRIGGER cups_logged_at_default AFTER INSERT ON cups
        WHEN NEW.logged_at IS NULL
        BEGIN
          UPDATE cups SET logged_at = NEW.created_at WHERE id = NEW.id;
        END`,
    ],
  },
];

/** The bookkeeping table. Created before any migration runs. */
export const MIGRATIONS_TABLE = `CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
)`;
