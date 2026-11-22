// Schema drift check: applies every migration to an in-memory SQLite database
// (node:sqlite) and fails if the result differs from src/data/schema.ts, then
// runs the dev seed and probes the constraints. Run: npm run check:schema
import { DatabaseSync } from 'node:sqlite';
import { seedStatements } from '../src/data/dev/seed.ts';
import { MIGRATIONS_TABLE, migrations, type MigrationDb } from '../src/data/migrations.ts';
import { changeOf, dnaCupFromRow, type DnaCup } from '../src/data/tasteDna.ts';
import { axesJsonSql } from '../src/data/cupAxes.ts';
import { schema } from '../src/data/schema.ts';

const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);

/** node:sqlite behind the backfill interface (synchronous underneath). */
const asMigrationDb = (d: DatabaseSync): MigrationDb => ({
  all: async <T,>(sql: string, params: (string | number | null)[] = []) => d.prepare(sql).all(...params) as T[],
  run: async (sql: string, params: (string | number | null)[] = []) => {
    d.prepare(sql).run(...params);
  },
});

/**
 * One migration as migrate.ts runs it: in a transaction, foreign keys off
 * around it when the migration says so (a table rebuild), and a
 * foreign_key_check before COMMIT. record: write its schema_migrations row.
 */
async function apply(d: DatabaseSync, m: (typeof migrations)[number], { backfill = true, record = true } = {}) {
  if (m.foreignKeysOff) d.exec('PRAGMA foreign_keys = OFF');
  d.exec('BEGIN');
  for (const sql of m.statements) d.exec(sql);
  if (backfill && m.backfill) await m.backfill(asMigrationDb(d));
  if (m.foreignKeysOff) {
    const dangling = d.prepare('PRAGMA foreign_key_check').all();
    if (dangling.length) fail(`migration ${m.version}: ${dangling.length} broken reference(s) after the rebuild`);
  }
  if (record) d.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(m.version, m.name, Date.now());
  d.exec('COMMIT');
  if (m.foreignKeysOff) d.exec('PRAGMA foreign_keys = ON');
}

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys = ON');
db.exec(MIGRATIONS_TABLE);
const versions = migrations.map((m) => m.version);
if (versions.some((v, i) => v !== i + 1)) fail(`migration versions must be 1..n in order, got ${versions}`);
for (const m of migrations) await apply(db, m);

type Info = { name: string; type: string; notnull: number; pk: number };
type Fk = { from: string; table: string; on_delete: string };
const tables = db.prepare(`SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT IN ('schema_migrations') AND name NOT LIKE 'sqlite_%'`).all() as { name: string; sql: string }[];

const declared = Object.keys(schema);
const actual = tables.map((t) => t.name);
for (const t of declared) if (!actual.includes(t)) fail(`table ${t}: declared in schema.ts, missing after migrations`);
for (const t of actual) if (!declared.includes(t)) fail(`table ${t}: created by migrations, not declared in schema.ts`);

for (const { name: table, sql } of tables) {
  const cols = schema[table as keyof typeof schema] as Record<string, any> | undefined;
  if (!cols) continue;
  const info = db.prepare(`PRAGMA table_info(${table})`).all() as Info[];
  const fks = db.prepare(`PRAGMA foreign_key_list(${table})`).all() as Fk[];
  const names = info.map((c) => c.name);
  if (names.join() !== Object.keys(cols).join()) fail(`${table}: columns [${names}] ≠ schema.ts [${Object.keys(cols)}]`);
  for (const c of info) {
    const d = cols[c.name];
    if (!d) continue;
    if (c.type !== d.type) fail(`${table}.${c.name}: type ${c.type} ≠ ${d.type}`);
    // defaultFrom columns are nullable in DDL and filled by a trigger.
    const wantNotNull = d.nullable || d.defaultFrom ? 0 : 1;
    if (!c.pk && c.notnull !== wantNotNull) fail(`${table}.${c.name}: NOT NULL ${c.notnull} ≠ expected ${wantNotNull}`);
    if (Boolean(c.pk) !== Boolean(d.pk)) fail(`${table}.${c.name}: primary key mismatch`);
    const fk = fks.find((f) => f.from === c.name);
    if ((fk?.table ?? undefined) !== d.references) fail(`${table}.${c.name}: references ${fk?.table} ≠ ${d.references}`);
    if (fk && fk.on_delete !== (d.onDelete ?? 'no action').toUpperCase()) fail(`${table}.${c.name}: ON DELETE ${fk.on_delete} ≠ schema.ts ${d.onDelete ?? 'no action'}`);
    if (d.values) {
      const m = sql.match(new RegExp(`${c.name}\\s+[^,]*?CHECK\\s*\\(\\s*${c.name}\\s+IN\\s*\\(([^)]*)\\)`));
      const got = m ? m[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')) : [];
      if (got.join() !== d.values.join()) fail(`${table}.${c.name}: CHECK values [${got}] ≠ schema.ts [${d.values}]`);
    }
    if (d.defaultFrom) {
      const trig = db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'trigger' AND tbl_name = ?`).all(table) as { sql: string }[];
      if (!trig.some((t) => t.sql.includes(`SET ${c.name} = NEW.${d.defaultFrom}`))) fail(`${table}.${c.name}: no trigger filling it from ${d.defaultFrom}`);
    }
  }
}

// Seed, then probe behaviour.
for (const s of seedStatements()) db.prepare(s.sql).run(...s.params);
const cups = db.prepare('SELECT id, mode, created_at, logged_at FROM cups ORDER BY id').all() as { id: number; mode: string; created_at: number; logged_at: number }[];
const modes = new Set(cups.map((c) => c.mode));
if (!['made_it', 'barista', 'packaged'].every((m) => modes.has(m))) fail(`seed: expected all three modes, got ${[...modes]}`);
for (const c of cups) if (c.logged_at !== c.created_at) fail(`seed cup ${c.id}: logged_at ${c.logged_at} did not default to created_at ${c.created_at}`);

const rejects = (label: string, sql: string) => {
  try { db.exec(sql); fail(`constraint not enforced: ${label}`); } catch { /* expected */ }
};
const accepts = (label: string, sql: string) => {
  try { db.exec(sql); } catch (e) { fail(`should be accepted: ${label} (${(e as Error).message})`); }
};
rejects('rating 0', `INSERT INTO cups (rating, mode) VALUES (0, 'made_it')`);
accepts('rating missing (a draft, migration 2)', `INSERT INTO cups (mode) VALUES ('made_it')`);
rejects('mode missing', `INSERT INTO cups (rating) VALUES (3)`);
rejects('free-text roast level', `INSERT INTO bags (name, roast_level) VALUES ('x', 'City+')`);
rejects('roast level medium-light (4 steps, deliberately)', `INSERT INTO bags (name, roast_level) VALUES ('x', 'medium-light')`);
rejects('roast level other (dropped)', `INSERT INTO bags (name, roast_level) VALUES ('x', 'other')`);
rejects('unknown mode', `INSERT INTO cups (rating, mode) VALUES (3, 'gifted')`);
accepts('process anaerobic', `INSERT INTO bags (name, process) VALUES ('x', 'anaerobic')`);
accepts('process other (migration 12: categorical, the one field with no free text)', `INSERT INTO bags (name, process) VALUES ('x', 'other')`);
rejects('free-text process', `INSERT INTO bags (name, process) VALUES ('x', 'carbonic maceration')`);
rejects('bag notes not an array', `INSERT INTO bags (name, notes) VALUES ('x', '"floral"')`);
rejects('flavours not an array', `INSERT INTO cups (rating, mode, flavours) VALUES (3, 'made_it', '"jasmine"')`);
rejects('six flavours', `INSERT INTO cups (rating, mode, flavours) VALUES (3, 'made_it', '["a","b","c","d","e","f"]')`);
accepts('five flavours', `INSERT INTO cups (rating, mode, flavours) VALUES (3, 'made_it', '["a","b","c","d","e"]')`);
// cup_axes (migration 11): 1–5 in halves, one row per cup and axis, gone with its cup.
db.exec(`INSERT INTO cups (id, rating, mode) VALUES (900, 3, 'made_it')`);
for (const v of [1, 1.5, 3, 4.5, 5]) accepts(`axis value ${v}`, `INSERT INTO cup_axes (cup_id, axis, value) VALUES (900, 'v${v}', ${v})`);
for (const v of ['3.7', '0.5', '5.5', '0', '-1', '2.25', "'high'", 'NULL'])
  rejects(`axis value ${v}`, `INSERT INTO cup_axes (cup_id, axis, value) VALUES (900, 'acidity', ${v})`);
accepts('axis value as text that is a stop (REAL affinity)', `INSERT INTO cup_axes (cup_id, axis, value) VALUES (900, 'acidity', '2.5')`);
rejects('a second row for the same cup and axis', `INSERT INTO cup_axes (cup_id, axis, value) VALUES (900, 'acidity', 3)`);
rejects('axis rows for a cup that is not there', `INSERT INTO cup_axes (cup_id, axis, value) VALUES (999, 'acidity', 3)`);
accepts('any axis id (the registry decides, not a CHECK list)', `INSERT INTO cup_axes (cup_id, axis, value) VALUES (900, 'a-sixth-axis', 3)`);
db.exec('DELETE FROM cups WHERE id = 900');
if ((db.prepare('SELECT COUNT(*) AS n FROM cup_axes WHERE cup_id = 900').get() as { n: number }).n !== 0) fail('cup_axes: rows outlived their cup (no cascade)');
rejects('copied bean process outside the list', `INSERT INTO cups (rating, mode, bean_process) VALUES (3, 'made_it', 'carbonic')`);
accepts('copied bean process other', `INSERT INTO cups (rating, mode, bean_process) VALUES (3, 'made_it', 'other')`);
rejects('unknown gear category', `INSERT INTO gear (name, category) VALUES ('x', 'tamper')`);
rejects('two default grinders', `INSERT INTO gear (name, category, is_default) VALUES ('g2', 'grinder', 1)`);
accepts('a second, non-default grinder', `INSERT INTO gear (name, category, is_default) VALUES ('g3', 'grinder', 0)`);
rejects('dangling brewer_id', `INSERT INTO cups (rating, mode, brewer_id) VALUES (3, 'made_it', 999)`);
rejects('a second settings row', `INSERT INTO settings (id) VALUES (2)`);
rejects('unknown coffee style', `UPDATE settings SET coffee_style = 'latte' WHERE id = 1`);
rejects('drinks_out not 0/1', `UPDATE settings SET drinks_out = 2 WHERE id = 1`);
{
  const n = (db.prepare('SELECT COUNT(*) AS n FROM settings').get() as { n: number }).n;
  if (n !== 1) fail(`settings: expected exactly one row after migrations, got ${n}`);
}
rejects('unknown place kind', `INSERT INTO places (name, kind) VALUES ('x', 'kiosk')`);
rejects('dangling bag_id', `INSERT INTO cups (rating, mode, bag_id) VALUES (3, 'made_it', 999)`);
rejects('duplicate external_id', `INSERT INTO places (name, kind, external_id) VALUES ('a', 'cafe', 'mk1'); INSERT INTO places (name, kind, external_id) VALUES ('b', 'cafe', 'mk1')`);

const minimal = db.prepare("INSERT INTO cups (rating, mode) VALUES (5, 'barista')").run();
const row = db.prepare('SELECT created_at, logged_at FROM cups WHERE id = ?').get(minimal.lastInsertRowid) as { created_at: number; logged_at: number };
if (!row.created_at || row.logged_at !== row.created_at) fail('a minimal cup (rating + mode) did not get created_at / logged_at defaults');

// Upgrade path: a version-1 database with data, then migration 2. Checks the
// copies are backfilled from the bag and unmapped values become NULL.
{
  const old = new DatabaseSync(':memory:');
  old.exec('PRAGMA foreign_keys = ON');
  old.exec(MIGRATIONS_TABLE);
  const run = (m: (typeof migrations)[number]) => apply(old, m, { record: false });
  await run(migrations[0]);
  old.exec(`INSERT INTO beans (id, name, roaster, origin, process, roast_level) VALUES (7, 'Kenya AA', 'Glitch', 'Kenya', 'other', 'medium-light')`);
  old.exec(`INSERT INTO beans (id, name, process, roast_level) VALUES (8, 'Brazil Cerrado', 'natural', 'dark')`);
  old.exec(`INSERT INTO cups (id, rating, mode, bean_id, grinder) VALUES (1, 4, 'made_it', 7, 'C40'), (2, 3, 'made_it', 8, NULL)`);
  for (const m of migrations.slice(1)) await run(m);
  const b7 = old.prepare('SELECT process, roast_level FROM bags WHERE id = 7').get() as { process: string | null; roast_level: string | null };
  if (b7.process !== null || b7.roast_level !== null) fail(`upgrade: 'other' / 'medium-light' should become NULL, got ${b7.process} / ${b7.roast_level}`);
  const c1 = old.prepare('SELECT bag_id, bean_name, bean_roaster, bean_origin, grinder, flavours, logged_at FROM cups WHERE id = 1').get() as Record<string, unknown>;
  if (c1.bag_id !== 7 || c1.bean_name !== 'Kenya AA' || c1.bean_roaster !== 'Glitch' || c1.bean_origin !== 'Kenya' || c1.grinder !== 'C40' || c1.flavours !== '[]' || !c1.logged_at)
    fail(`upgrade: cup 1 not carried over with its copies: ${JSON.stringify(c1)}`);
  const c2 = old.prepare('SELECT bean_process, bean_roast_level FROM cups WHERE id = 2').get() as Record<string, unknown>;
  if (c2.bean_process !== 'natural' || c2.bean_roast_level !== 'dark') fail(`upgrade: cup 2 copies wrong: ${JSON.stringify(c2)}`);
  // Deleting the bag keeps the cup and its copied details (the point of copying).
  old.exec('DELETE FROM bags WHERE id = 7');
  const after = old.prepare('SELECT bag_id, bean_name FROM cups WHERE id = 1').get() as Record<string, unknown>;
  if (after.bag_id !== null || after.bean_name !== 'Kenya AA') fail(`delete bag: cup should keep its copies with bag_id NULL, got ${JSON.stringify(after)}`);
  const trig = old.prepare(`SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'trigger' AND name = 'cups_logged_at_default'`).get() as { n: number };
  if (trig.n !== 1) fail('upgrade: logged_at trigger missing after the cups rebuild');
  old.prepare('INSERT INTO cups (rating, mode) VALUES (5, ?)').run('barista');
  const fresh = old.prepare('SELECT created_at, logged_at FROM cups ORDER BY id DESC LIMIT 1').get() as { created_at: number; logged_at: number };
  if (fresh.logged_at !== fresh.created_at) fail('upgrade: logged_at no longer defaults to created_at');
}

// Migration 3 on a version-2 database: an existing user is marked past setup.
// (Its dna_change replay was retired; migration 11 replays, tested below.)
{
  const d = new DatabaseSync(':memory:');
  d.exec('PRAGMA foreign_keys = ON');
  d.exec(MIGRATIONS_TABLE);
  for (const m of migrations.slice(0, 2)) {
    d.exec('BEGIN');
    for (const sql of m.statements) d.exec(sql);
    d.exec('COMMIT');
  }
  d.exec(`INSERT INTO cups (id, rating, mode) VALUES (1, 4, 'made_it')`);
  d.exec('BEGIN');
  for (const sql of migrations[2].statements) d.exec(sql);
  d.exec('COMMIT');
  const setup = d.prepare('SELECT setup_done FROM settings').get() as { setup_done: number };
  if (setup.setup_done !== 1) fail('migration 3: an existing user should be marked past setup');
}

// Migration 15: a database made empty after migration 3 (a fresh install),
// then used, still had setup_done 0; anything made marks it past setup. An
// empty one stays before setup.
for (const [what, insert] of [
  ['a cup', `INSERT INTO cups (id, created_at, logged_at, rating, mode) VALUES (1, 1, 1, 4, 'made_it')`],
  ['gear', `INSERT INTO gear (id, name, category, is_default, added_at) VALUES (1, 'V60', 'brewer', 1, 1)`],
  ['nothing', null],
] as const) {
  const d = new DatabaseSync(':memory:');
  d.exec('PRAGMA foreign_keys = ON');
  d.exec(MIGRATIONS_TABLE);
  for (const m of migrations.filter((m) => m.version < 15)) {
    d.exec('BEGIN');
    for (const sql of m.statements) d.exec(sql);
    d.exec('COMMIT');
  }
  if (insert) d.exec(insert);
  for (const sql of migrations.find((m) => m.version === 15)!.statements) d.exec(sql);
  const { setup_done } = d.prepare('SELECT setup_done FROM settings').get() as { setup_done: number };
  if (setup_done !== (insert ? 1 : 0)) fail(`migration 15 with ${what}: setup_done ${setup_done}, expected ${insert ? 1 : 0}`);
}

// Migration 11: a version-10 database with cups on the old bipolar columns.
// Only Body and Sweetness carry over (0–100 → 1–5, nearest whole step);
// Acidity and Roast become not noted (no row); the columns are gone; every
// dna_change is replayed on the new scale, deterministically, with the
// reset rule insertCup uses.
{
  const DAY = 86400000;
  const t0 = 1760000000000;
  const v10 = async () => {
    const d = new DatabaseSync(':memory:');
    d.exec('PRAGMA foreign_keys = ON');
    d.exec(MIGRATIONS_TABLE);
    for (const m of migrations.slice(0, 10)) {
      d.exec('BEGIN');
      for (const sql of m.statements) d.exec(sql);
      if (m.backfill) await m.backfill(asMigrationDb(d));
      d.exec('COMMIT');
    }
    d.exec(`INSERT INTO cups (id, rating, mode, logged_at, created_at, axis_acidity, axis_body, axis_roast, axis_sweetness, flavours, dna_change) VALUES
      (1, 4, 'made_it', ${t0}, ${t0}, 25, 30, 75, 100, '["Peach"]', '{"before":{},"after":{}}'),
      (2, NULL, 'made_it', ${t0 + DAY}, ${t0 + DAY}, 0, NULL, NULL, 0, '[]', NULL),
      (3, 2, 'made_it', ${t0 + 40 * DAY}, ${t0 + 40 * DAY}, 75, 50, 100, NULL, '["Smoke","Juicy"]', NULL),
      (4, 5, 'barista', ${t0 + 40 * DAY}, ${t0 + 40 * DAY}, NULL, NULL, NULL, NULL, '[]', NULL),
      (5, 5, 'made_it', ${t0 + 60 * DAY}, ${t0 + 60 * DAY}, NULL, 100, NULL, 50, '[]', NULL)`);
    d.exec(`UPDATE settings SET reset_at = ${t0 + 50 * DAY}`);
    d.exec('BEGIN');
    for (const sql of migrations[10].statements) d.exec(sql);
    await migrations[10].backfill!(asMigrationDb(d));
    d.exec('COMMIT');
    return d;
  };
  const a = await v10();
  const b = await v10();
  const axes = a.prepare('SELECT cup_id, axis, value FROM cup_axes ORDER BY cup_id, axis').all() as { cup_id: number; axis: string; value: number }[];
  const want = [
    [1, 'body', 2], [1, 'sweetness', 5], [2, 'sweetness', 1], [3, 'body', 3], [5, 'body', 5], [5, 'sweetness', 3],
  ];
  if (JSON.stringify(axes.map((r) => [r.cup_id, r.axis, r.value])) !== JSON.stringify(want))
    fail(`migration 11: cup_axes ${JSON.stringify(axes)} ≠ ${JSON.stringify(want)}`);
  const cols = (a.prepare('PRAGMA table_info(cups)').all() as { name: string }[]).map((c) => c.name);
  if (cols.some((c) => c.startsWith('axis_'))) fail(`migration 11: cups still has ${cols.filter((c) => c.startsWith('axis_'))}`);
  const rows = a.prepare(`SELECT c.id, c.rating, c.logged_at, c.flavours, ${axesJsonSql('c')} AS axes, c.dna_change FROM cups c ORDER BY c.logged_at, c.id`).all() as any[];
  const again = b.prepare('SELECT dna_change FROM cups ORDER BY logged_at, id').all() as { dna_change: string }[];
  const resetAt = t0 + 50 * DAY;
  const earlier: DnaCup[] = [];
  rows.forEach((row, i) => {
    const cup = dnaCupFromRow(row);
    const expected = JSON.stringify(changeOf(earlier, cup, cup.logged_at >= resetAt ? resetAt : null));
    if (row.dna_change !== expected) fail(`migration 11 replay: cup ${row.id} dna_change ${row.dna_change} ≠ ${expected}`);
    if (again[i].dna_change !== row.dna_change) fail(`migration 11 replay: not deterministic for cup ${row.id}`);
    earlier.push(cup);
  });
  const first = JSON.parse(rows[0].dna_change);
  if (first.before.body.value !== null || first.after.body.value !== 2 || first.after.body.n !== 1 || 'roast' in first.after)
    fail(`migration 11 replay: cup 1 should start from nothing on the 1–5 scale, no roast key; got ${rows[0].dna_change}`);
  const unrated = JSON.parse(rows[1].dna_change);
  if (JSON.stringify(unrated.before) !== JSON.stringify(unrated.after)) fail('migration 11 replay: an unrated cup must not move the profile');
  const afterReset = JSON.parse(rows[4].dna_change);
  if (afterReset.before.body.value !== null || afterReset.after.body.value !== 5) fail(`migration 11 replay: a cup after the reset should count from the reset; got ${rows[4].dna_change}`);
  // Restoring a version-10 backup runs the same migration (backupFormat.rebuild); deleting a cup takes its rows.
  a.exec('DELETE FROM cups WHERE id = 1');
  if ((a.prepare('SELECT COUNT(*) AS n FROM cup_axes WHERE cup_id = 1').get() as { n: number }).n !== 0) fail('migration 11: deleting a cup left its cup_axes rows');
}
{
  const fresh = db.prepare('SELECT setup_done, reset_at FROM settings').get() as { setup_done: number; reset_at: number | null };
  if (fresh.setup_done !== 0 || fresh.reset_at !== null) fail(`migration 3: a fresh install should have setup_done 0, reset_at NULL; got ${JSON.stringify(fresh)}`);
}

// Migration 4: a version-3 database with a product and a packaged cup. The
// product's brand and name become the cup's product_name; products is gone.
{
  const d = new DatabaseSync(':memory:');
  d.exec('PRAGMA foreign_keys = ON');
  d.exec(MIGRATIONS_TABLE);
  for (const m of migrations.slice(0, 3)) {
    d.exec('BEGIN');
    for (const sql of m.statements) d.exec(sql);
    d.exec('COMMIT');
  }
  d.exec(`INSERT INTO products (id, brand, name) VALUES (1, 'Boss Craft', 'Black'), (2, 'Seven Café', NULL)`);
  d.exec(`INSERT INTO cups (id, rating, mode, product_id) VALUES (1, 3, 'packaged', 1), (2, 4, 'packaged', 2), (3, 5, 'packaged', NULL)`);
  d.exec('BEGIN');
  for (const sql of migrations[3].statements) d.exec(sql);
  d.exec('COMMIT');
  const names = (d.prepare('SELECT product_name FROM cups ORDER BY id').all() as { product_name: string | null }[]).map((r) => r.product_name);
  if (JSON.stringify(names) !== JSON.stringify(['Boss Craft Black', 'Seven Café', null])) fail(`migration 4: product names ${JSON.stringify(names)}`);
  const left = d.prepare(`SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'products'`).get() as { n: number };
  if (left.n !== 0) fail('migration 4: products should be dropped');
  const trig4 = d.prepare(`SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'trigger' AND name = 'cups_logged_at_default'`).get() as { n: number };
  if (trig4.n !== 1) fail('migration 4: logged_at trigger missing after the rebuild');
}

// Migration 12: a version-11 database shaped like Uryu's phone (a bag with a
// process, a cup from it, its cup_axes rows). The rebuilds keep every row,
// cups.bag_id and every cup_axes row (foreign keys off); "other" is then
// accepted on both tables; the indexes, the trigger and the foreign keys work.
{
  const d = new DatabaseSync(':memory:');
  d.exec('PRAGMA foreign_keys = ON');
  d.exec(MIGRATIONS_TABLE);
  for (const m of migrations.slice(0, 11)) await apply(d, m);
  d.exec(`INSERT INTO bags (id, name, process, roast_level) VALUES (1, 'Kenya AA', 'natural', 'medium')`);
  d.exec(`INSERT INTO cups (id, rating, mode, bag_id, bean_name, bean_process) VALUES (1, 4, 'made_it', 1, 'Kenya AA', 'natural')`);
  d.exec(`INSERT INTO cup_axes (cup_id, axis, value) VALUES (1, 'acidity', 4), (1, 'bitterness', 1), (1, 'body', 3.5), (1, 'sweetness', 2), (1, 'aftertaste', 5)`);
  const before = JSON.stringify([d.prepare('SELECT * FROM bags').all(), d.prepare('SELECT * FROM cups').all(), d.prepare('SELECT * FROM cup_axes ORDER BY axis').all()]);
  await apply(d, migrations[11]);
  const after = JSON.stringify([d.prepare('SELECT * FROM bags').all(), d.prepare('SELECT * FROM cups').all(), d.prepare('SELECT * FROM cup_axes ORDER BY axis').all()]);
  if (before !== after) fail(`migration 12: rows changed in the rebuild\n    before ${before}\n    after  ${after}`);
  try {
    d.exec(`UPDATE bags SET process = 'other' WHERE id = 1; UPDATE cups SET bean_process = 'other' WHERE id = 1`);
  } catch (e) {
    fail(`migration 12: 'other' refused (${(e as Error).message})`);
  }
  const idx = (d.prepare(`SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'cups' AND sql IS NOT NULL ORDER BY name`).all() as { name: string }[]).map((r) => r.name).join();
  if (idx !== 'cups_bag_id,cups_bought_at_place_id,cups_brewer_id,cups_grinder_id,cups_logged_at,cups_place_id') fail(`migration 12: cups indexes ${idx}`);
  d.exec(`INSERT INTO cups (id, rating, mode, created_at) VALUES (2, 3, 'barista', 123)`);
  const fresh = d.prepare('SELECT logged_at FROM cups WHERE id = 2').get() as { logged_at: number };
  if (fresh.logged_at !== 123) fail('migration 12: the logged_at trigger is gone');
  d.exec('DELETE FROM cups WHERE id = 1');
  if ((d.prepare('SELECT COUNT(*) AS n FROM cup_axes').get() as { n: number }).n !== 0) fail('migration 12: cup_axes no longer cascades from cups');
  d.exec('DELETE FROM bags WHERE id = 1');
  try {
    d.exec(`INSERT INTO cups (rating, mode, bag_id) VALUES (3, 'made_it', 999)`);
    fail('migration 12: foreign keys not enforced after the rebuild');
  } catch {
    /* expected */
  }
}

if (problems.length) {
  console.error(`check:schema FAILED (${problems.length})\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
console.log(`check:schema OK — ${migrations.length} migration(s), ${declared.length} tables match schema.ts; seed: ${cups.length} cups across ${modes.size} modes; constraints enforced.`);
