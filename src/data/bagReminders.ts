import { formatDay } from '../constants/dates.js';
import { BEST_BEFORE_WARN_DAYS, STALE_AFTER_DAYS } from './freshness.ts';

/**
 * The bags' local notifications (8i "Bag going stale"; data-model.md
 * "Best-before"; Uryu, 2026-11-11). Pure: no Expo. scripts/check-reminders.ts
 * runs it under node.
 *
 * Two kinds, one switch (device.notify_stale):
 *   stale        STALE_AFTER_DAYS (21) after the bag was opened, at 9:00.
 *                The opening date only: roast and best-before dates don't
 *                matter. A sealed bag never gets one.
 *   best-before  BEST_BEFORE_WARN_DAYS (7) before the date, at 9:00, sealed
 *                or open (the guarantee is for the sealed bag).
 * None for a finished bag, none whose moment has passed. If a bag's two fall
 * within MERGE_DAYS (3) of each other, only the earlier is kept; when that
 * one has already passed, neither is sent (it was the one meant to go).
 * Bags due the same morning share one notification of each kind (Design
 * Round 26 C2): its words name them ("2 bags open 3 weeks"), and a tap opens
 * the bag's page, or My beans when there are several (reminderText).
 *
 * reconcileStale() is the only way in: it cancels every pending bag
 * reminder and schedules the plan again from the bags as they are now. So
 * no path has to cancel its own: Finish, Delete, Reopen, a changed opening
 * or best-before date, a rename (the text names the bag), a restore, and
 * the switch going off all come out right from one call. Call it whenever
 * the shelf changes (repository.ts onShelfChanged), on launch, on return
 * to the foreground and when the switch changes.
 *
 * The scheduler is passed in: the expo-notifications side is built with the
 * native rebuild. The words are Design's: stale Round 26 C2 (28b),
 * best-before Round 27 C2 (29d).
 */

export const REMINDER_HOUR = 9;
export const MERGE_DAYS = 3;
/** Every bag reminder's identifier starts with this; reconcile owns them all. */
export const REMINDER_PREFIX = 'bag:';

export type ReminderKind = 'stale' | 'bestBefore';

export type ReminderBag = {
  id: number;
  name: string;
  opened_at: number | null;
  finished_at: number | null;
  best_before: number | null;
};

export type ReminderBagRef = { id: number; name: string; openedAt: number | null; bestBefore: number | null };

export type BagReminder = {
  /** bag:stale:<YYYY-MM-DD> or bag:best-before:<YYYY-MM-DD>, the morning it fires */
  id: string;
  kind: ReminderKind;
  /** The bags due that morning, in shelf order (newest opened first). */
  bags: ReminderBagRef[];
  /** When it fires, epoch ms. */
  at: number;
};

/** REMINDER_HOUR on the calendar day `days` after the day `ms` falls on, local time (DST-safe). */
function dayAt(ms: number, days: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, REMINDER_HOUR).getTime();
}

const DAY_MS = 86400000;
const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const SLUG: Record<ReminderKind, string> = { stale: 'stale', bestBefore: 'best-before' };

/** What should be pending now, earliest first: one per kind per morning. */
export function planBagReminders(bags: readonly ReminderBag[], now = Date.now()): BagReminder[] {
  type One = { kind: ReminderKind; at: number; bag: ReminderBagRef };
  const due: One[] = [];
  for (const bag of bags) {
    if (bag.finished_at != null) continue;
    const ref = { id: bag.id, name: bag.name, openedAt: bag.opened_at, bestBefore: bag.best_before };
    let mine: One[] = [];
    if (bag.opened_at != null) mine.push({ kind: 'stale', at: dayAt(bag.opened_at, STALE_AFTER_DAYS), bag: ref });
    if (bag.best_before != null) mine.push({ kind: 'bestBefore', at: dayAt(bag.best_before, -BEST_BEFORE_WARN_DAYS), bag: ref });
    if (mine.length === 2 && Math.abs(mine[0].at - mine[1].at) <= MERGE_DAYS * DAY_MS) {
      mine = [mine[0].at <= mine[1].at ? mine[0] : mine[1]];
    }
    due.push(...mine.filter((r) => r.at > now));
  }
  const byMorning = new Map<string, BagReminder>();
  for (const one of due) {
    const id = `${REMINDER_PREFIX}${SLUG[one.kind]}:${dayKey(one.at)}`;
    const r = byMorning.get(id) ?? { id, kind: one.kind, bags: [], at: one.at };
    r.bags.push(one.bag);
    byMorning.set(id, r);
  }
  const plan = [...byMorning.values()];
  for (const r of plan) r.bags.sort((a, b) => (b.openedAt ?? 0) - (a.openedAt ?? 0) || b.id - a.id);
  return plan.sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
}

/** "A and B" / "A, B and 3 more" (Round 26 C2). */
function names(bags: ReminderBagRef[]): string {
  if (bags.length === 1) return bags[0].name;
  if (bags.length === 2) return `${bags[0].name} and ${bags[1].name}`;
  return `${bags[0].name}, ${bags[1].name} and ${bags.length - 2} more`;
}

/**
 * The notification's words and where its tap goes.
 *   stale (Design Round 26 C2, 28b)
 *     one bag   "‹Bag›, open 3 weeks" / "Opened ‹date›. Brew it soon, or mark it finished."
 *     several   "‹n› bags open 3 weeks" / "‹A› and ‹B›. Brew them soon, or mark them finished."
 *               three or more: "‹A›, ‹B› and ‹n› more. …"
 *   best-before (Design Round 27 C2, 29d)
 *     opened    "‹Bag›, best before ‹Oct 1›" / "That's a week away. Brew it soon, or mark it finished."
 *     sealed    "… That's a week away, and it's still sealed. Open it soon, or mark it finished."
 *     several   "‹n› bags, best before next week" / "‹A› and ‹B›. Brew them soon, or mark them finished."
 *   The titles keep the two apart: this one names the date, stale's the time
 *   open. Neither makes a taste claim.
 * open: { bagId } for one bag (its page, 19a), { beans: true } for several (My beans).
 */
export function reminderText(r: BagReminder): { title: string; body: string; open: { bagId: number } | { beans: true } } {
  const one = r.bags.length === 1;
  const open = one ? { bagId: r.bags[0].id } : ({ beans: true } as const);
  if (r.kind === 'stale') {
    return one
      ? { title: `${r.bags[0].name}, open 3 weeks`, body: `Opened ${formatDay(r.bags[0].openedAt ?? r.at)}. Brew it soon, or mark it finished.`, open }
      : { title: `${r.bags.length} bags open 3 weeks`, body: `${names(r.bags)}. Brew them soon, or mark them finished.`, open };
  }
  if (!one) return { title: `${r.bags.length} bags, best before next week`, body: `${names(r.bags)}. Brew them soon, or mark them finished.`, open };
  const bag = r.bags[0];
  const title = `${bag.name}, best before ${formatDay(bag.bestBefore ?? r.at)}`;
  return bag.openedAt == null
    ? { title, body: "That's a week away, and it's still sealed. Open it soon, or mark it finished.", open }
    : { title, body: "That's a week away. Brew it soon, or mark it finished.", open };
}

/** The notification side, whatever drives it (expo-notifications on the phone, a fake in the check). */
export type ReminderScheduler = {
  /** Identifiers of every notification still pending. */
  pending(): Promise<string[]>;
  cancel(id: string): Promise<void>;
  schedule(reminder: BagReminder): Promise<void>;
};

type ReadDb = { all<T>(sql: string, params?: (string | number | null)[]): Promise<T[]> };

/**
 * Cancel every pending bag reminder, then schedule what the bags call for,
 * if 8i's switch is on. Returns what was scheduled.
 */
export async function reconcileStale(db: ReadDb, scheduler: ReminderScheduler, now = Date.now()): Promise<BagReminder[]> {
  const [device] = await db.all<{ notify_stale: number }>('SELECT notify_stale FROM device WHERE id = 1');
  const bags = await db.all<ReminderBag>('SELECT id, name, opened_at, finished_at, best_before FROM bags WHERE finished_at IS NULL');
  for (const id of await scheduler.pending()) {
    if (id.startsWith(REMINDER_PREFIX)) await scheduler.cancel(id);
  }
  if (!device?.notify_stale) return [];
  const plan = planBagReminders(bags, now);
  for (const reminder of plan) await scheduler.schedule(reminder);
  return plan;
}
