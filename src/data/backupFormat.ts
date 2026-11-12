import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate';
import { migrations } from './migrations.ts';

/**
 * The backup file and putting it back (design/import-v1.md, in V1 since
 * 2026-11-08). Pure: no Expo, no files. backup.ts reads and writes the files
 * and the photos; scripts/check-backup.ts runs all of this under node:sqlite.
 *
 * The file:
 *   format 2 (2026-11-08)  a zip: backup.json, plus photos/<id>.jpg, the
 *                          ORIGINAL of every kept photo. The styled copy is
 *                          not carried: restyling the original remakes it
 *                          (photos.ts), which halves the size.
 *   format 1 (2026-10-20)  backup.json on its own, no photos. Still read.
 * backup.json is { app, format, exported_at, schema_version, tables }:
 * every table as stored, rows untouched (export.ts). `app` is 'ExtractPress',
 * or 'MoreCoffee' in files from before the rename (2026-11-08); both are read.
 *
 * Putting it back (restore):
 *   1. rebuild: a scratch database is migrated to the file's schema version,
 *      the rows go in as they are, and the later migrations run over them,
 *      as an old install updating would. So a file from any past version
 *      reads, and every backfill runs as written. Ids are kept: every link
 *      between tables is an id.
 *   2. copyInto: in one transaction on the live database, which must be
 *      empty (no cups, bags, gear or places). Never a merge, never an
 *      overwrite (planner, 2026-11-08).
 */
export const BACKUP_FORMAT = 2;
export const BACKUP_JSON = 'backup.json';
const APPS = ['ExtractPress', 'MoreCoffee'];
const LATEST = migrations[migrations.length - 1].version;

type Value = string | number | null;
export type Row = Record<string, Value>;
export type Tables = Record<string, Row[]>;
export type BackupBody = { app: string; format: number; exported_at: string; schema_version: number; tables: Tables };
export type Backup = { body: BackupBody; photos: Map<string, Uint8Array> };

/** What either driver gives: expo-sqlite on the phone, node:sqlite in scripts. */
export type SqlDb = {
  exec(sql: string): Promise<void>;
  all<T>(sql: string, params?: Value[]): Promise<T[]>;
  run(sql: string, params?: Value[]): Promise<void>;
};

/** A refusal the user can act on; the message is shown as it is. */
export class BackupError extends Error {
  // A plain field, not a parameter property: node runs this file with types stripped only.
  readonly reason: 'not_a_backup' | 'too_new' | 'broken' | 'not_empty';
  constructor(reason: BackupError['reason'], message: string) {
    super(message);
    this.reason = reason;
  }
}

/**
 * This phone's own tables (migration 8): which notices were delivered and
 * read here, and 8i's switch, whose iOS permission is per phone. Never
 * written to a file, never read from one, and a restore leaves the live
 * ones as they are. Not optional: copyInto empties every table the rebuild
 * returns, so a table missing here would be wiped by a restore.
 */
export const LOCAL_TABLES = new Set(['notices', 'device']);
/** Never in a backup's tables: the bookkeeping is the live database's own, and so are LOCAL_TABLES. */
const SKIP = new Set(['schema_migrations', ...LOCAL_TABLES]);
/** "Empty" for a restore (planner, 2026-11-08): what the user made. Settings and search history don't count. */
const OWN_TABLES = ['cups', 'bags', 'gear', 'places'];

/** A photo id as photos.ts makes them (base36). Anything else in a zip is ignored, never used as a path. */
export const isPhotoId = (id: unknown): id is string => typeof id === 'string' && /^[a-z0-9]{1,40}$/.test(id);

/** Every table, as stored, for the file (LOCAL_TABLES left out). */
export async function readTables(db: SqlDb): Promise<{ schemaVersion: number; tables: Tables }> {
  const names = await db.all<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  const tables: Tables = {};
  for (const { name } of names) {
    if (LOCAL_TABLES.has(name)) continue;
    // Names come from sqlite_master, not from input; quoted as identifiers.
    tables[name] = await db.all<Row>(`SELECT * FROM ${quote(name)}`);
  }
  const row = await db.all<{ version: number | null }>('SELECT MAX(version) AS version FROM schema_migrations');
  return { schemaVersion: row[0]?.version ?? 0, tables };
}

/** The photo ids the rows point at (bags, gear and cups keep a photo's id in photo_uri). */
export function photoIdsOf(tables: Tables): string[] {
  const ids = new Set<string>();
  for (const name of ['bags', 'gear', 'cups']) {
    for (const row of tables[name] ?? []) if (isPhotoId(row.photo_uri)) ids.add(row.photo_uri);
  }
  return [...ids];
}

/** The zip: backup.json, then the originals. JPEGs are stored as they are (they don't compress). */
export function packBackup(body: BackupBody, photos: Map<string, Uint8Array>): Uint8Array {
  const files: Zippable = { [BACKUP_JSON]: [strToU8(JSON.stringify(body, null, 2)), { level: 6 }] };
  for (const [id, bytes] of photos) if (isPhotoId(id)) files[`photos/${id}.jpg`] = [bytes, { level: 0 }];
  return zipSync(files);
}

/** Read a chosen file: a zip (format 2) or a bare JSON (format 1). Throws BackupError. */
export function parseBackup(bytes: Uint8Array): Backup {
  const isZip = bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  let json: string;
  const photos = new Map<string, Uint8Array>();
  if (isZip) {
    let entries: Record<string, Uint8Array>;
    try {
      entries = unzipSync(bytes);
    } catch {
      throw new BackupError('broken', "This zip can't be opened.");
    }
    if (!entries[BACKUP_JSON]) throw new BackupError('not_a_backup', "This isn't an Extract Press backup.");
    json = strFromU8(entries[BACKUP_JSON]);
    for (const [path, data] of Object.entries(entries)) {
      const match = /^photos\/([^/]+)\.jpg$/.exec(path);
      if (match && isPhotoId(match[1])) photos.set(match[1], data);
    }
  } else {
    json = strFromU8(bytes);
  }
  let body: unknown;
  try {
    body = JSON.parse(json);
  } catch {
    throw new BackupError('not_a_backup', "This isn't an Extract Press backup.");
  }
  return { body: checkBody(body), photos };
}

function checkBody(body: unknown): BackupBody {
  const b = body as Partial<BackupBody> | null;
  if (!b || typeof b !== 'object' || !APPS.includes(b.app as string) || typeof b.tables !== 'object' || b.tables === null) {
    throw new BackupError('not_a_backup', "This isn't an Extract Press backup.");
  }
  if (b.format !== 1 && b.format !== 2) throw new BackupError('too_new', 'This backup was made by a newer version of the app. Update the app, then try again.');
  const version = b.schema_version;
  if (!Number.isInteger(version) || (version as number) < 1) throw new BackupError('broken', 'This backup is damaged.');
  if ((version as number) > LATEST) throw new BackupError('too_new', 'This backup was made by a newer version of the app. Update the app, then try again.');
  for (const [name, rows] of Object.entries(b.tables)) {
    if (!Array.isArray(rows)) throw new BackupError('broken', 'This backup is damaged.');
    for (const row of rows) {
      if (!row || typeof row !== 'object') throw new BackupError('broken', 'This backup is damaged.');
      for (const value of Object.values(row)) {
        if (value !== null && typeof value !== 'string' && typeof value !== 'number') throw new BackupError('broken', `This backup is damaged (${name}).`);
      }
    }
  }
  return b as BackupBody;
}

/** How much a backup holds, for the confirm sheet. */
export function countBackup({ body, photos }: Backup): { cups: number; bags: number; gear: number; places: number; photos: number } {
  const n = (t: string) => body.tables[t]?.length ?? 0;
  const wanted = photoIdsOf(body.tables);
  return { cups: n('cups'), bags: n('bags'), gear: n('gear'), places: n('places'), photos: wanted.filter((id) => photos.has(id)).length };
}

/**
 * Step 1. `scratch` is a new, empty database (in memory on the phone). Returns
 * every table at the latest schema, ready for copyInto. Throws BackupError
 * when the rows don't fit their schema (an unknown table or column, a broken
 * constraint, a link to a row that isn't there).
 */
export async function rebuild(scratch: SqlDb, body: BackupBody): Promise<Tables> {
  await scratch.exec('PRAGMA foreign_keys = OFF');
  const migrate = async (from: number, to: number) => {
    for (const m of migrations) {
      if (m.version <= from || m.version > to) continue;
      for (const sql of m.statements) await scratch.exec(sql);
      if (m.backfill) await m.backfill({ all: (sql, params) => scratch.all(sql, params), run: (sql, params) => scratch.run(sql, params) });
    }
  };
  await scratch.exec('CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY)');
  await migrate(0, body.schema_version);

  const columns = await columnsOf(scratch);
  try {
    for (const [name, rows] of Object.entries(body.tables)) {
      if (SKIP.has(name)) continue;
      const known = columns.get(name);
      if (!known) throw new BackupError('broken', `This backup is damaged (no table ${name}).`);
      for (const row of rows) {
        const cols = Object.keys(row);
        const unknown = cols.find((c) => !known.has(c));
        if (unknown) throw new BackupError('broken', `This backup is damaged (${name}.${unknown}).`);
        // OR REPLACE: settings' one row (id 1) is made by migration 1.
        await scratch.run(
          `INSERT OR REPLACE INTO ${quote(name)} (${cols.map(quote).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
          cols.map((c) => row[c])
        );
      }
    }
  } catch (error) {
    if (error instanceof BackupError) throw error;
    throw new BackupError('broken', `This backup is damaged (${(error as Error).message}).`);
  }
  const orphans = await scratch.all('PRAGMA foreign_key_check');
  if (orphans.length) throw new BackupError('broken', 'This backup is damaged (a record points at one that is missing).');

  await migrate(body.schema_version, LATEST);
  const { tables } = await readTables(scratch);
  for (const name of SKIP) delete tables[name];
  return tables;
}

/** Whether the live database holds anything the user made. */
export async function isEmpty(db: SqlDb): Promise<boolean> {
  for (const name of OWN_TABLES) {
    const [{ n }] = await db.all<{ n: number }>(`SELECT COUNT(*) AS n FROM ${quote(name)}`);
    if (n > 0) return false;
  }
  return true;
}

/**
 * Step 2, inside the caller's transaction on the live database. Refuses
 * unless it is empty. Every table the rebuild returned replaces the live
 * one's rows (empty but for settings' row and search history).
 */
export async function copyInto(live: SqlDb, tables: Tables): Promise<void> {
  if (!(await isEmpty(live))) throw new BackupError('not_empty', 'Restore works on an empty app. Records have been added here since it was installed.');
  // Checked at commit, so the tables can go in any order.
  await live.exec('PRAGMA defer_foreign_keys = ON');
  const columns = await columnsOf(live);
  for (const [name, rows] of Object.entries(tables)) {
    const known = columns.get(name);
    if (!known) throw new BackupError('broken', `This app has no table ${name}.`);
    await live.run(`DELETE FROM ${quote(name)}`);
    for (const row of rows) {
      const cols = Object.keys(row).filter((c) => known.has(c));
      await live.run(`INSERT INTO ${quote(name)} (${cols.map(quote).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`, cols.map((c) => row[c]));
    }
  }
}

async function columnsOf(db: SqlDb): Promise<Map<string, Set<string>>> {
  const names = await db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'");
  const map = new Map<string, Set<string>>();
  for (const { name } of names) {
    const info = await db.all<{ name: string }>(`PRAGMA table_info(${quote(name)})`);
    map.set(name, new Set(info.map((c) => c.name)));
  }
  return map;
}

const quote = (identifier: string) => `"${identifier.replace(/"/g, '""')}"`;
