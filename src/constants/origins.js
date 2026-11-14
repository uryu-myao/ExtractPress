/**
 * Coffee origins and regions, bundled (no backend, no network): the flat
 * data in origins.json and regions.json, reviewable as data, not code
 * (data-model.md "Origins and regions").
 *
 * origins.json  [{ name, iso2, aliases[] }], A–Z by name
 *   name     English, THE KEY: bags.origin stores this string, byte for
 *            byte, so a pick from the list matches every other pick (Try
 *            Next's origin matching) with no code column. Do not add
 *            bags.origin_code.
 *   iso2     ISO 3166-1 alpha-2, carried for later: the join key for
 *            localised country names (V1.1 / V1.3) and Try Next's taxonomy.
 *            Unused in V1.
 *   aliases  older or other names (Swaziland → Eswatini, Ivory Coast →
 *            Côte d'Ivoire), so a row stored under one still resolves.
 * regions.json  [{ name, country, verify? }], flat, grouped by country
 *   name     the TRADE NAME as a bag prints it (Yirgacheffe, Guji, Huila),
 *            not an administrative division
 *   country  an origins name
 *   verify   true: not confident in this entry; for Uryu to scan
 *   5–15 per country at most, and not every country has any: a country
 *   without regions still works (the sheet shows "From my bags" and free
 *   text). Flat, not nested, because Region's search runs across every
 *   country at once, each row labelled with its country (32f).
 *
 * These are Try Next's planned taxonomy's first two dimensions (origin ×
 * process × flavour): extend these files, never a second copy.
 * Checked on every commit: npm run check:origins.
 */
import ORIGINS_DATA from './origins.json';
import REGIONS_DATA from './regions.json';

export const ORIGINS = ORIGINS_DATA;
export const REGIONS = REGIONS_DATA;

const fold = (s) => s.trim().toLocaleLowerCase('en');
const BY_FOLDED = new Map();
for (const o of ORIGINS) {
  BY_FOLDED.set(fold(o.name), o);
  for (const a of o.aliases) BY_FOLDED.set(fold(a), o);
}

/** The origins entry for a stored or typed name, through its aliases; undefined for a name not in the list. */
export const originOf = (name) => (name ? BY_FOLDED.get(fold(name)) : undefined);

/** A country's bundled regions, in the file's order ([] for a country with none). */
export const regionsOf = (country) => REGIONS.filter((r) => r.country === country);
