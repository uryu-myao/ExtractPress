// Backup round trip (design/import-v1.md): what "Export everything" writes,
// Restore reads back to the same rows, under node:sqlite. Also: a file from
// an older schema comes up through the later migrations, files from before
// the rename are read, and every refusal refuses without writing.
// Run: npm run check:backup
import { DatabaseSync } from 'node:sqlite';
import { seedStatements } from '../src/data/dev/seed.ts';
import {
  BACKUP_FORMAT,
  BackupError,
  copyInto,
  packBackup,
  parseBackup,
  readTables,
  rebuild,
  type BackupBody,
  type SqlDb,
  type Tables,
} from '../src/data/backupFormat.ts';
import { MIGRATIONS_TABLE, migrations } from '../src/data/migrations.ts';

const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);

const asSqlDb = (d: DatabaseSync): SqlDb => ({
  exec: async (sql) => {
    d.exec(sql);
  },
  all: async <T,>(sql: string, params: (string | number | null)[] = []) => d.prepare(sql).all(...params).map((r) => ({ ...r })) as T[],
  run: async (sql, params = []) => {
    d.prepare(sql).run(...params);
  },
});

/** A database as the app makes it, migrated up to `version`. */
async function appDb(version = migrations[migrations.length - 1].version): Promise<DatabaseSync> {
  const d = new DatabaseSync(':memory:');
  d.exec('PRAGMA foreign_keys = ON');
  d.exec(MIGRATIONS_TABLE);
  const db = asSqlDb(d);
  for (const m of migrations) {
    if (m.version > version) break;
    for (const sql of m.statements) d.exec(sql);
    if (m.backfill) await m.backfill({ all: db.all, run: db.run });
    d.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(m.version, m.name, 1);
  }
  return d;
}

const bodyOf = async (d: DatabaseSync, app = 'ExtractPress', format = BACKUP_FORMAT): Promise<BackupBody> => {
  const { schemaVersion, tables } = await readTables(asSqlDb(d));
  return { app, format, exported_at: '2026-11-08T09:00:00.000Z', schema_version: schemaVersion, tables };
};

/** Restore into `live` as the app does: rebuild in a scratch database, copy in one transaction. */
async function restore(live: DatabaseSync, bytes: Uint8Array): Promise<Tables> {
  const backup = parseBackup(bytes);
  const tables = await rebuild(asSqlDb(new DatabaseSync(':memory:')), backup.body);
  live.exec('BEGIN');
  try {
    await copyInto(asSqlDb(live), tables);
    live.exec('COMMIT');
  } catch (error) {
    live.exec('ROLLBACK');
    throw error;
  }
  return tables;
}

const userTables = async (d: DatabaseSync) => {
  const { tables } = await readTables(asSqlDb(d));
  delete tables.schema_migrations;
  return JSON.stringify(tables);
};

async function refuses(label: string, reason: BackupError['reason'], run: () => Promise<unknown>) {
  try {
    await run();
    fail(`${label}: accepted, expected refusal (${reason})`);
  } catch (error) {
    if (!(error instanceof BackupError)) fail(`${label}: threw ${(error as Error).message}, not a BackupError`);
    else if (error.reason !== reason) fail(`${label}: refused as ${error.reason}, expected ${reason}`);
  }
}

const json = (body: unknown) => new TextEncoder().encode(JSON.stringify(body));

// 1. Round trip at the latest schema, with a photo.
const source = await appDb();
for (const s of seedStatements()) source.prepare(s.sql).run(...(s.params as (string | number | null)[]));
source.prepare('UPDATE bags SET photo_uri = ? WHERE id = (SELECT MIN(id) FROM bags)').run('mh2k1a9x3f');
source.prepare('INSERT INTO search_history (term, searched_at) VALUES (?, ?)').run('guji', 1);
source.prepare('UPDATE settings SET coffee_style = ? WHERE id = 1').run('black');
const photo = new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3, 0xff, 0xd9]);
const zip = packBackup(await bodyOf(source), new Map([['mh2k1a9x3f', photo], ['../escape', photo]]));
const parsed = parseBackup(zip);
if (parsed.photos.size !== 1 || parsed.photos.get('mh2k1a9x3f')?.join() !== photo.join()) fail('the photo did not come back from the zip as written');
if ([...parsed.photos.keys()].some((id) => id.includes('/') || id.includes('.'))) fail('an unsafe photo name came out of the zip');
const live = await appDb();
await restore(live, zip);
if ((await userTables(live)) !== (await userTables(source))) fail('round trip: the restored rows differ from the exported ones');
const cups = (live.prepare('SELECT COUNT(*) AS n FROM cups').get() as { n: number }).n;

// 2. Only into an empty app, and a refusal writes nothing.
const before = await userTables(live);
await refuses('restore over records', 'not_empty', () => restore(live, zip));
if ((await userTables(live)) !== before) fail('a refused restore changed the database');

// 3. Format 1 (bare JSON) from before the rename.
const old = await appDb();
await restore(old, json(await bodyOf(source, 'MoreCoffee', 1)));
if ((await userTables(old)) !== (await userTables(source))) fail("format 1 with app 'MoreCoffee': rows differ");

// 4. An older schema comes up through the later migrations (5 → 6: café names copied, drinks put in one form).
const v5 = await appDb(5);
v5.prepare("INSERT INTO places (id, name, kind) VALUES (1, 'Fuglen', 'cafe')").run();
v5.prepare("INSERT INTO cups (id, created_at, logged_at, rating, mode, place_id, drink_type) VALUES (1, 1, 1, 5, 'barista', 1, '  flat  white')").run();
const fromV5 = await appDb();
await restore(fromV5, json(await bodyOf(v5)));
const cup = fromV5.prepare('SELECT place_name, drink_type FROM cups WHERE id = 1').get() as { place_name: string; drink_type: string };
if (cup?.place_name !== 'Fuglen') fail(`v5 file: place_name ${cup?.place_name}, expected Fuglen (migration 6's copy)`);
if (cup?.drink_type !== 'Flat white') fail(`v5 file: drink_type "${cup?.drink_type}", expected "Flat white" (migration 6's backfill)`);

// 5. This phone's tables (LOCAL_TABLES) never go in a file, and a restore leaves them as they were.
const fresh = await appDb();
fresh.prepare("INSERT INTO notices (id, delivered_at, read_at) VALUES ('welcome', 5, 6)").run();
fresh.prepare("UPDATE device SET notices_version = '1.0.0', notify_stale = 1 WHERE id = 1").run();
const localBody = await bodyOf(fresh);
if ('notices' in localBody.tables || 'device' in localBody.tables) fail('a backup carries notices or device (this phone\'s own)');
await restore(fresh, zip);
const kept = fresh.prepare('SELECT read_at FROM notices WHERE id = ?').get('welcome') as { read_at: number } | undefined;
if (kept?.read_at !== 6) fail('a restore wiped or changed the notices delivered on this phone');
const device = fresh.prepare('SELECT notices_version, notify_stale FROM device WHERE id = 1').get() as { notices_version: string; notify_stale: number } | undefined;
if (device?.notices_version !== '1.0.0' || device?.notify_stale !== 1) fail("a restore changed this phone's device row");

// 6. Refusals.
const body = await bodyOf(source);
await refuses('another app', 'not_a_backup', async () => parseBackup(json({ ...body, app: 'Other' })));
await refuses('not JSON', 'not_a_backup', async () => parseBackup(new TextEncoder().encode('hello')));
await refuses('a newer schema', 'too_new', async () => parseBackup(json({ ...body, schema_version: 99 })));
await refuses('a newer format', 'too_new', async () => parseBackup(json({ ...body, format: 3 })));
await refuses('an unknown column', 'broken', async () => restore(await appDb(), json({ ...body, tables: { ...body.tables, bags: [{ id: 1, name: 'x', colour: 'red' }] } })));
await refuses('a broken constraint', 'broken', async () => restore(await appDb(), json({ ...body, tables: { ...body.tables, cups: [{ id: 1, mode: 'tea' }] } })));
await refuses('a cup pointing at a missing bag', 'broken', async () =>
  restore(await appDb(), json({ ...body, tables: { bags: [], cups: [{ id: 1, created_at: 1, logged_at: 1, rating: 4, mode: 'made_it', bag_id: 42 }] } }))
);

if (problems.length) {
  console.error(`check:backup FAILED (${problems.length})\n  - ${problems.slice(0, 30).join('\n  - ')}`);
  process.exit(1);
}
console.log(`check:backup OK — ${cups} cups and a photo round-trip through the zip; format 1 and app 'MoreCoffee' read; a v5 file migrates up; only into an empty app; this phone's notices and device row untouched; 7 refusals.`);
