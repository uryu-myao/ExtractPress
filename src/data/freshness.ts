import { daysBetween, daysSince } from '../constants/dates.js';

/**
 * Bean freshness (gaps.md 8, decided 2026-10-14). See data-model.md
 * "Freshness".
 *
 * These windows are a REFERENCE, not a prediction. The real window depends on
 * the roast level, the packaging (a valve or not), storage temperature, the
 * brew method and whole bean vs ground — none of which the app knows. They
 * are the industry's most-used ranges, and the app shows them as a guide.
 *
 * Counted from the ROAST date (degassing starts at the roast; 3g "Recounted
 * from the roast date"; two bags side by side share one "today"). One window
 * for every roast level: a per-level window is V1.5 (the level is the
 * roaster's own claim, coarse, and a second rule would look more precise
 * without being better founded).
 *
 *   resting    day 0 – 6     (drinkFrom − 1)
 *   drinkNow   day 7 – 21    the peak band, 7/42 – 21/42 of the bar
 *   pastPeak   day 22 +      the bar stays full past `span`
 *
 * "Stale" (8i, 6a) is a different signal: 21+ days since OPENING (oxidation
 * after opening), whatever dates the bag has: staleOf() below.
 *
 * A best-before date (migration 9) is a third clock and a different kind of
 * fact: the maker's quality guarantee, not a flavour peak. It gives days left
 * and whether the date has passed (bestBeforeOf), never a state, a day N or a
 * bar (data-model.md "Best-before"). With a roast date too, the roast clock
 * drives the display.
 */
export const FRESHNESS_TUNING = {
  /** first day of the drinking window */
  drinkFrom: 7,
  /** last day of the drinking window */
  drinkUntil: 21,
  /** the bar's full length in days (twice the window; a display choice, not science) */
  span: 42,
} as const;

export type FreshnessState = 'resting' | 'drinkNow' | 'pastPeak';

export type Freshness = { day: number; state: FreshnessState; elapsed: number };

/** The bag's freshness today, or null without a roast date (nothing is shown then). */
export function freshnessOf(roastedAt: number | null): Freshness | null {
  if (roastedAt == null) return null;
  const day = Math.max(0, daysSince(roastedAt));
  const { drinkFrom, drinkUntil, span } = FRESHNESS_TUNING;
  const state: FreshnessState = day < drinkFrom ? 'resting' : day <= drinkUntil ? 'drinkNow' : 'pastPeak';
  return { day, state, elapsed: Math.min(day, span) / span };
}

/** The state as the label words it: "Day 7 · drink now". */
export const FRESHNESS_WORDS: Record<FreshnessState, string> = {
  resting: 'resting',
  drinkNow: 'drink now',
  pastPeak: 'past peak',
};

/** Stale from this many days after opening (8i "around day 21 after opening"; oxidation, not the roast). */
export const STALE_AFTER_DAYS = 21;

export type Stale = { daysOpen: number; stale: boolean };

/**
 * Days since the bag was opened, and whether it is stale. Looks at the
 * opening date only (Uryu, 2026-11-11): a roast date, a best-before date,
 * both or neither make no difference. null for a sealed bag (never stale).
 * The caller leaves finished bags out.
 */
export function staleOf(openedAt: number | null, now = Date.now()): Stale | null {
  if (openedAt == null) return null;
  const daysOpen = Math.max(0, daysBetween(openedAt, now));
  return { daysOpen, stale: daysOpen >= STALE_AFTER_DAYS };
}

/** The best-before reminder comes this many days before the date (8i; Uryu, 2026-11-11). */
export const BEST_BEFORE_WARN_DAYS = 7;

export type BestBefore = { daysLeft: number; passed: boolean };

/**
 * Whole calendar days from today to the best-before date: 0 on the day
 * itself (still within it), negative after. passed: the day is behind today.
 * A guarantee, not a peak: nothing here says how the coffee tastes.
 * null without a date.
 */
export function bestBeforeOf(bestBefore: number | null, now = Date.now()): BestBefore | null {
  if (bestBefore == null) return null;
  const daysLeft = daysBetween(now, bestBefore);
  return { daysLeft, passed: daysLeft < 0 };
}
