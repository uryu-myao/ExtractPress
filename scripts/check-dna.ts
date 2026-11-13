// Taste DNA property check: the arithmetic's mathematical properties hold in
// src/data/tasteDna.ts, not just on paper (design/taste-dna.md "Properties").
//   1. Time alone never moves the profile (exponential decay cancels out).
//   2. Every axis value stays within the 1–5 scale; step edges at the halves.
//   3. The registry, the colour tokens and the word table agree; nothing is
//      hard-wired to the axis count.
//   4. Change tags round as 31e says (0.1, signed, nothing under 0.05).
// Runs with check:schema on every commit. Run: npm run check:dna
import { changeDeltas, computeDna, DNA_TUNING, snapshotOf, type Dna, type DnaCup, type DnaChange } from '../src/data/tasteDna.ts';
import { AXIS_IDS, AXIS_SCALE, axisVector, isAxisValue, STEP_WORDS, stepOf, stepWordOf, TASTE_AXES } from '../src/constants/tasteAxes.js';
import { axisRows } from '../src/data/cupAxes.ts';
import { color } from '../src/theme/tokens.ts';

const AXES = AXIS_IDS as readonly string[];
const { min: LO, max: HI } = AXIS_SCALE;
/** Every stop on the scale (1, 1.5, … 5). */
const STOPS = Array.from({ length: (HI - LO) / AXIS_SCALE.step + 1 }, (_, i) => LO + i * AXIS_SCALE.step);

const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);

const DAY = 86400000;
const T = 1790000000000;
const TABLE_WORDS = Object.keys(DNA_TUNING.words);

/** Seeded PRNG (mulberry32), so a failure reproduces. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cup = (rating: number | null, daysAgo: number, axes: Record<string, number>, flavours: string[] = []): DnaCup => ({
  rating,
  logged_at: T - daysAgo * DAY,
  axes,
  flavours,
});
/** The same reading on every registered axis. */
const every = (v: number) => Object.fromEntries(AXES.map((a) => [a, v]));

/** A mixed record: unrated cups, axes left out, table and non-table words, ages up to ~3 years. */
function randomCups(seed: number, count: number, maxDays = 1100): DnaCup[] {
  const r = rng(seed);
  return Array.from({ length: count }, () => {
    const axes: Record<string, number> = {};
    for (const a of AXES) if (r() < 0.5) axes[a] = STOPS[Math.floor(r() * STOPS.length)];
    const flavours = Array.from({ length: Math.floor(r() * 4) }, () => (r() < 0.8 ? TABLE_WORDS[Math.floor(r() * TABLE_WORDS.length)] : 'Juicy'));
    return cup(r() < 0.1 ? null : 1 + Math.floor(r() * 5), r() * maxDays, axes, flavours);
  });
}

// ── 1. Time alone never moves the profile ────────────────────────────────
// Every weight is multiplied by the same 0.5^(Δ / half-life), so Σ(w·v) / Σ(w)
// is unchanged. A weight floor, an N-day window, rounding or a non-exponential
// decay breaks this and the profile drifts daily.
const TIME_TOLERANCE = 1e-9;
let maxTimeError = 0;
{
  const sets: [string, DnaCup[], number | null][] = [
    ['mixed 40 cups', randomCups(1, 40), null],
    ['mixed 300 cups', randomCups(2, 300), null],
    ['mixed, with a reset', randomCups(3, 120), T - 400 * DAY],
    // Words heavy enough that the 1/3 cap binds on every axis.
    ['cap binding', [cup(5, 10, every(3)), ...Array.from({ length: 60 }, (_, i) => cup(4, i * 9, {}, ['Grapefruit', 'Peach', 'Caramel', 'Black tea']))], null],
  ];
  const shifts = [1, 30, 365];
  for (const [label, cups, resetAt] of sets) {
    const base = computeDna(cups, T, resetAt);
    for (const d of shifts) {
      const later = computeDna(cups, T + d * DAY, resetAt);
      for (const a of AXES) {
        const v0 = base.axes[a].value;
        const v1 = later.axes[a].value;
        if ((v0 == null) !== (v1 == null)) {
          fail(`time: ${label}, +${d} days: ${a} went ${v0} → ${v1}`);
          continue;
        }
        if (v0 == null || v1 == null) continue;
        const err = Math.abs(v1 - v0);
        maxTimeError = Math.max(maxTimeError, err);
        if (err > TIME_TOLERANCE) fail(`time: ${label}, +${d} days: ${a} moved ${v0} → ${v1} (Δ ${err.toExponential(2)})`);
        if (stepOf(v1) !== stepOf(v0)) fail(`time: ${label}, +${d} days: ${a} step ${stepOf(v0)} → ${stepOf(v1)}`);
        if (later.axes[a].n !== base.axes[a].n) fail(`time: ${label}, +${d} days: ${a} n ${base.axes[a].n} → ${later.axes[a].n}`);
      }
      if (later.state !== base.state || later.cups !== base.cups || later.fewest !== base.fewest)
        fail(`time: ${label}, +${d} days: state/cups/fewest ${base.state}/${base.cups}/${base.fewest} → ${later.state}/${later.cups}/${later.fewest}`);
    }
  }
}

// ── 2. Every axis value stays within 1–5 ─────────────────────────────────
// A weighted average never leaves the range of its inputs; words also sit on
// the scale and the cap only scales them by k ≤ 1. Floating point can land an
// ulp outside (5.000000000000001 with the cap applied); that is allowed and
// reported, anything a display could show is not.
const RANGE_TOLERANCE = 1e-9;
let maxOvershoot = 0;
const inRange = (label: string, dna: Dna) => {
  for (const a of AXES) {
    const v = dna.axes[a].value;
    if (v == null) continue;
    const over = Math.max(LO - v, v - HI, 0);
    maxOvershoot = Math.max(maxOvershoot, over);
    if (!(over <= RANGE_TOLERANCE)) fail(`range: ${label}: ${a} = ${v}`);
  }
};
const near = (label: string, got: number | null, want: number) => {
  if (got == null || Math.abs(got - want) > 1e-9) fail(`range: ${label}: expected ${want}, got ${got}`);
};
{
  const all = (v: number) => Array.from({ length: 100 }, (_, i) => cup(5, i * 3.7, every(v)));
  const low = computeDna(all(LO), T);
  const high = computeDna(all(HI), T);
  for (const a of AXES) {
    // 1 is a real reading: 100 cups at 1 give a profile at 1, not "nothing".
    near(`100 cups 5★ at ${LO}, ${a}`, low.axes[a].value, LO);
    near(`100 cups 5★ at ${HI}, ${a}`, high.axes[a].value, HI);
  }
  inRange(`all ${LO}`, low);
  inRange(`all ${HI}`, high);

  // Half and half at equal weights (paired: same rating, same time).
  const [first, second] = AXES;
  const half = Array.from({ length: 100 }, (_, i) => cup(1 + (Math.floor(i / 2) % 5), Math.floor(i / 2) * 5, { [first]: i % 2 ? HI : LO, [second]: i % 2 ? LO : HI }));
  const h = computeDna(half, T);
  near(`${LO} and ${HI} half and half, ${first}`, h.axes[first].value, (LO + HI) / 2);
  near(`${LO} and ${HI} half and half, ${second}`, h.axes[second].value, (LO + HI) / 2);

  // Weights skewed hard both ways: 1 new 5★ against 99 one-year-old 1★.
  for (const [newV, oldV] of [[HI, LO], [LO, HI]]) {
    const skew = [cup(5, 0, { [first]: newV }), ...Array.from({ length: 99 }, () => cup(1, 365, { [first]: oldV }))];
    inRange(`skewed, new ${newV} / old ${oldV}`, computeDna(skew, T));
  }

  // Words only: no slider record means no value at all (never a word-made one).
  const wordsOnly = Array.from({ length: 500 }, (_, i) => cup(5, i * 0.5, {}, ['Grapefruit', 'Caramel', 'Black tea', 'Peach', 'Jasmine']));
  const w = computeDna(wordsOnly, T);
  for (const a of AXES) if (w.axes[a].value !== null) fail(`range: 500 words-only cups: ${a} should have no value, got ${w.axes[a].value}`);
  // One slider record under 500 cups of extreme words: the cap rescales, the value stays in range, words ≤ 1/3.
  for (const sliderAt of [LO, (LO + HI) / 2, HI]) {
    const flooded = [cup(1, 300, every(sliderAt)), ...wordsOnly];
    const f = computeDna(flooded, T);
    inRange(`1 slider at ${sliderAt} + 500 words-only cups`, f);
    for (const a of AXES) {
      const s = f.axes[a];
      const share = s.wordWeight / (s.sliderWeight + s.wordWeight);
      if (share > DNA_TUNING.wordShareCap + 1e-12) fail(`range: words' share on ${a} is ${share}, above the cap`);
    }
  }

  // Fuzz: random records, random "today".
  for (let seed = 100; seed < 1100; seed++) {
    const r = rng(seed);
    const cups = randomCups(seed, 1 + Math.floor(r() * 200));
    inRange(`fuzz seed ${seed}`, computeDna(cups, T + r() * 500 * DAY));
  }
}

// ── Step edges ───────────────────────────────────────────────────────────
// The nearest whole number: 1 is the first step (Faint), 5 the last
// (Strong); a half belongs to the step above; each value in exactly one step.
{
  if (stepWordOf(LO) !== 'Faint') fail(`step: ${LO} → ${stepWordOf(LO)}, expected Faint`);
  if (stepWordOf(HI) !== 'Strong') fail(`step: ${HI} → ${stepWordOf(HI)}, expected Strong`);
  if (stepWordOf(null) !== null) fail('step: not noted should have no word');
  const edges: [number, number][] = [[1, 0], [1.499999, 0], [1.5, 1], [2.499999, 1], [2.5, 2], [3.499999, 2], [3.5, 3], [4.499999, 3], [4.5, 4], [5, 4]];
  for (const [v, want] of edges) if (stepOf(v) !== want) fail(`step: ${v} → ${stepOf(v)}, expected ${want}`);
  let prev = 0;
  for (let i = LO * 1000; i <= HI * 1000; i++) {
    const st = stepOf(i / 1000);
    if (!Number.isInteger(st) || st < 0 || st >= STEP_WORDS.length) fail(`step: ${i / 1000} → ${st}, outside the step words`);
    if (st < prev || st > prev + 1) fail(`step: ${i / 1000} → ${st} after ${prev} (not one step at a time)`);
    prev = st;
  }
  if (STEP_WORDS.length !== HI - LO + 1) fail(`step: ${STEP_WORDS.length} step words for a ${LO}–${HI} scale`);
  for (const v of STOPS) if (!isAxisValue(v)) fail(`scale: stop ${v} is not a storable value`);
  for (const v of [0.5, 3.7, 5.5, 2.25, NaN]) if (isAxisValue(v)) fail(`scale: ${v} should not be storable`);
}

// ── 3. Registry, tokens and words agree ──────────────────────────────────
// A new axis is one registry entry plus one color.axis token (Turn 30): these
// fail if either is added without the other.
{
  const ids = new Set(AXES);
  if (ids.size !== TASTE_AXES.length) fail('registry: duplicate axis ids');
  if (new Set(TASTE_AXES.map((a) => a.order)).size !== TASTE_AXES.length) fail('registry: duplicate order');
  if (TASTE_AXES.some((a, i) => i && a.order <= TASTE_AXES[i - 1].order)) fail('registry: TASTE_AXES not in order');
  const tokens = Object.keys(color.axis);
  for (const a of TASTE_AXES) if (!tokens.includes(a.colorToken)) fail(`registry: ${a.id}'s colorToken ${a.colorToken} is not in color.axis`);
  for (const t of tokens) if (!TASTE_AXES.some((a) => a.colorToken === t)) fail(`tokens: color.axis.${t} belongs to no registered axis`);
  if ('roast' in color.axis || ids.has('roast')) fail('roast is not a taste axis (Turn 30): no registry entry, no axis colour');
  for (const [word, entries] of Object.entries(DNA_TUNING.words))
    for (const e of entries) {
      if (!ids.has(e.axis)) fail(`words: ${word} leans on ${e.axis}, which is not a registered axis`);
      if (!(e.at >= LO && e.at <= HI)) fail(`words: ${word} sits at ${e.at}, off the ${LO}–${HI} scale`);
    }
  // The dense vector: one slot per axis, registry order, null where not noted.
  const vec = axisVector({ [AXES[AXES.length - 1]]: LO, retired: 3 });
  if (vec.length !== AXES.length || vec.slice(0, -1).some((v: unknown) => v !== null) || vec[vec.length - 1] !== LO)
    fail(`vector: ${JSON.stringify(vec)}`);
  // Writing: only assessed axes make rows; bad ids and values throw.
  const rows = axisRows({ [AXES[0]]: LO, [AXES[1]]: null, [AXES[2]]: undefined });
  if (rows.length !== 1 || rows[0].value !== LO) fail(`axisRows: not noted must write nothing, got ${JSON.stringify(rows)}`);
  for (const bad of [{ roast: 3 }, { [AXES[0]]: 3.7 }])
    try {
      axisRows(bad);
      fail(`axisRows: accepted ${JSON.stringify(bad)}`);
    } catch {
      /* expected */
    }
}

// ── 4. Change tags (31e) ─────────────────────────────────────────────────
// 0.1, signed; under 0.05 no tag; a first reading has a step, no number.
{
  const [a, b, c, d, e] = AXES;
  const snap = (values: Record<string, number | null>) => Object.fromEntries(Object.entries(values).map(([k, v]) => [k, { value: v, n: 1 }]));
  const change: DnaChange = {
    before: snap({ [a]: 3, [b]: 3, [c]: 3, [d]: 3, [e]: null }),
    after: snap({ [a]: 3.05, [b]: 2.95, [c]: 3.049, [d]: 3.2, [e]: 4.4 }),
  };
  const got = JSON.stringify(changeDeltas(change));
  const want = JSON.stringify([
    { axis: a, kind: 'moved', delta: 0.1 },
    { axis: b, kind: 'moved', delta: -0.1 },
    { axis: c, kind: 'still' },
    { axis: d, kind: 'moved', delta: 0.2 },
    { axis: e, kind: 'first', step: 3 },
  ]);
  if (got !== want) fail(`tags: ${got} ≠ ${want}`);
  // A snapshot from before an axis existed, or with a retired one, still reads.
  const old = changeDeltas({ before: { roast: { value: 50, n: 1 } }, after: { roast: { value: 60, n: 2 } } } as DnaChange);
  if (old.length) fail(`tags: an unregistered axis made tags ${JSON.stringify(old)}`);
  // Stored snapshots keep enough precision for the tags.
  const s1 = snapshotOf(computeDna([cup(3, 0, { [a]: 2.5 }), cup(5, 0, { [a]: 3 })], T));
  if (s1[a].value !== 2.875) fail(`snapshot: expected 2.875 (three decimals kept), got ${s1[a].value}`);
}

if (problems.length) {
  console.error(`check:dna FAILED (${problems.length})\n  - ${problems.slice(0, 30).join('\n  - ')}`);
  process.exit(1);
}
console.log(`check:dna OK — ${AXES.length} axes from the registry; time shifts +1/+30/+365 days leave the profile unchanged (max float drift ${maxTimeError.toExponential(1)}); values within ${LO}–${HI} (max float overshoot ${maxOvershoot.toExponential(1)}); step edges, registry ↔ tokens ↔ words, change-tag rounding hold.`);
