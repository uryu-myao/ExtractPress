/**
 * A country's flag as a Unicode emoji, from its ISO 3166-1 alpha-2 code:
 * two regional indicator symbols ("ET" → U+1F1EA U+1F1F9 → 🇪🇹). Drawn by the
 * system's emoji font: NO NETWORK, no image, no CDN (the app promises "No
 * account, no server", and a local-first list must draw offline).
 *
 * iOS draws every pair as a flag. Android's support varies: some versions
 * show the two letters instead (i18n-notes.md; V1 is iOS only).
 */
const A = 0x1f1e6;

/** "ET" → "🇪🇹"; null for anything that isn't two letters A–Z. */
export function flagOf(iso2) {
  if (typeof iso2 !== 'string' || !/^[A-Za-z]{2}$/.test(iso2)) return null;
  return String.fromCodePoint(...Array.from(iso2.toUpperCase(), (c) => A + c.charCodeAt(0) - 65));
}
