import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { asSqlDb, inTransaction } from './migrate';
import { BackupError, copyInto, countBackup, parseBackup, photoIdsOf, rebuild, type Backup, type Tables } from './backupFormat';
import { restorePhoto } from './photos';
import { notifyEverythingChanged } from './repository';

/**
 * Restore from a backup (design/import-v1.md; planner, 2026-11-08): the files
 * and the phone's side of backupFormat.ts. Three steps, so the UI can ask
 * before anything is written:
 *   chooseBackupFile()   the iOS file picker; null when cancelled
 *   readBackupFile(uri)  read and check it; counts for the confirm sheet
 *   restoreBackup(db, b) rebuild in a scratch database (in memory), copy
 *                        into the live one in one transaction, then the photos
 * Only into an empty app: restoreBackup throws BackupError 'not_empty'
 * otherwise, and nothing is written.
 *
 * TODO: the Restore row and its sheets are Design's (Round 23). Until then
 * nothing calls this. BackupError's messages are PROVISIONAL copy.
 */
export { BackupError };

/** The picker: a zip (format 2) or the older JSON (format 1). Copied to the cache, so the file can be read. */
export async function chooseBackupFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/zip', 'application/json'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  return result.canceled ? null : result.assets[0].uri;
}

export type BackupSummary = ReturnType<typeof countBackup> & { exportedAt: Date };

/** Read and check a chosen file. Throws BackupError for anything that isn't a backup this app can read. */
export async function readBackupFile(uri: string): Promise<{ backup: Backup; summary: BackupSummary }> {
  const backup = parseBackup(await new File(uri).bytes());
  return { backup, summary: { ...countBackup(backup), exportedAt: new Date(backup.body.exported_at) } };
}

/**
 * Put the backup into the live database, then its photos. Returns the ids of
 * photos the rows point at that couldn't be restored (missing from the file,
 * or not restyled): their bags show the placeholder, or the original.
 */
export async function restoreBackup(
  db: SQLite.SQLiteDatabase,
  backup: Backup,
  /** Called before the first photo and after each one: Restore's "Photos 18 of 31". */
  onPhoto?: (done: number, total: number) => void
): Promise<{ photosMissing: string[] }> {
  const scratch = await SQLite.openDatabaseAsync(':memory:');
  let tables: Tables;
  try {
    tables = await rebuild(asSqlDb(scratch), backup.body);
  } finally {
    await scratch.closeAsync();
  }
  await inTransaction(db, (tx) => copyInto(asSqlDb(tx), tables));

  // After the commit: a photo written before a failed copy would only be
  // swept on the next launch (sweepPhotos), but there's no reason to risk it.
  const photosMissing: string[] = [];
  const ids = photoIdsOf(tables);
  onPhoto?.(0, ids.length);
  for (const [i, id] of ids.entries()) {
    const bytes = backup.photos.get(id);
    if (!bytes || !(await restorePhoto(id, bytes))) photosMissing.push(id);
    onPhoto?.(i + 1, ids.length);
  }
  notifyEverythingChanged();
  return { photosMissing };
}
