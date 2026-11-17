import GEAR_CATALOGUE_DATA from './gear.json';

/**
 * The gear catalogue (3a), bundled: the flat data in gear.json, reviewable as
 * data, not code, in the family of origins.json / regions.json (data-model.md
 * "Gear catalogue"). No backend, no network.
 *
 * gear.json  [{ category, name, maker, meta, verify? }], grouped by category
 *            in GEAR_CATEGORIES' order, five each, 3a's order within one
 *   name     as the row shows it; a pick COPIES it onto the gear row
 *   maker    copied too (3e's Maker)
 *   meta     two facts, "A · B", chosen to help recognise one's own gear:
 *              brewer   material · type        "Ceramic · Cone dripper"
 *              grinder  burr · size            "Conical steel · 39 mm"
 *              kettle   control · spout        "Variable temp · Gooseneck"
 *              scale    resolution · feature   "0.1 g · Built-in timer"
 *   verify   true: written without a board to copy from; for Uryu to scan.
 *            3a draws only the brewer five, which are verbatim.
 *
 * A pick is copied, never referenced by id: 3e renames gear, so the name
 * can't be a key, and a cup copies its bag the same way. So a correction
 * here never rewrites gear a user already saved. No generic entries ("any
 * kettle"): no kettle recorded already means "no temperature advice".
 * Checked on every commit: npm run check:gear.
 */
export const GEAR_CATALOGUE = GEAR_CATALOGUE_DATA;

/** 3a's tabs, in order. */
export const GEAR_CATEGORIES = ['brewer', 'grinder', 'kettle', 'scale'];

/** One category's catalogue entries, in the file's order (3a's rows). */
export const catalogueOf = (category) => GEAR_CATALOGUE.filter((g) => g.category === category);

/**
 * Gear pick list (design/components.md "Adding a bag and gear…"): 8c's generic
 * gear, verbatim (names and hints), each with the category it fills. 8c's
 * "I mostly drink out" is a setting, not gear, so it is not here.
 */
export const GEAR_TYPES = [
  { name: 'Pour-over dripper', hint: 'V60, Kalita…', category: 'brewer' },
  { name: 'Hand grinder', hint: 'C40, 1Zpresso…', category: 'grinder' },
  { name: 'French press', category: 'brewer' },
  { name: 'Espresso machine', category: 'brewer' },
];

/**
 * At most this much gear on the shelf (3a "3 / 8 Selected · 5 slots left").
 * NOT A LAYOUT NUMBER: decided 2026-11-17, this is the free / Pro line at
 * V1.5 (data-model.md "The 8-slot gear cap"). Do not raise or remove it.
 */
export const GEAR_LIMIT = 8;

/** A category as the shelf names it (4a "Brewer · 2 cups", 3b, 3e). */
export const GEAR_CATEGORY = { brewer: 'Brewer', grinder: 'Grinder', kettle: 'Kettle', scale: 'Scale' };

/** Gear a cup can hold (brewer_id / grinder_id): only these count cups or take a default. */
export const onCups = (category) => category === 'brewer' || category === 'grinder';
