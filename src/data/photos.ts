import { Directory, File, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';
import { cutOut, writeOriginal, type CutoutBox, type CutoutEdges } from '../../modules/photo-style';
import { notifyShelfChanged } from './repository';

/**
 * Where photos live (Uryu, 2026-11-01). A row keeps only a photo's id, a
 * basename (`photo_uri`, despite the column's name); its files follow from it:
 *   Documents/photos/<id>.jpg         the original, upright, long side 1200,
 *                                     what the app shows (full colour since
 *                                     2026-11-23, Design Round 31)
 *   Documents/photos/<id>-cut.heic    a bag's cutout, HEIC with alpha
 *   Documents/photos/<id>-cut-s.heic  the same, long side 400, for the shelf
 * Never a full path or URI in the database: the app's container moves on
 * every reinstall and update, so an absolute path stops pointing anywhere.
 *
 * Documents is in the iCloud / Finder backup, as the database is
 * (data-model.md, "WAL and backups"): a restore brings both back together.
 * The app's own backup file carries originals only; cutouts are made again.
 *
 * Adding a photo is two steps, so nothing is kept before the user agrees:
 *   preparePhoto(picked)  writes the original into the cache; nothing stored
 *   keepPhoto(id)         moves it into Documents/photos, after Save
 *   dropPhoto(id)         a prepared photo not kept
 * deletePhoto(id) removes a kept one with its row.
 *
 * Add a bag lifts its photo while it is still pending (Design Turn 37, 38b:
 * the lift is the confirmation, played on the page): liftPhoto(pending)
 * writes the cutouts next to the pending original, keepPhoto moves them
 * with it, and the bag is stored with the code liftPhoto gave
 * (insertBag's photoCutout), so makeCutouts has nothing left to do for it.
 *
 * Cutouts (bags only): never made while the user waits. After a bag's photo
 * is set, and on every launch, makeCutouts() works through the bags whose
 * photo_cutout is NULL (not tried), and those whose cutout files have gone
 * (a restore), and records the result (schema.ts bags.photo_cutout).
 *
 * The duotone copies (<id>-styled.jpg, 2026-11-01 to 2026-11-23) are no
 * longer made or shown; sweepPhotos() deletes them.
 */
const KEPT = new Directory(Paths.document, 'photos');
const PENDING = new Directory(Paths.cache, 'photos-pending');

/** The kept original: its long side and JPEG quality (the 2026-11-01 numbers). */
const ORIGINAL = { longSide: 1200, quality: 0.8 };

/**
 * The cutouts (Design Round 31): the shelf's long side (Code, 2026-11-22;
 * the 1200 one decodes at 5.7 MB a tile), HEIC quality, how much of a
 * photo's side the cutout must cover to count as running into it, and the
 * fade over the cut (Design Round 31 v2, §6: 8 % of the cutout's long side,
 * only where it touches; PhotoCutout.swift).
 */
const CUTOUT = { smallLongSide: 400, quality: 0.8, edgeShare: 0.02, fade: 0.08 };

/**
 * A cutout running into three or four sides of its photo is the photo again
 * (a close-up filling the frame): the bag shows as not lifted, state b, the
 * print (Uryu, 2026-11-23; Design's rule covers bottom and right only).
 * Placement then reads only bottom and right; a top or left side touched
 * is faded but doesn't move the cutout (the shelf's code, TODO Round 31).
 */
const MAX_EDGES = 2;

/** bags.photo_cutout's bits (schema.ts). */
export const CUTOUT_EDGE = { made: 1, top: 2, right: 4, bottom: 8, left: 16 } as const;

const original = (dir: Directory, id: string) => new File(dir, `${id}.jpg`);
const cutLarge = (id: string, dir: Directory = KEPT) => new File(dir, `${id}-cut.heic`);
const cutSmall = (id: string, dir: Directory = KEPT) => new File(dir, `${id}-cut-s.heic`);
/** Every file a kept photo may have, the retired duotone copy included. */
const keptFiles = (id: string) => [original(KEPT, id), cutLarge(id), cutSmall(id), new File(KEPT, `${id}-styled.jpg`)];

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** A file's URI with its time, so a remade file isn't shown from the image cache under the same name. */
const fresh = (file: File) => `${file.uri}?v=${file.lastModified ?? 0}`;

/** A photo not kept yet: its id, the original to show and its size in pixels. */
export type PendingPhoto = { id: string; uri: string; width: number; height: number };

export async function preparePhoto(pickedUri: string): Promise<PendingPhoto> {
  PENDING.create({ intermediates: true, idempotent: true });
  const id = newId();
  const { width, height } = await writeOriginal(pickedUri, original(PENDING, id).uri, ORIGINAL.longSide, ORIGINAL.quality);
  return { id, uri: original(PENDING, id).uri, width, height };
}

/** The original, and the cutouts liftPhoto made for it, if any. */
export async function keepPhoto(id: string): Promise<void> {
  KEPT.create({ intermediates: true, idempotent: true });
  await original(PENDING, id).move(original(KEPT, id));
  for (const [from, to] of [
    [cutLarge(id, PENDING), cutLarge(id)],
    [cutSmall(id, PENDING), cutSmall(id)],
  ]) {
    if (!from.exists) continue;
    if (to.exists) to.delete();
    await from.move(to);
  }
}

export function dropPhoto(id: string): void {
  for (const file of [original(PENDING, id), cutLarge(id, PENDING), cutSmall(id, PENDING)]) {
    try {
      if (file.exists) file.delete();
    } catch (error) {
      console.warn('[photos] could not drop', file.uri, error);
    }
  }
}

/**
 * A pending bag photo lifted out (Add a bag, 38b):
 *   code   bags.photo_cutout to store with the bag (0: not lifted, the print)
 *   uri    the large cutout, null when not lifted
 *   aspect the cutout's width ÷ height
 *   edges  the sides it runs into (placement)
 *   box    where it sat in the photo (shares of the photo), null from a
 *          build made before 2026-11-25
 * Rejects when Vision itself fails: the bag is stored with photo_cutout
 * NULL, and makeCutouts tries again after it is added.
 */
export type Lift = { code: number; uri: string | null; aspect: number | null; edges: CutoutEdges | null; box: CutoutBox | null };

export async function liftPhoto(photo: PendingPhoto): Promise<Lift> {
  const result = await cutOutFiles(original(PENDING, photo.id), cutLarge(photo.id, PENDING), cutSmall(photo.id, PENDING));
  if (!result.found || !result.code) return { code: 0, uri: null, aspect: null, edges: null, box: null };
  return {
    code: result.code,
    uri: fresh(cutLarge(photo.id, PENDING)),
    aspect: result.width / result.height,
    edges: cutoutEdges(result.code),
    box: result.box ?? null,
  };
}

/**
 * Lift one original into its two cutout files, with the code to store
 * (schema.ts bags.photo_cutout). Throws when Vision fails.
 */
async function cutOutFiles(source: File, large: File, small: File) {
  const result = await cutOut(source.uri, large.uri, small.uri, CUTOUT);
  if (!result.found) return { ...result, code: 0 };
  if (Object.values(result.edges).filter(Boolean).length > MAX_EDGES) {
    // The photo again: shown as the print, so its cutout files go.
    for (const file of [large, small]) if (file.exists) file.delete();
    return { ...result, code: 0 };
  }
  return { ...result, code: cutoutCode(result.edges) };
}

export function deletePhoto(id: string | null | undefined): void {
  if (!id) return;
  for (const file of keptFiles(id)) {
    try {
      if (file.exists) file.delete();
    } catch (error) {
      console.warn('[photos] could not delete', file.uri, error);
    }
  }
}

/** What to show for a kept photo: the original, in full colour; null when it's gone (the placeholder). */
export function photoUri(id: string | null | undefined): string | null {
  if (!id) return null;
  const file = original(KEPT, id);
  return file.exists ? fresh(file) : null;
}

/**
 * A bag's cutout, for its tile ('small', the shelf) or its page ('large'):
 * null while there is none (not made yet, no subject, files gone), when the
 * bag shows its rectangular photo instead.
 */
export function cutoutUri(id: string | null | undefined, which: 'small' | 'large'): string | null {
  if (!id) return null;
  const file = which === 'small' ? cutSmall(id) : cutLarge(id);
  return file.exists ? fresh(file) : null;
}

/** bags.photo_cutout read back: null when there is no cutout to show, else the sides it runs into. */
export function cutoutEdges(code: number | null | undefined): CutoutEdges | null {
  if (!code || !(code & CUTOUT_EDGE.made)) return null;
  return {
    top: Boolean(code & CUTOUT_EDGE.top),
    right: Boolean(code & CUTOUT_EDGE.right),
    bottom: Boolean(code & CUTOUT_EDGE.bottom),
    left: Boolean(code & CUTOUT_EDGE.left),
  };
}

function cutoutCode(edges: CutoutEdges): number {
  return (
    CUTOUT_EDGE.made |
    (edges.top ? CUTOUT_EDGE.top : 0) |
    (edges.right ? CUTOUT_EDGE.right : 0) |
    (edges.bottom ? CUTOUT_EDGE.bottom : 0) |
    (edges.left ? CUTOUT_EDGE.left : 0)
  );
}

let running: Promise<void> | null = null;
let again = false;

/**
 * Make the cutouts that are missing (see the top of this file). One run at a
 * time: a call during a run asks for one more pass after it, so a photo set
 * mid-run is not missed. Never throws; a cutout Vision fails on (as opposed
 * to finding no subject) stays NULL and is tried again next launch.
 */
export function makeCutouts(db: SQLiteDatabase): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    do {
      again = false;
      try {
        await cutoutPass(db);
      } catch (error) {
        console.warn('[photos] cutouts failed', error);
      }
    } while (again);
    running = null;
  })();
  return running;
}

async function cutoutPass(db: SQLiteDatabase): Promise<void> {
  const rows = await db.getAllAsync<{ id: number; photo: string; cutout: number | null }>(
    `SELECT id, photo_uri AS photo, photo_cutout AS cutout FROM bags
      WHERE photo_uri IS NOT NULL AND (photo_cutout IS NULL OR photo_cutout > 0)`
  );
  let changed = false;
  for (const row of rows) {
    // Made, and both files still there: nothing to do. Made but gone (a
    // restore, an iCloud restore that lost them): make them again.
    if (row.cutout != null && cutLarge(row.photo).exists && cutSmall(row.photo).exists) continue;
    if (!original(KEPT, row.photo).exists) continue;
    let code: number;
    try {
      ({ code } = await cutOutFiles(original(KEPT, row.photo), cutLarge(row.photo), cutSmall(row.photo)));
    } catch (error) {
      console.warn('[photos] cutout failed', row.photo, error);
      continue;
    }
    // Only if the bag still has this photo: it may have changed meanwhile.
    await db.runAsync('UPDATE bags SET photo_cutout = ? WHERE id = ? AND photo_uri = ?', [code, row.id, row.photo]);
    changed = true;
  }
  if (changed) notifyShelfChanged();
}

/** A kept photo's original, for the backup (backup.ts); null when it isn't there. */
export async function originalBytes(id: string): Promise<Uint8Array | null> {
  const file = original(KEPT, id);
  return file.exists ? await file.bytes() : null;
}

/**
 * Put a photo back from a backup (backup.ts): its original as it was. A
 * bag's cutouts are made after, by makeCutouts (the backup carries
 * originals only).
 */
export async function restorePhoto(id: string, bytes: Uint8Array): Promise<boolean> {
  try {
    KEPT.create({ intermediates: true, idempotent: true });
    const file = original(KEPT, id);
    if (file.exists) file.delete();
    file.create();
    await file.write(bytes);
    return true;
  } catch (error) {
    console.warn('[photos] restore failed', id, error);
    return false;
  }
}

/**
 * On launch: remove kept photo files no row points at, the retired duotone
 * copies, and anything left pending by a sheet that never finished. This is
 * how a deleted bag's photo goes (a delete anywhere, no screen has to
 * remember the files), and how a crash between "kept" and "saved" doesn't
 * leave files behind for ever.
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
      if (!(entry instanceof File)) continue;
      if (entry.name.endsWith('-styled.jpg')) {
        entry.delete();
        continue;
      }
      const id = entry.name.replace(/(-cut-s\.heic|-cut\.heic|\.jpg)$/, '');
      if (!used.has(id)) entry.delete();
    }
  } catch (error) {
    console.warn('[photos] sweep failed', error);
  }
}
