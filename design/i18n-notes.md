# MoreCoffee — i18n notes

Decided strings and translation constraints, recorded ahead of the ja / zh-Hans release. Only strings listed here are decided; anything else in the dev harness is a placeholder.

## Decided strings

| key | en | ja | zh-Hans | decided | note |
|---|---|---|---|---|---|
| `maker.packaged` | Packaged | 市販品 | 市售 | 2026-10-04 | Replaces "Ready-to-drink" in "Who made it?". The axis is who made the coffee, not its container — a can is not "bottled". |

## Fit checks

- **"Who made it?" maker chips** (`I made it / Barista / Packaged`): one line at 390pt and 393pt — 321px of chips in 346 / 349px of content width (web harness, Archivo). ja and zh placeholder sets also fit on one line.

## Scheduled for the V1.1 i18n pass

- **Nowrap chips** (from `gaps.md` 7, 2026-11-01): fixed-copy chips are `nowrap` (brew methods, maker chips, dates, status labels). Safe in English; in ja / zh, longer labels (e.g. brew methods, "Best rated") would push out of their row. Decide per locale: shorter strings, wrapping, or horizontal scroll. User-supplied names are never `nowrap` (truncation rule, `gaps.md` 1).

Both are recorded in `design-system.md` §11 (OQ-14):

- CJK bold — extend the font-face mapping to (family, weight, lang).
- `labelEyebrow` letter-spacing (1.6) is tuned for Latin capitals and reads too loose on CJK.
- zh chips sit taller than ja: PingFang SC's line box is about 1.4em against Hiragino Sans's 1.0em. Hiragino also lacks some simplified glyphs (e.g. 师), so a zh label can mix fonts. Layout centring is fixed; the metric gap is left to the mapping.

## Word-start matching assumes spaces (2026-11-14)

The Origin and Region sheets match a query at the start of any word (`src/constants/match.js`: "Rica" → Costa Rica), splitting words at spaces, hyphens, slashes and apostrophes. **ja and zh have no spaces**: when the country and region names are localised (V1.1 / V1.3, keyed by `origins.json`'s ISO code), those locales need substring matching instead (コスタリカ found by リカ). Not built.

## Flag emoji on Android (2026-11-15)

The Origin sheet shows each country's flag as a Unicode emoji built from its ISO code (`src/constants/flags.js`: two regional indicator symbols; no images, no network). iOS draws every pair as a flag. **Android's support is inconsistent: some versions draw the two letters ("ET") instead of the flag.** V1 is iOS only, so this is a note, not a problem. Revisit when Android lands (a check of the device's emoji support, or no flag there).
