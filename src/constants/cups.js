import { partOfDay } from './dates.js';

/**
 * How a cup is named in lists and on its own page, degrading by mode (drift.md
 * D-16): made_it → bean name, barista → drink, packaged → product name.
 */
export const NONE = '—';

export const MODE_LABEL = { made_it: 'I made it', barista: 'Barista', packaged: 'Packaged' };

/**
 * A bag's process (3c / 3g, components.md "Bag form"; restored 2026-11-08).
 * No "Unknown": unset is the unknown answer (the set is clearable).
 */
/**
 * A bag's roast level, light → dark (bags.roast_level): FOUR VALUES,
 * DELIBERATELY (data-model.md, 2026-10-09, reaffirmed 2026-11-14). An ordered
 * scale Try Next can measure distance along; no medium-light (false
 * precision), no "other" (no place on the scale: a label that fits none is
 * left blank, "not recorded"). A fact printed on the bag, never a taste axis.
 */
export const ROAST_LEVELS = [
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'medium-dark', label: 'Medium-dark' },
  { value: 'dark', label: 'Dark' },
];

export const PROCESS_OPTIONS = [
  { value: 'washed', label: 'Washed' },
  { value: 'natural', label: 'Natural' },
  { value: 'honey', label: 'Honey' },
  { value: 'anaerobic', label: 'Anaerobic' },
  // Process is categorical, with no free text: other is where the rest go
  // (carbonic maceration, giling basah, co-ferments). Migration 12.
  { value: 'other', label: 'Other' },
];

const capitalise = (word) => word.charAt(0).toUpperCase() + word.slice(1);

/**
 * title and source line (2a's row, 2c's heading, 1b's recent rows).
 * I made it with no bag (a legitimate cup) is named by what it was brewed
 * with (decided 2026-10-12; Design 12b, 2026-10-13):
 *   bag      bean name · "roaster · process"
 *   brewer   brewer · "No bag · ‹grinder›" (the brewer is not repeated)
 *   grinder  grinder · "No bag"
 *   neither  "Morning cup" (the daypart 2c shows) · "No bag or gear noted"
 * noBag: how 2c says the absence, once, under its title (12a).
 * Barista: the drink · the café; Packaged: the product. "—" for a cup saved
 * without one (Barista cups logged before 2026-10-30 have neither).
 */
export function cupTitle(cup) {
  if (cup.mode === 'made_it') {
    if (cup.bean_name) {
      return {
        title: cup.bean_name,
        source: [cup.bean_roaster, cup.bean_process && capitalise(cup.bean_process)].filter(Boolean).join(' · ') || undefined,
      };
    }
    if (cup.brew_method) return { title: cup.brew_method, source: ['No bag', cup.grinder].filter(Boolean).join(' · '), noBag: 'No bag noted' };
    if (cup.grinder) return { title: cup.grinder, source: 'No bag', noBag: 'No bag noted' };
    return { title: `${partOfDay(new Date(cup.logged_at))} cup`, source: 'No bag or gear noted', noBag: 'No bag or gear noted' };
  }
  if (cup.mode === 'barista') return { title: cup.drink_type ?? NONE, source: cup.place_name ?? undefined };
  // Packaged (Design Round 7, 14b): one name as typed, no line 2 — no brand
  // field; line 2 is the store once Bought at returns.
  return { title: cup.product_name ?? NONE, source: undefined };
}

/**
 * Records' row, three lines at most, one job each (handoff-records §3,
 * 2026-11-16). cupTitle stays 2c's, the notices' and the delete sheet's.
 *   title   what it was. A Barista cup with no drink takes its café; a title
 *           is never "—" (a cup with neither name is "‹Morning› cup", as an
 *           I made it cup with nothing noted already is).
 *   source  how and from where: I made it, method · roaster (grouped by
 *           Roaster, the roaster leaves: the heading says it). No process
 *           (Uryu, 2026-11-17: §3's "· process" left out; 2c has it);
 *           Barista, the café (nothing when the café is the title);
 *           Packaged, the shop. A cup with no bag keeps cupTitle's line
 *           ("No bag · ‹grinder›").
 *   words   My words if any, else null; flavours, else null. Line 3 shows
 *           words, else flavours, else nothing.
 * TODO(data): Packaged's line is "shop · package"; cups keep no package
 * (can, bottle…), so it is the shop alone.
 */
export function archiveLines(cup, group) {
  const fallback = () => `${partOfDay(new Date(cup.logged_at))} cup`;
  let title;
  let source;
  if (cup.mode === 'made_it') {
    if (cup.bean_name) {
      title = cup.bean_name;
      const roaster = group === 'roaster' ? null : cup.bean_roaster;
      source = [cup.brew_method, roaster].filter(Boolean).join(' · ');
    } else {
      ({ title, source } = cupTitle(cup));
    }
  } else if (cup.mode === 'barista') {
    title = cup.drink_type || cup.place_name || fallback();
    source = cup.drink_type ? cup.place_name : null;
  } else {
    title = cup.product_name || fallback();
    source = cup.bought_at_name;
  }
  // One line: My words' own line breaks fold to spaces.
  const words = tidyNote(cup.note).replace(/\s+/g, ' ');
  const flavours = cup.flavours?.length ? cup.flavours.join(', ') : '';
  return { title, source: source || null, words: words || null, flavours: words ? null : flavours || null };
}

/**
 * My words as 2c and 2a's rows show them (2026-10-13, on device): empty
 * lines at the start and line breaks at the end are dropped, and between
 * lines at most one empty line is kept. The stored text is not changed.
 */
export const tidyNote = (note) =>
  note
    ? note
        .replace(/^(?:[ \t]*\n)+/, '')
        .replace(/\s+$/, '')
        .replace(/\n[ \t]*(?:\n[ \t]*)+\n/g, '\n\n')
    : '';
