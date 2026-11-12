import { FRESHNESS_TUNING, bestBeforeOf, freshnessOf } from '../data/freshness';
import { formatDay, formatDayWithYear } from './dates';

/**
 * A best-before bag's words (Design Round 27, 29a–29d). One rule everywhere:
 * a best-before bag says its date, never a state. No bar, no band, no
 * state colour: the calendar glyph and text.muted; "passed" one step
 * stronger (text.secondary), never a warning. A bag with a roast date keeps
 * the roast clock, whatever its best-before date (data-model.md
 * "Best-before"). A bag with neither shows nothing.
 *
 * Every function takes the bag row (roasted_at, best_before, opened_at).
 */

/** Best-before only: the roast clock doesn't lead. null when the bag has a roast date or no best-before date. */
export function bestBeforeOnly(bag, now = Date.now()) {
  if (bag.roasted_at != null) return null;
  return bestBeforeOf(bag.best_before ?? null, now);
}

const daysLeft = (n) => (n === 1 ? '1 day left' : `${n} days left`);

/** 3d's card (29c, 2): "Best before Oct 1 · 142 days left" / "· today" / "· passed". */
export function bestBeforeCardLine(bag, now = Date.now()) {
  const b = bestBeforeOnly(bag, now);
  if (!b) return null;
  const tail = b.passed ? 'passed' : b.daysLeft === 0 ? 'today' : daysLeft(b.daysLeft);
  return { text: `Best before ${formatDay(bag.best_before)} · ${tail}`, passed: b.passed };
}

/** 3d / 17d, a sealed bag with a best-before date (29d, C1): "Sealed · best before Oct 1" / "… passed". */
export function sealedBestBeforeLine(bag, now = Date.now()) {
  const b = bestBeforeOnly(bag, now);
  if (!b) return null;
  return { text: `Sealed · best before ${b.passed ? 'passed' : formatDay(bag.best_before)}`, passed: b.passed };
}

/** 19a's status sentence, in the serif (29b): days to it, today, or passed. */
export function bestBeforeSentence(bag, now = Date.now()) {
  const b = bestBeforeOnly(bag, now);
  if (!b) return null;
  if (b.passed) return { text: 'Its best-before date has passed', passed: true };
  if (b.daysLeft === 0) return { text: 'Its best-before date is today', passed: false };
  return { text: `${b.daysLeft === 1 ? '1 day' : `${b.daysLeft} days`} to its best-before date`, passed: false };
}

/**
 * 19a's date line under the status (29b).
 *   best-before only  "Best before Oct 1, 2027 · opened Apr 6" (the year:
 *                     these dates run long); passed adds "· 12 days ago"
 *   roast date        "Roasted Mar 30 · opened Apr 6 · best before Sep 30"
 */
export function bagDatesLine(bag, now = Date.now()) {
  const opened = bag.opened_at != null ? `opened ${formatDay(bag.opened_at)}` : null;
  const b = bestBeforeOnly(bag, now);
  if (b) {
    const ago = b.passed ? (-b.daysLeft === 1 ? '1 day ago' : `${-b.daysLeft} days ago`) : null;
    return [`Best before ${formatDayWithYear(bag.best_before)}`, ago, opened].filter(Boolean).join(' · ');
  }
  const parts = [bag.roasted_at != null ? `Roasted ${formatDay(bag.roasted_at)}` : null, opened, bag.best_before != null ? `best before ${formatDay(bag.best_before)}` : null].filter(Boolean);
  if (!parts.length) return null;
  const line = parts.join(' · ');
  return line.charAt(0).toUpperCase() + line.slice(1);
}

/** Home's shelf column (29c, 4): "Best before" over the date; "Date passed" over it. */
export function bestBeforeStatus(bag, now = Date.now()) {
  const b = bestBeforeOnly(bag, now);
  if (!b) return null;
  return { word: b.passed ? 'Date passed' : 'Best before', line: formatDay(bag.best_before), passed: b.passed };
}

/** Search's and 5a's lines (29c, 5 / 6): "best before Oct 1" / "best before passed". */
export function bestBeforeShort(bag, now = Date.now()) {
  const b = bestBeforeOnly(bag, now);
  if (!b) return null;
  return `best before ${b.passed ? 'passed' : formatDay(bag.best_before)}`;
}

/**
 * Home's order, what to drink first (Design Round 27 B3): date passed and
 * past peak (longest past first), drink now, best-before by nearest date,
 * resting, neither date, then sealed bags. Returns [rank, tiebreak].
 */
export function drinkFirstRank(bag, now = Date.now()) {
  if (!bag.opened_at) return [5, bag.id];
  const f = freshnessOf(bag.roasted_at);
  if (f) {
    if (f.state === 'pastPeak') return [0, -(f.day - FRESHNESS_TUNING.drinkUntil)];
    if (f.state === 'drinkNow') return [1, bag.roasted_at];
    return [3, bag.roasted_at];
  }
  const b = bestBeforeOf(bag.best_before ?? null, now);
  if (b) return b.passed ? [0, b.daysLeft] : [2, b.daysLeft];
  return [4, bag.id];
}
