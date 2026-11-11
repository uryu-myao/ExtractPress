import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import { BACKUP_FORMAT, packBackup, photoIdsOf, readTables } from './backupFormat';
import { cupsCsv, type CsvCup } from './csv';
import { asSqlDb } from './migrate';
import { originalBytes } from './photos';

/**
 * Two ways out, 6b's two My data rows (2026-10-28), each a file handed to
 * the iOS share sheet:
 *   shareCupsCsv  "Export my cups": the cups as a spreadsheet (csv.ts)
 *   shareBackup   "Export everything" (6b's Backup row): every table and,
 *                 since 2026-11-08, the photos, as one zip (backupFormat.ts),
 *                 which Restore reads back (backup.ts, design/import-v1.md).
 *                 INTERIM (todo.md T-8): it holds 6b's Backup row until the
 *                 real backup is built. 6b's Backup saves by itself ("Last
 *                 saved today, 08:24"); this is a manual export of
 *                 everything, a different thing, and the only way the bags'
 *                 and gear's own records (size, default, finished on) get out.
 * The CSV is export only; the zip is read back by Restore.
 *
 * The JSON inside the zip (2026-10-20):
 *
 * Every table as stored, rows untouched (ids, epoch-ms times, JSON columns as
 * their text), found from sqlite_master so a new table is never left out.
 * schema_migrations rides along: it says which schema the rows are in.
 *
 * Read through SQL, never by copying the database file: the rows mostly live
 * in extract.db-wal until a checkpoint, so the .db alone can be empty.
 *
 * Both files are written with await before sharing (2026-11-08): File.write
 * is asynchronous, and the share sheet could open on a file still being written.
 */

/** Local date as YYYY-MM-DD, for the file name. */
function localDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Write "Extract Press backup YYYY-MM-DD.zip" to the cache and open the share
 * sheet on it (Design Round 23: Restore's "not a backup" refusal names it).
 */
export async function shareBackup(db: SQLiteDatabase): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  const now = new Date();
  const { schemaVersion, tables } = await readTables(asSqlDb(db));
  const body = {
    app: 'ExtractPress',
    format: BACKUP_FORMAT,
    exported_at: now.toISOString(),
    schema_version: schemaVersion,
    tables,
  };
  // The originals; a photo whose file is gone is left out (Restore then shows the placeholder).
  const photos = new Map<string, Uint8Array>();
  for (const id of photoIdsOf(tables)) {
    const bytes = await originalBytes(id);
    if (bytes) photos.set(id, bytes);
  }
  // Cache: the file only has to live until the share sheet has taken it.
  const file = new File(Paths.cache, `Extract Press backup ${localDate(now)}.zip`);
  await file.write(packBackup(body, photos));
  await Sharing.shareAsync(file.uri, { UTI: 'public.zip-archive', mimeType: 'application/zip' });
}

/** Every cup with its café's name as copied at logging (migration 6), for the sheet. */
export async function listCsvCups(db: SQLiteDatabase): Promise<CsvCup[]> {
  const rows = await db.getAllAsync<Omit<CsvCup, 'flavours'> & { flavours: string }>(
    `SELECT c.id, c.logged_at, c.mode, c.rating, c.note, c.flavours,
            c.bean_name, c.bean_roaster, c.bean_origin, c.bean_region, c.bean_process, c.bean_roast_level, c.bean_roasted_at,
            c.brew_method, c.grinder, c.axis_acidity, c.axis_body, c.axis_roast, c.axis_sweetness,
            c.drink_type, c.place_name, c.product_name
       FROM cups c
      ORDER BY c.logged_at, c.id`
  );
  return rows.map((row) => ({ ...row, flavours: JSON.parse(row.flavours) }));
}

/**
 * Write extract-cups-YYYY-MM-DD.csv to the cache and open the share sheet
 * on it (the date says what the file is once it is in someone's Files).
 */
export async function shareCupsCsv(db: SQLiteDatabase): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  const file = new File(Paths.cache, `extract-cups-${localDate(new Date())}.csv`);
  await file.write(cupsCsv(await listCsvCups(db)));
  await Sharing.shareAsync(file.uri, { UTI: 'public.comma-separated-values-text', mimeType: 'text/csv' });
}
