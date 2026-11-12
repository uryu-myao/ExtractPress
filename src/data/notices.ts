/**
 * Notices on this phone (7a / 7b; migration 8). The text ships in the app
 * (src/constants/notices.js); the notices table records only the delivery
 * and the read time. Driver-neutral (SqlDb), so scripts/check-notices.ts runs
 * it under node; the app passes asSqlDb(db).
 */

/** Who gets it: 'notice' everyone, 'update' only people who updated (constants/notices.js). */
export type NoticeKind = 'notice' | 'update';

export type BundledNotice = {
  id: string;
  kind: NoticeKind;
  version: string;
  date: string;
  title: string;
  summary: string;
  body: string[];
  points?: (string | { lead: string; text: string })[];
  action?: { label: string; to: string };
};

export type Notice = BundledNotice & { delivered_at: number; read_at: number | null };

type Db = {
  all<T>(sql: string, params?: (string | number | null)[]): Promise<T[]>;
  run(sql: string, params?: (string | number | null)[]): Promise<void>;
};

/** "1.10.0" > "1.9.2". Missing parts count as 0; anything after a '-' is ignored. */
export function compareVersions(a: string, b: string): number {
  const parts = (v: string) => v.split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

/**
 * Deliver what this launch calls for and record the version. Run once per
 * launch, before the UI reads notices. Returns the ids delivered now.
 *   'notice'  every one with version ≤ this app's, to everyone, new installs
 *             included
 *   'update'  only after an update: last < version ≤ this app's. A new
 *             install (device.notices_version NULL) gets none: for them
 *             nothing is new
 * An older app than recorded (a dev build going back) delivers nothing and
 * keeps the recorded version. The rules: constants/notices.js.
 */
export async function deliverNotices(db: Db, appVersion: string, bundled: readonly BundledNotice[], now = Date.now()): Promise<string[]> {
  const [device] = await db.all<{ notices_version: string | null }>('SELECT notices_version FROM device WHERE id = 1');
  const last = device?.notices_version ?? null;
  if (last != null && compareVersions(appVersion, last) < 0) return [];
  const due = bundled.filter((n) => {
    if (compareVersions(n.version, appVersion) > 0) return false;
    if (n.kind === 'notice') return true;
    return last != null && compareVersions(n.version, last) > 0;
  });
  const delivered: string[] = [];
  for (const n of due) {
    const [had] = await db.all<{ id: string }>('SELECT id FROM notices WHERE id = ?', [n.id]);
    if (had) continue;
    await db.run('INSERT INTO notices (id, delivered_at, read_at) VALUES (?, ?, NULL)', [n.id, now]);
    delivered.push(n.id);
  }
  await db.run('UPDATE device SET notices_version = ? WHERE id = 1', [appVersion]);
  if (delivered.length) notifyNoticesChanged();
  return delivered;
}

/**
 * The delivered notices, newest first (7a), with their bundled text. A row
 * whose notice is no longer bundled is left out.
 */
export async function listNotices(db: Db, bundled: readonly BundledNotice[]): Promise<Notice[]> {
  const rows = await db.all<{ id: string; delivered_at: number; read_at: number | null }>('SELECT id, delivered_at, read_at FROM notices');
  const byId = new Map(bundled.map((n) => [n.id, n]));
  const order = new Map(bundled.map((n, i) => [n.id, i]));
  return rows
    .flatMap((r) => {
      const n = byId.get(r.id);
      return n ? [{ ...n, delivered_at: r.delivered_at, read_at: r.read_at }] : [];
    })
    // Newest first; on the same date, the later bundled entry first.
    .sort((a, b) => b.date.localeCompare(a.date) || b.delivered_at - a.delivered_at || order.get(b.id)! - order.get(a.id)!);
}

/** How many delivered notices are unread (the bell's badge, 7a's "2 unread"). */
export async function countUnreadNotices(db: Db, bundled: readonly BundledNotice[]): Promise<number> {
  const rows = await db.all<{ id: string }>('SELECT id FROM notices WHERE read_at IS NULL');
  const ids = new Set(bundled.map((n) => n.id));
  return rows.filter((r) => ids.has(r.id)).length;
}

/** Opened on 7b: read from now. Already read stays as it was. */
export async function markNoticeRead(db: Db, id: string, now = Date.now()): Promise<void> {
  await db.run('UPDATE notices SET read_at = ? WHERE id = ? AND read_at IS NULL', [now, id]);
  notifyNoticesChanged();
}

/** 7a's "Mark all read". */
export async function markAllNoticesRead(db: Db, now = Date.now()): Promise<void> {
  await db.run('UPDATE notices SET read_at = ? WHERE read_at IS NULL', [now]);
  notifyNoticesChanged();
}

/** A notice was delivered or read: the bell and 7a refresh. */
type Listener = () => void;
const listeners = new Set<Listener>();

export function onNoticesChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyNoticesChanged() {
  listeners.forEach((listener) => listener());
}
