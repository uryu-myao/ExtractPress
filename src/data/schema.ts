/**
 * MoreCoffee data model — the single source for column shapes and row types.
 *
 * Every table's columns are declared once here; the TypeScript row types below
 * are derived from these declarations, so they cannot drift from them. The DDL
 * lives in migrations.ts (migrations are immutable history, so they cannot be
 * generated from the current shape); `npm run check:schema` applies every
 * migration to a scratch database and fails if the result differs from this
 * file. Reasoning for every decision: design/data-model.md.
 *
 * Conventions
 *   - ids are INTEGER PRIMARY KEY (SQLite rowid alias).
 *   - timestamps are INTEGER milliseconds since the Unix epoch, UTC.
 *   - `values` lists the allowed TEXT values; the migration enforces them with
 *     a CHECK constraint.
 */

type ColumnDef = {
  readonly type: 'INTEGER' | 'REAL' | 'TEXT';
  readonly nullable: boolean;
  readonly pk?: true;
  readonly values?: readonly string[];
  readonly references?: string;
  /** The foreign key's ON DELETE action, when not the default (NO ACTION). check:schema compares it. */
  readonly onDelete?: 'cascade' | 'set null';
  /** Filled from another column when inserted as NULL (an AFTER INSERT trigger). */
  readonly defaultFrom?: string;
  /** TEXT holding JSON; the row type describes the decoded value. */
  readonly json?: 'string[]';
};

export const schema = {
  cups: {
    id: { type: 'INTEGER', nullable: false, pk: true },
    created_at: { type: 'INTEGER', nullable: false },
    /** When the cup was drunk. Separate from created_at so a cup can be back-dated. */
    logged_at: { type: 'INTEGER', nullable: false, defaultFrom: 'created_at' },
    /**
     * 1–5. Nullable since migration 2 so a draft (5d "Keep as draft") can exist
     * later; Taste DNA ignores unrated cups (8g). Save still requires it.
     */
    rating: { type: 'INTEGER', nullable: true },
    /**
     * Structural, so required: it decides which mode-specific columns mean
     * anything. The UI's internal "mine" becomes "made_it" when it is wired up.
     */
    mode: { type: 'TEXT', nullable: false, values: ['made_it', 'barista', 'packaged'] },
    /**
     * A PHOTO'S ID, NOT A URI (2026-11-01, despite the name): the basename
     * its files follow from, Documents/photos/<id>.jpg (the original, shown
     * in full colour since 2026-11-23); a bag's cutouts are <id>-cut.heic
     * and <id>-cut-s.heic; data/photos.ts. Never a full path: the app's
     * container moves on every reinstall and update.
     */
    photo_uri: { type: 'TEXT', nullable: true },
    /** My words (5b): a free memo, stored as written, never rewritten; never feeds Taste DNA (2026-10-31). */
    note: { type: 'TEXT', nullable: true },
    /** Flavour tags (5b): the words themselves, in the order chosen, at most 5. Not ids. */
    flavours: { type: 'TEXT', nullable: false, json: 'string[]' },
    /*
     * NO AXIS COLUMNS (migration 11): the tasting axes are rows in cup_axes,
     * one per axis assessed. Not noted is the absence of a row.
     */

    // mode = made_it
    /** The bag it was logged from. A reference only: display and Taste DNA read the copies below. */
    bag_id: { type: 'INTEGER', nullable: true, references: 'bags', onDelete: 'set null' },
    /**
     * The bag's details, COPIED at logging (data-model.md). A cup is a fact:
     * deleting the bag never strips them. Editing the bag rewrites them on Save,
     * explicitly (3g's footer) — never a live reference. Do not "simplify" this
     * back to reading through bag_id.
     */
    bean_name: { type: 'TEXT', nullable: true },
    bean_roaster: { type: 'TEXT', nullable: true },
    bean_origin: { type: 'TEXT', nullable: true },
    bean_region: { type: 'TEXT', nullable: true },
    bean_process: { type: 'TEXT', nullable: true, values: ['washed', 'natural', 'honey', 'anaerobic', 'other'] },
    bean_roast_level: { type: 'TEXT', nullable: true, values: ['light', 'medium', 'medium-dark', 'dark'] },
    /** The roast date itself, never a day count ("day 7 when brewed" is computed). */
    bean_roasted_at: { type: 'INTEGER', nullable: true },
    /**
     * Gear: a reference plus the text as shown, the same shape as the bag.
     * Four roles, one of each kind (brewer, grinder; kettle and scale at
     * the table's end, migration 14): columns, not a join table, because the
     * set is closed (data-model.md "Gear on a cup").
     */
    brewer_id: { type: 'INTEGER', nullable: true, references: 'gear', onDelete: 'set null' },
    brew_method: { type: 'TEXT', nullable: true },
    grinder_id: { type: 'INTEGER', nullable: true, references: 'gear', onDelete: 'set null' },
    grinder: { type: 'TEXT', nullable: true },
    /**
     * V1.5 COLUMNS — NOT DEAD. grind_setting, water_temp_c and ratio have no UI
     * in V1. They exist so V1.5's parameter-tuning suggestions have history to
     * learn from. Do not remove them as unused. design/data-model.md.
     */
    grind_setting: { type: 'REAL', nullable: true },
    water_temp_c: { type: 'REAL', nullable: true },
    /** water : coffee, by weight (16 means 1:16). */
    ratio: { type: 'REAL', nullable: true },

    // mode = barista
    place_id: { type: 'INTEGER', nullable: true, references: 'places', onDelete: 'set null' },
    drink_type: { type: 'TEXT', nullable: true },

    // mode = packaged
    /**
     * The packaged coffee's name as typed, brand included ("BOSS Black"):
     * one name, no brand field (Design Round 7). Migration 4.
     */
    product_name: { type: 'TEXT', nullable: true },
    bought_at_place_id: { type: 'INTEGER', nullable: true, references: 'places', onDelete: 'set null' },
    /**
     * Taste DNA before / after this cup, as of its logged time (tasteDna.ts
     * DnaChange), stored at save and never recomputed. 5c and 8f's shifts read
     * it. Cups from before migration 3 were replayed once.
     */
    dna_change: { type: 'TEXT', nullable: true },
    /**
     * The café's name, COPIED at logging (migration 6, todo.md T-13): a
     * reference (place_id) plus the name as it was, the same shape as the
     * bag and the gear. Renaming a place never rewrites past cups; changing
     * the café in 11a copies the new one's name. Read this, not places.name,
     * for what a cup shows.
     */
    place_name: { type: 'TEXT', nullable: true },
    /**
     * ALWAYS EMPTY IN V1 — on purpose. V1 has no way to enter where a
     * Packaged cup was bought, so bought_at_place_id and this stay NULL. It is
     * for when "bought at" is built, and it has the same reference + copy
     * shape as the bag, the gear and the café. Not a source of truth for
     * anything until then (the products table was left like that, migration 4).
     */
    bought_at_name: { type: 'TEXT', nullable: true },

    /** mode = made_it: the kettle and scale (migration 14), as brewer / grinder. */
    kettle_id: { type: 'INTEGER', nullable: true, references: 'gear', onDelete: 'set null' },
    kettle: { type: 'TEXT', nullable: true },
    scale_id: { type: 'INTEGER', nullable: true, references: 'gear', onDelete: 'set null' },
    scale: { type: 'TEXT', nullable: true },

    /*
     * NO PRICE COLUMN — deliberate. A hand-entered price is always partial, and
     * partial price data cannot support spend reporting while still costing UI
     * space and user attention. Do not add one as an obvious-looking addition.
     * design/data-model.md.
     */
  },

  /** One bag bought (§1 Words: bag = the unit acted on). Formerly `beans`. */
  bags: {
    id: { type: 'INTEGER', nullable: false, pk: true },
    name: { type: 'TEXT', nullable: false },
    roaster: { type: 'TEXT', nullable: true },
    /** origin, region and process feed Try Next. Nullable, but the UI should encourage them. */
    origin: { type: 'TEXT', nullable: true },
    region: { type: 'TEXT', nullable: true },
    /**
     * CATEGORICAL, five values (migration 12, 2026-11-14): "other" stays,
     * because process has no free-text escape (carbonic maceration, giling
     * basah, co-ferments). Unlike roast_level (an ORDERED scale, where
     * "other" has no position): do not "make them consistent". NULL = not
     * recorded. data-model.md "Process: categorical".
     */
    process: { type: 'TEXT', nullable: true, values: ['washed', 'natural', 'honey', 'anaerobic', 'other'] },
    /**
     * Transcribed from the label: FOUR VALUES, DELIBERATELY (decided
     * 2026-10-09, reaffirmed 2026-11-13). An ordered scale light → dark that
     * Try Next can measure distance along. Do not add medium-light (false
     * precision: roasters' steps differ) and do not add "other" (it has no
     * place on the scale; a label that fits none is left NULL, "not
     * recorded"). Never a taste axis and never in Taste DNA. data-model.md.
     */
    roast_level: { type: 'TEXT', nullable: true, values: ['light', 'medium', 'medium-dark', 'dark'] },
    /**
     * The bag's printed flavours. Kept for one use: the first flavour suggestions
     * when a cup is logged from this bag (todo.md). Never copied to cups.
     */
    notes: { type: 'TEXT', nullable: false, json: 'string[]' },
    /** Freshness day and the resting state count from here (gaps.md 8). */
    roasted_at: { type: 'INTEGER', nullable: true },
    /** Staleness counts from here (8i, "around day 21 after opening"). */
    opened_at: { type: 'INTEGER', nullable: true },
    /** NULL = open (takes one of the 5 slots); set = finished, in 3f. Reopen clears it. */
    finished_at: { type: 'INTEGER', nullable: true },
    size_g: { type: 'INTEGER', nullable: true },
    /**
     * A PHOTO'S ID, NOT A URI (2026-11-01, despite the name): the basename
     * its files follow from, Documents/photos/<id>.jpg (the original, shown
     * in full colour since 2026-11-23); a bag's cutouts are <id>-cut.heic
     * and <id>-cut-s.heic; data/photos.ts. Never a full path: the app's
     * container moves on every reinstall and update.
     */
    photo_uri: { type: 'TEXT', nullable: true },
    /**
     * The best-before date printed on the bag, a local midnight (migration 9).
     * A quality guarantee, not a flavour peak: it gives days left, never a
     * state or a bar (data-model.md "Best-before"). Not copied onto cups.
     */
    best_before: { type: 'INTEGER', nullable: true },
    /**
     * The photo's cutout (migration 17; Design Round 31): NULL not tried yet
     * (or the photo just changed); 0 tried, and no subject found or one
     * filling three or four sides of the photo (a close-up), so the bag
     * shows its rectangular photo; otherwise 1 (made) plus the sides of the
     * photo the cutout runs into, where a held bag's hand is cut off:
     * 2 top, 4 right, 8 bottom, 16 left (data/photos.ts CUTOUT_EDGE).
     * Meaningless while photo_uri is NULL.
     */
    photo_cutout: { type: 'INTEGER', nullable: true },
  },

  /**
   * A cup's tasting axes (migration 11; Turn 29, 5b): ONE ROW PER AXIS THE
   * DRINKER ASSESSED. NOT NOTED IS THE ABSENCE OF A ROW: no NULL value, no
   * sentinel, no default — an axis left alone simply has no row here. That
   * is this table's most important property and the reason it is a join
   * table (data-model.md "cup_axes"). Which axes exist is the registry's
   * business (src/constants/tasteAxes.js), so `axis` has no CHECK list: a
   * new axis needs no migration. Deleting the cup deletes its rows.
   */
  cup_axes: {
    cup_id: { type: 'INTEGER', nullable: false, pk: true, references: 'cups', onDelete: 'cascade' },
    /** A registry id (TASTE_AXES). */
    axis: { type: 'TEXT', nullable: false, pk: true },
    /**
     * 1.0–5.0 in 0.5 steps; CHECK: between 1 and 5, and value × 2 whole (so
     * 3.7 cannot be written). REAL is exact here: halves are representable
     * in binary floating point.
     */
    value: { type: 'REAL', nullable: false },
  },

  /** Registered gear (3a 3b 3e, 8c). One default per category (a partial unique index). */
  gear: {
    id: { type: 'INTEGER', nullable: false, pk: true },
    name: { type: 'TEXT', nullable: false },
    category: { type: 'TEXT', nullable: false, values: ['brewer', 'grinder', 'kettle', 'scale'] },
    maker: { type: 'TEXT', nullable: true },
    /** 3e "My settings note": free text, the user's own. */
    settings_note: { type: 'TEXT', nullable: true },
    /** 0 / 1. 5a pre-fills the default brewer and grinder. */
    is_default: { type: 'INTEGER', nullable: false },
    /**
     * A PHOTO'S ID, NOT A URI (2026-11-01, despite the name): the basename
     * its files follow from, Documents/photos/<id>.jpg (the original, shown
     * in full colour since 2026-11-23); a bag's cutouts are <id>-cut.heic
     * and <id>-cut-s.heic; data/photos.ts. Never a full path: the app's
     * container moves on every reinstall and update.
     */
    photo_uri: { type: 'TEXT', nullable: true },
    added_at: { type: 'INTEGER', nullable: false },
    /**
     * 3a's two-fact line ("Ceramic · Cone dripper"), copied from the bundled
     * catalogue (constants/gear.json) with name and maker at the pick; never
     * a catalogue id (migration 13). NULL: written by hand, or added before.
     */
    meta: { type: 'TEXT', nullable: true },
  },

  /**
   * Each time the 8-slot gear cap was pushed against (migration 13): at the
   * cap, a tap on a locked row or on Add your own in 3a. THE TRIGGER IS A
   * TAP PAST THE CAP, NOT REACHING IT — reaching 8 only means enough was
   * selected; tapping a ninth is wanting more than allowed, which is the
   * willingness to pay V1.5's Pro screen will name ("you've wanted a ninth
   * piece of gear 4 times"). Do not simplify it to "hit 8". At most one row
   * per category per visit to 3a. On the phone only: never sent anywhere
   * (data-model.md "The 8-slot gear cap").
   */
  gear_cap_pushes: {
    id: { type: 'INTEGER', nullable: false, pk: true },
    at: { type: 'INTEGER', nullable: false },
    /** The tab the attempt was made on. */
    category: { type: 'TEXT', nullable: false, values: ['brewer', 'grinder', 'kettle', 'scale'] },
  },

  places: {
    id: { type: 'INTEGER', nullable: false, pk: true },
    name: { type: 'TEXT', nullable: false },
    /** One table for both: a convenience store and a café differ only by kind. */
    kind: { type: 'TEXT', nullable: false, values: ['cafe', 'store'] },
    lat: { type: 'REAL', nullable: true },
    lng: { type: 'REAL', nullable: true },
    /** MapKit identifier — matches a place on a later visit instead of duplicating it. */
    external_id: { type: 'TEXT', nullable: true },
  },

  /**
   * One row (id = 1). drinks_out and coffee_style come from first setup and
   * are NULL when skipped (data-model.md); what each is for:
   *   drinks_out    8c "I mostly drink out" (0 / 1): read once, for the first
   *                 cup's mode; later cups take the last cup's mode
   *   coffee_style  8n "How do you take your coffee?": read on every cup, to
   *                 order the flavour suggestions (not the axes)
   */
  settings: {
    id: { type: 'INTEGER', nullable: false, pk: true },
    /**
     * ALWAYS EMPTY IN V1 — on purpose, as drinks_out and coffee_style both.
     * V1 never reads them, and has no way to set them: V1's first setup
     * (2026-11-21) is 8a / 8c / 8o without 8n and without 8c's "I mostly
     * drink out", since an answer nothing reads would change nothing
     * (gaps.md 22). They are used in V1.5, built with 8n and drinks_out's
     * choice, the flavour reordering (constants/flavours.js), the first
     * cup's mode from drinks_out, and a place to change both.
     */
    drinks_out: { type: 'INTEGER', nullable: true },
    coffee_style: { type: 'TEXT', nullable: true, values: ['black', 'with_milk', 'depends'] },
    /** Reset my taste DNA (6b, built 2026-11-09): only cups logged from this time count. NULL: never reset. */
    reset_at: { type: 'INTEGER', nullable: true },
    /** 0 / 1: first setup (8a / 8c / 8o; components/FirstSetup.js) was finished, skipped, or a backup restored. Never back to 0. */
    setup_done: { type: 'INTEGER', nullable: false },
  },

  /**
   * Search's "Recent searches" (Design Round 15, 18a): the terms typed, the
   * last 5 kept, one row per term ignoring case. Clear empties it.
   */
  search_history: {
    id: { type: 'INTEGER', nullable: false, pk: true },
    term: { type: 'TEXT', nullable: false },
    searched_at: { type: 'INTEGER', nullable: false },
  },

  /**
   * Try next's "Not for me" (migration 7, 2026-11-08): one row per dismissed
   * suggestion, which never comes back. key: bag:… / cafe:… / brewer:… / tag:…
   * (migrations.ts says what each names).
   */
  try_next_dismissed: {
    key: { type: 'TEXT', nullable: false, pk: true },
    kind: { type: 'TEXT', nullable: false, values: ['bag', 'cafe', 'brewer', 'tag'] },
    dismissed_at: { type: 'INTEGER', nullable: false },
  },

  /**
   * Notices delivered on this phone (migration 8; 7a / 7b). The text ships in
   * the app (src/constants/notices.js); a row is the delivery and the read
   * state. This phone's own: never in a backup (backupFormat.ts LOCAL_TABLES).
   */
  notices: {
    /** The bundled notice's id. */
    id: { type: 'TEXT', nullable: false, pk: true },
    delivered_at: { type: 'INTEGER', nullable: false },
    /** NULL: unread. */
    read_at: { type: 'INTEGER', nullable: true },
  },

  /**
   * This phone's state, one row (id = 1; migration 8). Never in a backup:
   * notification permission is per phone.
   */
  device: {
    id: { type: 'INTEGER', nullable: false, pk: true },
    /** The app version whose notices were last delivered. NULL: a new install (notices, no updates; constants/notices.js). */
    notices_version: { type: 'TEXT', nullable: true },
    /** 0 / 1: 6c's "Bag going stale" (stale and best-before reminders). Off until the user turns it on. */
    notify_stale: { type: 'INTEGER', nullable: false },
    /** 3c's date sheet: the kind chosen last (migration 10; Design Round 27 B1). NULL: Roasted on. */
    bag_date_kind: { type: 'TEXT', nullable: true, values: ['roasted', 'bestBefore'] },
    /** First setup's step reached (migration 16; 'bag' since migration 18, gear first): a relaunch resumes there. NULL: Welcome / the first step. */
    setup_step: { type: 'TEXT', nullable: true, values: ['bag'] },
  },
} as const satisfies Record<string, Record<string, ColumnDef>>;

export type TableName = keyof typeof schema;

type Decoded<C> = C extends { json: 'string[]' }
  ? string[]
  : C extends { values: readonly (infer V)[] }
    ? V
    : C extends { type: 'TEXT' }
      ? string
      : number;

type Value<C> = C extends { nullable: true } ? Decoded<C> | null : Decoded<C>;

/** A row as the app sees it (JSON columns decoded). */
export type Row<T extends TableName> = {
  -readonly [K in keyof (typeof schema)[T]]: Value<(typeof schema)[T][K]>;
};

export type Cup = Row<'cups'>;
export type Bag = Row<'bags'>;
export type Gear = Row<'gear'>;
export type Settings = Row<'settings'>;
export type Place = Row<'places'>;
export type CupAxis = Row<'cup_axes'>;

export type CupMode = NonNullable<Cup['mode']>;
export type BagProcess = NonNullable<Bag['process']>;
export type GearCategory = Gear['category'];
export type PlaceKind = Place['kind'];
