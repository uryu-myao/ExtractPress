# Round 21 handoff — axis colours, change tags, Home's top block

> **Updated 2026-11-09. Parts of this file are superseded; read `handoff-README.md` first.**
> - §3 Layout and Expected result → `handoff-round22.md` §5 (Home's top block is a panel, total 64).
> - §3 Bags counting rule → `handoff-round23.md` §4 (every bag added).
> - Everything else here stands.

Reference frames in `ExtractPress-design.dc.html`, Turn 22: **23a** (axis colours, spec), **23b** (Home), **23c** (Home top, states and counting rules), **23d** (5b), **23e / 23f** (5c and tag states), **23g** (2c and 11a), **23h** (8f). The reasoning is in `design-response-next.md`, Round 21.

The three parts are independent. Build them in any order.

All type is Archivo unless noted. Colours: ink `#273D22`, muted `#6B5D55`, secondary `#5C5049`, accent `#9E5202`.

---

## 0. Token check (Code: verify every value against the repo's `tokens.ts` and `design-system.md`; stop and report anything that doesn't map)

**Already expressible**

| Value | Token |
|---|---|
| Readout track 4 / marker 2 × 14 | `size.meter.track` / `size.marker.line` |
| Computed marker | `color.text.muted` |
| Entered marker (2c, 11a) | `color.border.accent` |
| 5c ghost fill and marker | `color.border.muted` (unchanged) |
| Gap between axes in a card | `spacing.gap.axis` (20) |
| Poles row ↔ track, key ↔ pole label | `spacing.gap.row` (8) |
| Tag ground / text | `color.badge.bg.neutral` / `color.badge.fg.neutral` |
| Tag text | `textStyle.labelEyebrow` |
| Tag padding | `spacing.badge.inline` (4 / 8) |
| Gap inside a tag, between tags | `space[6]` |
| Home total | ~~`textStyle.numeralHero`~~ → **`numeral.lg` 64 / 52** (`handoff-round22.md` §5), colour `text.accent`; its label and 12 margin unchanged (D-34) |
| Stat label / value | `labelEyebrow` + `text.muted` / `numeralInline` + `text.primary` |
| Stat row rule | ~~hairline under each row~~ → **none** (`handoff-round22.md` §5) |
| Stat rows gap, icon ↔ label | ~~`space[8]`~~ → **`space[6]`** / `space[6]` |
| Stat icons | `icon.sm` (16 / 2.6), `color.icon.muted` |
| Numeral ↔ stat column | `space[20]` |
| Day square | `size.dot.bullet` (6) |
| Day colours: cup / past without / still to come | `text.accent` / `border.muted` / `border.subtle` |
| Square ↔ today underline | `spacing.gap.tight` (4) |
| Block padding | ~~`space[8]` top, no panel~~ → **a panel** (`surface.raised`, 2px `border.muted`, inset 14 / 16), `space[4]` above, `layout.gutter` sides, `space[20]` below; numeral row ↔ strip `space[14]` (`handoff-round22.md` §5) |

**New tokens needed.** Code: these are decided by Design; add them, don't substitute.
1. **`color.axis.acidity` `#7C7D0F`, `color.axis.body` `#614A87`, `color.axis.roast` `#9D3D36`, `color.axis.sweetness` `#AE5A84`.** Identity colours, outside §1's three roles, like `icon.rating`. Put the rule in the token's comment: *used for the four taste axes only, never as text, never for anything else.* Contrast on track / card / ground: 3.08–5.21 / 4.28–7.24 / 3.78–6.40.
2. **Axis key, 12 × 4.** Height is `size.meter.track`; the 12 width has no token. Proposed: `size.axis.key: { w: 12, h: 4 }`.
3. **Stat column, 150 wide.** No width token. Proposed: `size.statColumn: 150`. Report if you'd rather let it flex to the remaining width.
4. **Today underline, 8 × 2** (square + 2; height = `shape.borderWidth.box`). Proposed: derived in code, not a token. Report if you disagree.
5. **Two new stroke glyphs** for `Glyph`, SVG in `assets/icons/`: `calendar.svg` (This month), `store.svg` (Cafés). 24 × 24 viewBox, `stroke="currentColor"`, round caps and joins, drawn at `icon.sm`; `Glyph` sets size and stroke as for the others.
   - **Bags uses the existing `beanBag`** (6a's My beans). No new bag glyph (revised after build, see design-response Round 21 build questions).
   - `store` final paths: `M3 9l1.5-5h15L21 9` · `M3 9h18v1.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z` · `M5 12.5V20h14v-7.5` · `M10 20v-5h4v5`.
   - `pin` stays on the Café row.

---

## 1. Axis colours — AxisReadout and AxisSlider (23a, 23d)

### AxisReadout (Home card, 5c, 2c, 11a, 8f)
- **Fill**: from 50 to the value, in the axis's `color.axis.*`. Replaces `border.medium` (computed) and `icon.accent` (2c entered). Same geometry, the 4pt track.
- **Marker**: unchanged geometry; colour by **role**: computed `text.muted`, entered `border.accent`. The marker, not the fill, now says computed vs entered.
- **Key**: a 12 × 4 bar in the axis colour, `gap.row` before the left pole label, on every readout, including value null and value 50 (both have no fill, the key keeps the axis named).
- **Value null**: unchanged ("Not noted yet" / "Not noted" on a raised patch).
- **5c ghost**: unchanged, drawn underneath; the current fill is the axis colour on top.
- **Order**: Acid ↔ Bitter, Body, Roast, Sweetness everywhere. 8f's mock had Sweetness above Roast: drift.
- The marker stays required: the fill now clears 3:1 and carries direction and distance, but at 50 there is no fill and the role lives on the marker.

### AxisSlider (5b)
- **Only the key is added.** Handle, track, dots, Clear / Not noted: exactly §9.
- The key **hangs outside** the 260 track: absolute, its right edge `gap.row` left of the left pole label, so the pole labels keep their positions and Low / High sweetness still fits. Not on the track, never next to the handle.
- Screen reader: no change (the key is decorative).

---

## 2. Change tags — 5c and 2c (23e, 23f, 23g)

### Remove
- The per-axis "Moved N points toward ‹pole›" lines under each readout (5c) and under Feeds my taste DNA (2c).

### Tag
- `[key] ‹POLE LABEL› +N` — e.g. `BITTER +6`, `LIGHT ROAST +5`. The pole label is the one printed on that axis's readout. N = points moved toward that pole, **always positive**, rounded to whole points.
- One tag per axis that moved ≥ 1 point. Under 1 point: no tag.
- First value on an axis: `STARTS AT ‹STEP NAME›`, no number (step names: §9's table, e.g. "Starts at Lightly sweet").
- Order: the fixed axis order. Wrap with `space[6]` both ways.

### Where they sit
- **5c**: inside the Taste DNA card, under the summary sentence, `space[12]` above; the "Where it sat before" legend follows, then the readouts.
- **2c**: inside the Feeds my taste DNA pressable row: heading, sentence, tags. Chevron on the heading line (16b). Shows the stored `dna_change`, so it matches what 5c showed at save time.

### Sentence (kept)
| Case | Sentence |
|---|---|
| Something moved | "This cup pushed you ‹c1› [and ‹c2›]." — the two that moved most, current phrases (brighter / more bitter; lighter-bodied / fuller-bodied; toward lighter roasts / toward darker roasts; less sweet / sweeter) |
| Only first values | "My taste DNA has its first ‹Axis› reading." / "…its first Roast and Sweetness readings." |
| Nothing moved (no tag at all) | "Your Taste DNA stays where it was — nothing on this cup moves it." (unchanged) |

Axis names in the first-reading sentence: Acidity, Body, Roast, Sweetness.

---

## 3. Home top block (23b, 23c)

### Remove
- The This week panel (`surface.sunken` box, its count and the Mon–Sun strip).
- "A slow start is still a start." and its dashed rule.
- (Already V1:) no Try next row, no "3 of 5 cups" on the card.

### Layout — SUPERSEDED by `handoff-round22.md` §5 (panel, `numeral.lg` 64, centre-aligned, no hairlines, rows `space[6]`)
- ~~Row, bottom-aligned, `space[20]` gap:~~
  - Left: "CUPS TOTAL" label + total (`numeralHero`, accent), unchanged.
  - Right: stat column (150; hugs its content once the total reaches four digits, see design-response), three rows, `space[8]` apart. Each row: [icon 16] `space[6]` [label] ……… [value], centre-aligned, hairline under each row.
- Under the row, `space[14]`: the **month strip**, full content width.

### Month strip
- One cell per day of the current month (28–31), equal-width grid. In each cell a 6 × 6 square, centred; under it (`gap.tight`) an 8 × 2 line, ink only for today, empty otherwise.
- Square colour: a day with ≥ 1 cup `text.accent`; a past day with none `border.muted`; today with none `border.muted`; days after today `border.subtle`.
- No label. Days are the device's local calendar days (the same rule as the old weekday strip). The month rolls over at local midnight on the 1st.

### Stats (counting rules)
| Stat | Counts | Notes |
|---|---|---|
| This month | cups logged since the 1st of the current month (local) | all three modes |
| Bags | ~~distinct bags across all my cups~~ → **every bag added** (`handoff-round23.md` §4) | I made it cups with a bag. Key on `bag_id`; a cup whose bag was deleted (`bag_id` null) counts by its copied `bean_name` + `bean_roaster` + `bean_roasted_at`. Not origins: no form fills `origin` yet |
| Cafés | distinct cafés my cups point at | `cups.place_id` → `places.kind = 'cafe'`. Stores (`bought_at_place_id`) don't count. Show 0 as 0 |

- No week streak (Design decided not to define one).
- Values through `Intl.NumberFormat`. Reset (`reset_at`) does **not** apply: these are counts of records, not the profile.

### Expected result — SUPERSEDED
- ~~189 → 157 tall, DNA card top 366~~. Now: **the Taste DNA card's top lands at 369** on 402 × 874 (`handoff-round22.md` §5).

---

## Data notes
- Bags and Cafés need two new queries (distinct counts).
- Tags read the stored `cups.dna_change`; no recompute.
- The axis colours are used only in AxisReadout and AxisSlider. Code: if anything else reaches for them, stop and report.
