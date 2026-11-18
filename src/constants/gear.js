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
 *   verify   true: written without a board to copy from, for Uryu to scan.
 *            None now: 3a draws the brewer five (verbatim), and Uryu
 *            confirmed the other fifteen (2026-11-18). A new undrawn entry
 *            goes in with it.
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

/**
 * No longer 3a's list (3a lists GEAR_CATALOGUE, 2026-11-17): kept for first
 * setup's 8c (V1.5), which picks generic gear.
 *
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

/**
 * A cup's gear roles (migration 14: all four kinds, one of each): the
 * category, its id column and its name copy on cups. Every place that reads
 * or writes a cup's gear goes through this list.
 */
export const CUP_GEAR = [
  { category: 'brewer', id: 'brewer_id', name: 'brew_method' },
  { category: 'grinder', id: 'grinder_id', name: 'grinder' },
  { category: 'kettle', id: 'kettle_id', name: 'kettle' },
  { category: 'scale', id: 'scale_id', name: 'scale' },
];

/** A cup's gear names in role order: Method's line ("Hario V60 02 · Comandante C40 · Stagg EKG"). */
export const cupGearNames = (cup) => CUP_GEAR.map((r) => cup[r.name]).filter(Boolean);
