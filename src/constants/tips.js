/**
 * Buy me a coffee's three tips (Design Round 26 B6, 28e / 28g; Round 28 A2,
 * Uryu, 2026-11-12). Consumable in-app purchases on App Store Connect,
 * registered 2026-11-20. They unlock nothing, so there is nothing to restore.
 *
 *   id      the App Store Connect product id ("support", not "tip": App
 *           Review reads them, and they match 6c's Support us)
 *   name    the row's name, ours (the product's display name on App Store
 *           Connect says the same, English only)
 *   onYou   the thank-you's words: "That's ‹onYou› on you."
 *   glyph   the row's small glyph of what it buys (28e / 28g)
 *   more    shown only after Support more (28g)
 *
 * Prices are never written here: they come from StoreKit, in the viewer's
 * currency and format (Round 28 A2). Japan: ¥300 / ¥600 / ¥1,200.
 */
export const TIPS = [
  { id: 'app.smallpress.extract.support.drip', name: 'A drip coffee', onYou: 'a drip coffee', glyph: 'tipCup', more: false },
  { id: 'app.smallpress.extract.support.pourover', name: 'A pour-over', onYou: 'a pour-over', glyph: 'pourOver', more: false },
  { id: 'app.smallpress.extract.support.beans', name: 'A bag of beans', onYou: 'a bag of beans', glyph: 'beanBag', more: true },
];

export const TIP_IDS = TIPS.map((t) => t.id);
