import { Directory, File, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';
import { renderPhoto, restylePhoto } from '../../modules/photo-style';
import { PHOTO_STYLE } from '../constants/photoStyle';

/**
 * Where photos live (Uryu, 2026-11-01). A row keeps only a photo's id, a
 * basename (`bags.photo_uri`, despite the column's name); both files follow
 * from it:
 *   Documents/photos/<id>.jpg         the original, upright, long side 1200
 *   Documents/photos/<id>-styled.jpg  the styled copy, what the app shows
 * Never a full path or URI in the database: the app's container moves on
 * every reinstall and update, so an absolute path stops pointing anywhere.
 *
 * Documents is in the iCloud / Finder backup, as the database is
 * (data-model.md, "WAL and backups"): a restore brings both back together.
 *
 * Adding a photo is two steps, so nothing is kept before the user agrees
 * (the confirm screen shows the styled copy, never the original):
 *   preparePhoto(picked)  renders both files into the cache; nothing stored
 *   keepPhoto(id)         moves them into Documents/photos, after Save
 *   dropPhoto(id)         a prepared photo not kept
 * deletePhoto(id) removes a kept one with its row.
 *
 * The originals are kept so the style can change: restyleAll() re-makes
 * every styled copy from its original (photoStyle.js says when).
 */
const KEPT = new Directory(Paths.document, 'photos');
const PENDING = new Directory(Paths.cache, 'photos-pending');

const original = (dir: Directory, id: string) => new File(dir, `${id}.jpg`);
const styled = (dir: Directory, id: string) => new File(dir, `${id}-styled.jpg`);

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** A photo ready to confirm: its id and the styled copy to show. */
export type PendingPhoto = { id: string; uri: string };

export async function preparePhoto(pickedUri: string): Promise<PendingPhoto> {
  PENDING.create({ intermediates: true, idempotent: true });
  const id = newId();
  // Both or neither (the module removes the original if the styled copy fails).
  await renderPhoto(pickedUri, original(PENDING, id).uri, styled(PENDING, id).uri, PHOTO_STYLE);
  return { id, uri: styled(PENDING, id).uri };
}

export async function keepPhoto(id: string): Promise<void> {
  KEPT.create({ intermediates: true, idempotent: true });
  await original(PENDING, id).move(original(KEPT, id));
  await styled(PENDING, id).move(styled(KEPT, id));
}

export function dropPhoto(id: string): void {
  for (const file of [original(PENDING, id), styled(PENDING, id)]) if (file.exists) file.delete();
}

export function deletePhoto(id: string | null | undefined): void {
  if (!id) return;
  for (const file of [original(KEPT, id), styled(KEPT, id)]) {
    try {
      if (file.exists) file.delete();
    } catch (error) {
      console.warn('[photos] could not delete', file.uri, error);
    }
  }
}

/**
 * What to show for a kept photo: the styled copy; if only the original is
 * there (a re-style that stopped half way), the original rather than
 * nothing; with neither, null (the placeholder).
 */
export function photoUri(id: string | null | undefined): string | null {
  if (!id) return null;
  // The file's time in the URI, so a re-styled copy isn't shown from the
  // image cache under the same name.
  const s = styled(KEPT, id);
  if (s.exists) return `${s.uri}?v=${s.lastModified ?? 0}`;
  const o = original(KEPT, id);
  if (o.exists) {
    console.warn('[photos] styled copy missing, showing the original', id);
    return `${o.uri}?v=${o.lastModified ?? 0}`;
  }
  return null;
}

/**
 * Re-make every kept photo's styled copy from its original, in the current
 * PHOTO_STYLE. Not run by itself (photoStyle.js): call it after changing the
 * style. Returns how many were re-made and which failed.
 */
export async function restyleAll(db: SQLiteDatabase): Promise<{ done: number; failed: string[] }> {
  const rows = await db.getAllAsync<{ id: string }>(
    `SELECT photo_uri AS id FROM bags WHERE photo_uri IS NOT NULL
     UNION SELECT photo_uri FROM gear WHERE photo_uri IS NOT NULL
     UNION SELECT photo_uri FROM cups WHERE photo_uri IS NOT NULL`
  );
  const failed: string[] = [];
  let done = 0;
  for (const { id } of rows) {
    try {
      await restylePhoto(original(KEPT, id).uri, styled(KEPT, id).uri, PHOTO_STYLE);
      done += 1;
    } catch (error) {
      console.warn('[photos] restyle failed', id, error);
      failed.push(id);
    }
  }
  return { done, failed };
}

/**
 * On launch: remove kept photo files no row points at, and anything left
 * pending by a sheet that never finished. This is how a deleted bag's photo
 * goes (a delete anywhere, no screen has to remember the files), and how a
 * crash between "kept" and "saved" doesn't leave files behind for ever.
 */
export async function sweepPhotos(db: SQLiteDatabase): Promise<void> {
  try {
    if (PENDING.exists) PENDING.delete();
    if (!KEPT.exists) return;
    const rows = await db.getAllAsync<{ id: string }>(
      `SELECT photo_uri AS id FROM bags WHERE photo_uri IS NOT NULL
       UNION SELECT photo_uri FROM gear WHERE photo_uri IS NOT NULL
       UNION SELECT photo_uri FROM cups WHERE photo_uri IS NOT NULL`
    );
    const used = new Set(rows.map((r) => r.id));
    for (const entry of KEPT.list()) {
      const id = entry.name.replace(/(-styled)?\.jpg$/, '');
      if (entry instanceof File && !used.has(id)) entry.delete();
    }
  } catch (error) {
    console.warn('[photos] sweep failed', error);
  }
}
