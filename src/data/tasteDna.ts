/**
 * Taste DNA: arithmetic on logged cups (design/taste-dna.md, decided
 * 2026-10-11; five unipolar axes since 2026-11-13, Turn 29 / 30). Pure
 * functions, no I/O, so the app, migration 11's replay and the node checks
 * share one implementation.
 *
 * The axes are the registry's (src/constants/tasteAxes.js): this file never
 * lists or counts them. Each is unipolar, 1 (faint) to 5 (strong); 1 is a
 * real low reading. There is no midpoint and no neutral value anywhere in
 * this arithmetic.
 *
 * Per axis, over rated cups logged on or after `resetAt` and no later than
 * `asOf`:
 *   value = Σ(w · v) / Σ(w), w = ratingWeight × 0.5^(age / halfLife)
 *   - a slider record contributes its value at weight w;
 *   - a bundled flavour word contributes its table value at w × strength;
 *   - an axis nobody noted has no value (untouched = unknown, never a
 *     default and never a low reading).
 *   - words are capped per axis at wordShareCap of the axis's total weight,
 *     by scaling every word on that axis by one factor (see DNA_TUNING).
 * Lock-in counts slider records only: an axis is locked at `lockIn`; the
 * profile is locked when every axis with a slider record is (option B), and
 * once locked it stays locked (decided 2026-10-11): a first note on a new axis
 * does not un-lock it. Worked out on read by walking the counted cups in
 * logged order, so no stored flag; deleting cups can undo a lock, since the
 * walk then never reaches it.
 */
import { AXIS_IDS, axisById, stepOf } from '../constants/tasteAxes.js';
import { parseAxes, type CupAxes } from './cupAxes.ts';

/** A registry id (TASTE_AXES). Not a closed union: the registry decides. */
export type AxisKey = string;

/**
 * TUNING — initial values, to be adjusted against real use (taste-dna.md
 * "These numbers are starting values"). If the profile disagrees with how the
 * cups felt, change these first. Keep every tuning number here; nowhere else.
 */
export const DNA_TUNING = {
  /** Confidence by stars, never direction. Unrated cups are ignored. */
  ratingWeight: { 1: 0.25, 2: 0.5, 3: 1, 4: 2, 5: 3 } as Record<number, number>,
  /** Recency: exponential decay. 30 days → 0.79, 8 months → 0.16. */
  halfLifeDays: 90,
  /** Slider records an axis needs to lock in (flavour words never count). */
  lockIn: 10,
  /**
   * Words may make up at most this share of an axis's total weight. Why
   * (taste-dna.md): one word is weak, but words are picked on nearly every
   * cup while sliders are moved only when noticed. Without a cap, an axis
   * with few slider records is decided by words alone. Do not remove it
   * because the number looks arbitrary; the asymmetry is the reason.
   * Applied by scaling all words on the axis by one factor, so their relative
   * strengths (Grapefruit 0.4 : Jasmine 0.2) never change. With no slider
   * record on an axis, words alone give it no value.
   */
  wordShareCap: 1 / 3,
  /**
   * The bundled words (and only those). A word is a weak record: a reading
   * on the axis's 1–5 scale at a strength of at most 0.4 of one slider
   * record. Criterion: a predictable, one-way lean on that axis when the
   * word comes up. Cinnamon: none.
   *
   * ONLY WORDS WITH ONE UNAMBIGUOUS AXIS MEANING (decided 2026-11-14). Every
   * other word still displays on its cup and still feeds Try Next's tag lead,
   * which matches the words themselves, never this map. Cocoa, Walnut and
   * Smoke are roast-character words: with roast off the cup they have no
   * unambiguous axis, and a cupping correlation (cocoa / walnut with fuller
   * body) is not something the drinker said. They stay out on purpose; do
   * not map them to Bitterness or Body. taste-dna.md item 6.
   *
   * 2026-11-13 (five unipolar axes): the entries were moved onto the new
   * scale, not re-decided. Acidity's old 0 / 25 (Very bright / Bright on
   * Acid ↔ Bitter) became 5 / 4 (Strong / Bold acidity); body and sweetness
   * kept their side (25 → 2, 75 → 4).
   */
  words: {
    jasmine: [{ axis: 'acidity', at: 4, strength: 0.2 }],
    peach: [
      { axis: 'acidity', at: 4, strength: 0.3 },
      { axis: 'sweetness', at: 4, strength: 0.3 },
    ],
    grapefruit: [{ axis: 'acidity', at: 5, strength: 0.4 }],
    blackcurrant: [
      { axis: 'acidity', at: 4, strength: 0.3 },
      { axis: 'sweetness', at: 4, strength: 0.2 },
    ],
    'black tea': [{ axis: 'body', at: 2, strength: 0.3 }],
    caramel: [{ axis: 'sweetness', at: 4, strength: 0.4 }],
  } as Record<string, { axis: AxisKey; at: number; strength: number }[]>,
};

const DAY_MS = 86400000;

/** The cup fields the arithmetic reads. axes is sparse: no key = not noted (cupAxes.ts). */
export type DnaCup = {
  rating: number | null;
  logged_at: number;
  axes: CupAxes;
  flavours: string[];
};

export type AxisDna = {
  /** 1–5, or null when nothing noted this axis */
  value: number | null;
  /** slider records (what lock-in counts) */
  n: number;
  /** total weight from sliders and from words: the words' share = words / (slider + words) */
  sliderWeight: number;
  wordWeight: number;
  /** the words reached wordShareCap and were scaled down (8g's "at their limit") */
  capped: boolean;
};

export type Dna = {
  axes: Record<AxisKey, AxisDna>;
  /** 'none': no axis has anything; 'early' / 'locked': option B */
  state: 'none' | 'early' | 'locked';
  /** slider records on the least-noted axis that has any (1b's "N more") */
  fewest: number | null;
  /** 8f's "From N cups": counted cups with an axis noted or a table word */
  cups: number;
  /** when Reset my taste DNA last ran (settings.reset_at), or null: 'none' after one has its own line (Design Round 25, A1) */
  resetAt: number | null;
};

/** A cup's table words, on registered axes only (an entry on a retired axis is skipped). */
const wordsOf = (cup: DnaCup) => cup.flavours.flatMap((w) => DNA_TUNING.words[w.toLowerCase()] ?? []).filter((e) => axisById(e.axis));

export function computeDna(cups: readonly DnaCup[], asOf: number, resetAt: number | null = null): Dna {
  const sum = Object.fromEntries(AXIS_IDS.map((a: string) => [a, { sliderWV: 0, wordWV: 0, sliderW: 0, wordW: 0, n: 0 }])) as Record<
    AxisKey,
    { sliderWV: number; wordWV: number; sliderW: number; wordW: number; n: number }
  >;
  let counted = 0;
  for (const cup of cups) {
    const rw = cup.rating ? DNA_TUNING.ratingWeight[cup.rating] : undefined;
    if (!rw || cup.logged_at > asOf || (resetAt != null && cup.logged_at < resetAt)) continue;
    const w = rw * Math.pow(0.5, (asOf - cup.logged_at) / (DNA_TUNING.halfLifeDays * DAY_MS));
    let used = false;
    for (const a of AXIS_IDS) {
      const v = cup.axes[a];
      if (v == null) continue;
      sum[a].sliderWV += w * v;
      sum[a].sliderW += w;
      sum[a].n += 1;
      used = true;
    }
    for (const { axis, at, strength } of wordsOf(cup)) {
      sum[axis].wordWV += w * strength * at;
      sum[axis].wordW += w * strength;
      used = true;
    }
    if (used) counted += 1;
  }

  const axes = Object.fromEntries(
    AXIS_IDS.map((a) => {
      const s = sum[a];
      // Cap: words ≤ cap × (sliders + words) ⇔ words ≤ sliders × cap / (1 − cap).
      // One factor for every word on the axis keeps their ratios.
      const cap = DNA_TUNING.wordShareCap;
      const allowed = (s.sliderW * cap) / (1 - cap);
      const k = s.wordW > allowed ? allowed / s.wordW : 1;
      const wordW = s.wordW * k;
      const total = s.sliderW + wordW;
      return [a, { value: total > 0 ? (s.sliderWV + k * s.wordWV) / total : null, n: s.n, sliderWeight: s.sliderW, wordWeight: wordW, capped: k < 1 }];
    })
  ) as Record<AxisKey, AxisDna>;

  const noted = AXIS_IDS.map((a) => axes[a].n).filter((n) => n > 0);
  const fewest = noted.length ? Math.min(...noted) : null;
  const anything = AXIS_IDS.some((a) => axes[a].value != null);
  const state = !anything ? 'none' : everLocked(cups, asOf, resetAt) ? 'locked' : 'early';
  return { axes, state, fewest, cups: counted, resetAt };
}

/** Whether, at any point in logged order, every noted axis had `lockIn` slider records. */
function everLocked(cups: readonly DnaCup[], asOf: number, resetAt: number | null): boolean {
  const counts = Object.fromEntries(AXIS_IDS.map((a) => [a, 0])) as Record<AxisKey, number>;
  const ordered = cups
    .filter((c) => c.rating && DNA_TUNING.ratingWeight[c.rating] && c.logged_at <= asOf && (resetAt == null || c.logged_at >= resetAt))
    .slice()
    .sort((a, b) => a.logged_at - b.logged_at);
  for (const cup of ordered) {
    for (const a of AXIS_IDS) if (cup.axes[a] != null) counts[a] += 1;
    const noted = AXIS_IDS.filter((a) => counts[a] > 0);
    if (noted.length && noted.every((a) => counts[a] >= DNA_TUNING.lockIn)) return true;
  }
  return false;
}

/**
 * Snapshot precision: three decimals on the 1–5 scale. Fine enough that a
 * stored before / after gives a change correct to well within the tags' 0.1
 * (31e). (The 0–100 snapshots before migration 11 kept one decimal.)
 */
const SNAPSHOT_SCALE = 1000;

/** What a cup stores at save time (cups.dna_change): per axis value (SNAPSHOT_SCALE) and slider count. */
export type DnaSnapshot = Record<AxisKey, { value: number | null; n: number }>;
export type DnaChange = { before: DnaSnapshot; after: DnaSnapshot };

export const snapshotOf = (dna: Dna): DnaSnapshot =>
  Object.fromEntries(
    AXIS_IDS.map((a: string) => [a, { value: dna.axes[a].value == null ? null : Math.round(dna.axes[a].value * SNAPSHOT_SCALE) / SNAPSHOT_SCALE, n: dna.axes[a].n }])
  ) as DnaSnapshot;

/**
 * The change one cup made, as of its own logged time: the profile from the
 * cups before it, then with it. Deterministic: no clock is read.
 */
export function changeOf(earlier: readonly DnaCup[], cup: DnaCup, resetAt: number | null = null): DnaChange {
  return {
    before: snapshotOf(computeDna(earlier, cup.logged_at, resetAt)),
    after: snapshotOf(computeDna([...earlier, cup], cup.logged_at, resetAt)),
  };
}

/**
 * A cups row → the fields the arithmetic reads. `axes` is the row's
 * axesJsonSql() column (cupAxes.ts): the cup's cup_axes rows as one object.
 */
export type DnaRow = { rating: number | null; logged_at: number; flavours: string; axes: string | null };

export function dnaCupFromRow(row: DnaRow): DnaCup {
  return { rating: row.rating, logged_at: row.logged_at, axes: parseAxes(row.axes), flavours: JSON.parse(row.flavours) };
}

/** One axis that crossed into another step (taste-dna.md "Shifts"): step indexes into STEP_WORDS. */
export type AxisShift = { axis: AxisKey; from: number; to: number };
export type DnaShift = { at: number; axes: AxisShift[] };

/** A snapshot's value for an axis; null when not noted, or when the snapshot predates the axis. */
const valueIn = (snapshot: DnaSnapshot, axis: AxisKey): number | null => snapshot[axis]?.value ?? null;

/**
 * 8f's last shift: the latest cup (by logged time) whose stored change moved
 * an axis into another step (stepOf: the nearest whole number), read from
 * cups.dna_change, never recomputed (taste-dna.md item 5). An axis noted for
 * the first time (before null) has no step to leave, so it is not a shift.
 * Rows newest first.
 */
export function lastShift(rows: readonly { logged_at: number; dna_change: string }[]): DnaShift | null {
  for (const row of rows) {
    const change = JSON.parse(row.dna_change) as DnaChange;
    const axes: AxisShift[] = [];
    for (const axis of AXIS_IDS) {
      const before = valueIn(change.before, axis);
      const after = valueIn(change.after, axis);
      if (before == null || after == null) continue;
      const from = stepOf(before);
      const to = stepOf(after);
      if (from !== to) axes.push({ axis, from, to });
    }
    if (axes.length) return { at: row.logged_at, axes };
  }
  return null;
}

/**
 * One axis in a stored change, as the change tags read it (31e), in registry
 * order:
 *   first   noted for the first time: no number, the step it starts at
 *   moved   the change on the 1–5 scale, ROUNDED TO 0.1 WITH ITS SIGN
 *           (+0.2, −0.1). 0.1 is a fortieth of the scale, the old tags'
 *           2.5 points: a real nudge shows, and "+0.04" (a precision nine
 *           stops can't carry) never does.
 *   still   moved, but by less than 0.05, so it rounds to 0.0: no tag. Kept
 *           so the sentence can tell "barely moves it" from "nothing moves it".
 * An axis that did not move at all, or is not noted after the cup, is left out.
 * Computed in whole thousandths (the snapshots' precision), so float error
 * cannot push a 0.05 either way; halves round away from zero, so +0.05 and
 * −0.05 both tag.
 */
export type AxisDelta =
  | { axis: AxisKey; kind: 'first'; step: number }
  | { axis: AxisKey; kind: 'moved'; delta: number }
  | { axis: AxisKey; kind: 'still' };

export function changeDeltas(change: DnaChange | null): AxisDelta[] {
  if (!change) return [];
  const deltas: AxisDelta[] = [];
  for (const axis of AXIS_IDS) {
    const before = valueIn(change.before, axis);
    const after = valueIn(change.after, axis);
    if (after == null) continue;
    if (before == null) {
      deltas.push({ axis, kind: 'first', step: stepOf(after) });
      continue;
    }
    const milli = Math.round(after * SNAPSHOT_SCALE) - Math.round(before * SNAPSHOT_SCALE);
    if (milli === 0) continue;
    const tenths = Math.sign(milli) * Math.round(Math.abs(milli) / (SNAPSHOT_SCALE / 10));
    deltas.push(tenths === 0 ? { axis, kind: 'still' } : { axis, kind: 'moved', delta: tenths / 10 });
  }
  return deltas;
}
