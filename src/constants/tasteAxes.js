/**
 * THE AXIS REGISTRY — the one definition of the Taste DNA axes, read by the
 * screens and by the engine (src/data/tasteDna.ts) alike (Turn 29 / 30,
 * boards 30a–30d and 31a–31g; data-model.md "cup_axes").
 *
 * NOTHING ELSE MAY LIST THE AXES OR COUNT THEM. Every screen and every
 * calculation iterates TASTE_AXES. The set has gone from three to four to
 * five, and V2 will likely add more; with the cup_axes join table and this
 * registry, a sixth axis is one entry here plus one color.axis.* token — no
 * migration, no screen edit. Do not write `5`, `['acidity', …]` or
 * `axis_acidity` anywhere else.
 *
 * Each axis is UNIPOLAR: how strongly it was tasted, 1 (faint) to 5
 * (strong), in halves (AXIS_SCALE). 1 is a real, low reading, not an
 * absence; an axis the drinker did not assess has no value at all (no row in
 * cup_axes; a missing key here). There is no midpoint and no neutral value:
 * 3 is "medium", not "balanced", and nothing is ever pre-set to it.
 *
 * Entry
 *   id          stored in cup_axes.axis; never renamed once shipped
 *   labelKey    the string key for when the app is localised (no string
 *               table yet: i18n-notes.md); `label` is the English meanwhile
 *   label       the axis as one noun (5b's title column, 8f, change tags)
 *   colorToken  the key of its identity colour in tokens.ts color.axis
 *               (axisColor() in src/theme/axisColor.js resolves it)
 *   order       display and vector order (fixed: 23a's rule that the
 *               colours' weakest pair, Acidity–Bitterness, stays adjacent and
 *               labelled)
 *
 * ROAST IS NOT AN AXIS (Turn 30, 31f). Roast level is a fact printed on the
 * bag (bags.roast_level), not something the drinker tasted, so it never
 * enters the profile. Bitterness is a new dimension, not roast renamed: it
 * comes from over-extraction as much as from roast level, which is why the
 * two had to separate (data-model.md "Roast is not a taste axis").
 */
const REGISTRY = [
  { id: 'acidity', labelKey: 'axis.acidity', label: 'Acidity', colorToken: 'acidity', order: 1 },
  { id: 'bitterness', labelKey: 'axis.bitterness', label: 'Bitterness', colorToken: 'bitterness', order: 2 },
  { id: 'body', labelKey: 'axis.body', label: 'Body', colorToken: 'body', order: 3 },
  { id: 'sweetness', labelKey: 'axis.sweetness', label: 'Sweetness', colorToken: 'sweetness', order: 4 },
  { id: 'aftertaste', labelKey: 'axis.aftertaste', label: 'Aftertaste', colorToken: 'aftertaste', order: 5 },
];

/** The axes in display order. Iterate this; never index it by a literal. */
export const TASTE_AXES = Object.freeze(REGISTRY.slice().sort((a, b) => a.order - b.order).map((a) => Object.freeze(a)));

/** The ids, in order. */
export const AXIS_IDS = Object.freeze(TASTE_AXES.map((a) => a.id));

const BY_ID = new Map(TASTE_AXES.map((a) => [a.id, a]));

/** The registry entry for an id, or undefined (an id no longer registered). */
export const axisById = (id) => BY_ID.get(id);

export const isAxisId = (id) => BY_ID.has(id);

/**
 * The scale every axis shares: 1–5 in halves, nine stops (30a–30d). The same
 * rule as cup_axes' CHECK (value between 1 and 5, value × 2 whole).
 */
export const AXIS_SCALE = Object.freeze({ min: 1, max: 5, step: 0.5 });

/** Whether `value` is a storable reading: on the scale, on a stop. */
export const isAxisValue = (value) =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= AXIS_SCALE.min &&
  value <= AXIS_SCALE.max &&
  Number.isInteger((value - AXIS_SCALE.min) / AXIS_SCALE.step);

/**
 * The step words, one per whole number from AXIS_SCALE.min (31d; 5b's key
 * "1 · Faint / Strong · 5"). Words about how much, never how good: a 1 on
 * Bitterness is "faint bitterness", not a bad cup. Shared by every axis,
 * since every axis is the same kind of scale.
 */
export const STEP_WORDS = Object.freeze(['Faint', 'Light', 'Medium', 'Bold', 'Strong']);

/**
 * A value's step: the nearest whole number (halves round up, so an edge
 * belongs to the step above, as the old bands' edges did), as an index into
 * STEP_WORDS. Used for words only: a profile is a weighted estimate, so it is
 * never shown as a number (31d).
 */
export const stepOf = (value) => {
  const whole = Math.min(AXIS_SCALE.max, Math.max(AXIS_SCALE.min, Math.floor(value + 0.5)));
  return whole - AXIS_SCALE.min;
};

/** The step word for a value ("Bold"), or null when not noted. */
export const stepWordOf = (value) => (value == null ? null : STEP_WORDS[stepOf(value)]);

/**
 * A cup's (or a profile's) axes as a DENSE VECTOR in registry order: one slot
 * per registered axis, the value where it was assessed and null where it was
 * not ("not noted" is an absence, never a number). `axes` is the sparse form,
 * { [id]: value }, as cup_axes rows give it; ids no longer in the registry
 * are dropped. This is the shape Try Next's similarity work will read
 * (masking the nulls); no similarity is computed here.
 */
export const axisVector = (axes) => TASTE_AXES.map((a) => (axes && axes[a.id] != null ? axes[a.id] : null));
