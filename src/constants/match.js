/**
 * Word-start matching for the choice sheets (Origin, Region; brief 4b):
 * case- and accent-insensitive, the query matching the start of the whole
 * name or of any word in it — "Ke" → Kenya, "Rica" → Costa Rica, "Costa R"
 * → Costa Rica, "cote" → Côte d'Ivoire, "Iv" → Côte d'Ivoire (a word starts
 * after a space, a hyphen, a slash or an apostrophe).
 *
 * Returns the matched span in the name's own characters ({ start, length }),
 * so the typed part can be drawn in ink, or null.
 *
 * ASSUMES SPACES between words. ja and zh have none: when the names are
 * localised they need substring matching instead (i18n-notes.md). Not built.
 */
const BOUNDARY = /[\s\-/'’(]/;

/** One character, folded: lower case, accents off (Côte → cote). Always one character. */
const foldChar = (c) => c.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().charAt(0) || c.toLowerCase();

export const foldText = (s) => Array.from(s, foldChar).join('');

export function matchWordStart(name, query) {
  const q = foldText(query.trim().replace(/\s+/g, ' '));
  if (!q) return null;
  const chars = Array.from(name);
  const folded = chars.map(foldChar).join('');
  for (let i = 0; i <= folded.length - q.length; i++) {
    const atWord = i === 0 || BOUNDARY.test(chars[i - 1]);
    if (atWord && folded.startsWith(q, i)) return { start: i, length: q.length };
  }
  return null;
}
