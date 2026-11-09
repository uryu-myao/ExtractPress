# Design brief — Round 24 (2026-11-09)

Round 24 · after Round 23 (25a–25g, built 2026-11-08 / 09)

**Status: ready to send (Uryu, 2026-11-09).**

Reply under "Round 24" in `design-response-next.md`, numbered as in this brief. One item: **a warning colour for destructive actions.**

## 1. What Uryu decided

Every command that deletes should look like a warning (Uryu, 2026-11-09). Until now they had no look of their own (§1 Tap affordance, 2026-10-09). Confirmation or undo protected them, and the product had no warning colour.

Code first looked for one in the DS. The only candidate is `state.error` (5d's required-field error), and it is the accent's brown:

| token | hex | is also |
|---|---|---|
| `state.error.border` | `#9E5202` | `text.accent`, `icon.accent`, `marker.required` |
| `state.error.text` | `#8A4602` | `text.accentStrong`, `border.accent` |

It is built that way now (commit `9161b54`, on Uryu's phone). **Uryu's verdict: brown as a warning is too much of a stretch.** It is also the colour of "My taste DNA", the eyebrows and entered values. §1 itself says brown never goes on an action ("brown carries only entered values").

**So: please pick a warning colour.**

## 2. Where it goes (as built today)

| Screen | Control | Form today | Built look (interim) |
|---|---|---|---|
| 11b, and the bag (3g) and gear (3e) delete sheets | "Delete this cup", "Delete this bag", "Remove from my gear" | primary button (blue fill, ink frame, `shadow.primary`) beside a secondary "Keep it" | warning fill, white label; ink frame and shadow kept |
| 11a (Edit cup) | "Delete this cup" | text action, stacked under the full-width buttons, underlined | warning label |
| 3g (Edit bag) | "Delete this bag" row, with a bin glyph and a hint line | `labelCaps` ink + bin in `icon.accent` | label and bin warning; hint stays `text.muted` |
| 3e (Edit gear) | "Remove from my gear" row, the same | the same | the same |
| Photo sheet (3c / 3g) | "Remove photo" | text action | warning label |
| Discard sheet (3g, 3e, 11a) | "Discard changes" | text action, stacked | warning label |
| 5b | "Discard and save" (shown only once something is entered; otherwise "Save without the note") | secondary button | warning label only while it discards |
| Search start (18a, replaces 8l) | "Clear" (recent searches) | text action | warning label |

**Left out by Code** (they undo input, they don't delete records): the clear × in a field, the taste axis "Clear", the × on a search filter, Sort's "Reset". Say if any of them should be in.

**Not built yet, will need it**: 8g's "Reset my taste DNA".

## 3. Constraints

- **Contrast**: text at least 4.5:1 on `surface.ground` `#F4EDEA` and `surface.raised` `#FFFCFA` (sheets are raised). If it fills a button, the label on it needs 4.5:1 too, and the fill needs a darker pressed tier (§1 Pressed: the fill darkens, never opacity).
- **It has to differ from colours already in use:**
  - the accent browns `#9E5202` / `#8A4602`;
  - the action blue `#067BC2` (pressed `state.pressed.action`);
  - the rating gold `#C9821A`;
  - success `#4A6640`;
  - above all `color.axis.roast` `#9D3D36`, which is already a red. Its rule is "the four taste axes only, never text, never anything else". A red warning must not read as the Roast axis, on 2c and 5c where the axes and Delete this cup can share a screen.
- **§1 still holds**: colour alone never says "pressable". Text actions keep the underline, and rows keep the bin.
- **Confirmation and undo stay** (`gaps.md` 18). The colour adds to them; it doesn't replace them.

## 4. Questions

1. **The colour**: its hex(es) and token names. For example `color.warning.text` / `.fill` / `.pressed` / `.onFill`. The interim tokens are `state.error.action.{bg, pressed, fg}`.
2. **Filled or not**: should the confirm sheets' primary be a warning fill, or stay a normal button with a warning label? (iOS's own sheets use red text, not a red fill.) Right now 3 controls are filled and 6 are text-only.
3. **The row's bin and hint**: in 3g / 3e's delete rows, should the bin take the warning colour too, and should the hint line stay muted?
4. **5d's required-field error** (`state.error`, brown): should it move to the new colour, or stay brown? Is a missing required field a "warning" in the same sense?
5. **§1's text**: the destructive line in Tap affordance, and "never brown on an action". Please give the wording you want in `design-system.md`.
6. **Scope**: is the list in §2 right, including what Code left out?

## 5. What Code does with the answer

- Swap the interim tokens for yours. The `destructive` prop on `Button` (primary / secondary / text) and the two delete rows read only those tokens, so the change is in `tokens.ts` plus any form change from question 2.
- Write your §1 text into `design-system.md`, with a changelog entry.
- Until then the brown stays on the phone. It can go back to plain ink in one commit if Uryu would rather not look at it meanwhile.
