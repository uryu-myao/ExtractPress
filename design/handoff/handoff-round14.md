# Round 14 handoff — Home shelf + All gear & beans

> **Rev 2.** Changes from the review:
> - The tab underline is now **2px**, using the existing border width. The 3px version is withdrawn.
> - The indicator bar is now **4px**, the existing meter track height.
> - The mini-bar track now uses the freshness track token.
> - **§3 "Cups total" is withdrawn.** `numeralHero` (lineHeight 79) and the 12px label margin (D-34) stay as they are.
> - New §0 maps every value to a token. New §4 covers gear usage data.

Reference frames in `ExtractPress-design.dc.html`: **17a / 17b** (Home), **17c / 17d** (full list). Header divider removal is already in code and is not covered here.

All type is Archivo unless noted. Colours: ink `#273D22`, muted `#6B5D55`, accent `#9E5202`, line `#D8C9BF`.

---

## 0. Token check (Code: verify every value against `tokens.ts`; stop and report anything that doesn't map)

**Already expressible**

| Value | Token |
|---|---|
| Tab underline 2px | `shape.borderWidth.box` |
| First-row divider 1.5px `#D8C9BF` | `shape.borderWidth.divider` + `divider.hairlineStrong` |
| Indicator height 4px | `size.meter.track` |
| Page gap 20px | `space[20]` (no semantic gap fits, so pick the primitive explicitly, as the margin rule says) |
| Thumbnail 44px | `size.tapTarget` is the same number, but the role is wrong (see "New tokens needed") |
| Gutters 22px | `layout.gutter` |
| Row padding 12px | `space[12]` |
| Status column gap 6px | `space[6]` |
| Tab row gap 22px | `layout.gutter`. Not a spacing step. Code to confirm this is acceptable or report it. |

**Derived, not tokens.** Compute these at runtime from the screen width, never hard-code them:
- Page width = `screenWidth − 3 × layout.gutter` (402 → 336).
- Peek = `2 × layout.gutter − space[20]` (24). It is a result of the width and gap, not a value of its own.
- Row height 68 = thumbnail + `2 × space[12]`. Drop the fixed `height:68px` and use padding. Both sides come out equal because the thumbnail is the tallest child.

**New tokens needed.** Code: do not invent these. Report back.
1. **Compact list thumbnail, 44px.** The only list thumbnail is `size.thumbnail.list` = 66. Proposed: `size.thumbnail.compact: 44`.
2. **Status column, 84px.** No width token exists. Proposed: `size.statusColumn: 84`. The alternative is to let the column hug its content and give only the mini bar a fixed width, which would be the same new token.
3. **Text styles.** None of these match a `textStyle`, and the rule is not to patch a single property:
   - Tab label: 13 / 700 / .06em, uppercase.
   - Tab count: 12 / 700 / .04em.
   - Status word: 11 / 700 / .06em, uppercase.
   - Gear line 2: 11 / 500.
   - Row name: 15 / 700. This matches `label` and is fine.
   - Row meta: 12 / 500. This matches `bodySm` and is fine.

   Design proposal: tab label and status word → `labelCaps` (12 / .08em), tab count → `meta`, gear line 2 → `bodySm`. Code to report whether that holds, before building.
4. **Inactive count colour `#8C7E76`.** This only exists as `beanFreshness.pastPeak.todayMarker`, not as a text colour. Proposed fallback: `color.text.muted`, the same as the inactive label.
5. **Indicator inactive segment widths** 24 / 10px. No token exists.

---

## 1. Home · My gear / My beans block (17a, 17b)

### Remove
- The 2px ink box and the file-folder tabs.
- The full list. Home shows **3 rows** per side.

### "Recently sipped" header
- Bottom padding goes from 14px to **2px**, so both section headers sit the same distance from their content.

### Tabs (the section heading)
- Row: `padding: 0 22px`, `gap: 22px`, bottom-aligned. It overlaps the first row's divider (`margin-bottom: -1.75px`, `z-index: 1`).
- Each tab is a button, `min-height: 44px`, `padding-bottom: 12px`, `border-bottom: 2px solid` (`shape.borderWidth.box`).
  - Label: 13px / 700, `letter-spacing: .06em`, uppercase. `MY GEAR`, `MY BEANS`.
  - Count: 12px / 700, `letter-spacing: .04em`, 5px after the label. Use the real item counts.

| | Label | Count | Underline |
|---|---|---|---|
| Active | `#273D22` | `#9E5202` | `#273D22` |
| Inactive | `#6B5D55` | `#8C7E76` | transparent |

- The active underline lands on the first row's 1.5px `#D8C9BF` divider, so the two read as one line.

### Swipe container
- Horizontal scroller: `scroll-snap-type: x mandatory`, `scroll-padding: 0 22px`, `padding: 0 22px`, `gap: 20px`. Hide the scrollbar. `overscroll-behavior-x: contain`.
- Two pages, each **336px** wide. Gear uses `scroll-snap-align: start`, beans uses `scroll-snap-align: end`.
  - Gear open: the beans page peeks **24px** at the right edge, cut by the screen edge. No fade, no frame.
  - Beans open: the page snaps to the right gutter, and the gear page peeks **24px** at the left edge. The two sides are symmetric (decided in review).
- Tapping a tab smooth-scrolls to its page.
- When the scroll position passes the midpoint, the active tab switches.

### Rows (same structure on both sides)
- Height is fixed at **68px** (`box-sizing: border-box`), `align-items: center`, `gap: 12px`.
- Only the **first** row has `border-top: 1.5px solid #D8C9BF`. There is no divider between rows.
- Thumbnail: 44×44, `border: 1.5px solid #C8BCB4`.
- Middle column (flex 1, ellipsis on both lines):
  - Name: 15px / 700, `#273D22`. Gear shows a `DEFAULT` badge after the name (`#273D22` background, `#F4EDEA` text, 9px / 700, `.1em`, uppercase, `padding: 2px 6px`).
  - Meta: 12px / 500, `#6B5D55`. Gear: the category (`Brewer`). Beans: `Roaster · 250 g` (bag size; there is no usage data yet).
- Right status column: 84px wide, right-aligned, `gap: 6px`.
  - Line 1: 11px / 700, `.06em`, uppercase.
  - Line 2 depends on the side (below).

**Gear status**

| State | Line 1 | Line 2 |
|---|---|---|
| Used | `N cups` in `#273D22` | `Last · today` (11px / 500, `#6B5D55`) |
| Never used | `Not used` in `#6B5D55` | `Add to a cup` |

**Bean status**
- Line 2 is a mini freshness bar: 84×4, track `color.surface.muted` (`#E4D6CC`, matching `component.beanFreshness.track`).
  - Peak window: `left: 17%`, `width: 35%`.
  - Fill: `0` to the current day %.
  - Marker: 2×12 at the current day %, `top: -4px`.

| State | Word colour | Fill | Marker | Window |
|---|---|---|---|---|
| `Drink now` | `#4A6640` | `#7E9675` | `#4A6640` | `#CFDCC8` |
| `Past peak` | `#9E5202` | `#C2B4AB` | `#8C7E76` | `#E4D6CC` |
| `Resting` | `#6B5D55` | `#C2B4AB` | `#8C7E76` | `#E4D6CC` |

- Home has no Finish button.

### Sort order
- Gear: Default first, then by cup count.
- Beans: drink-first, in the order Past peak → Drink now → Resting. Within a state, the oldest goes first.

### Indicator + action row
- Row: `padding: 6px 22px 0`, space-between.
- Left, the indicator: two bars, each 4px tall (`size.meter.track`), `gap: 4px`.
  - Active: 24px wide, `#273D22`.
  - Inactive: 10px wide, `#C8BCB4`.
  - Width and colour change with the active tab (`.2s` transition).
- Right, the action: **`SEE ALL GEAR & BEANS`** followed by a 16px chevron.
  - Text: 12px / 700, `.08em`, uppercase, `#5C5049`, height 44px.
  - It opens the full screen on the side that is currently active.

---

## 2. All gear & beans screen (17c, 17d)

This screen merges the old 3b (My gear) and 3d (My beans).

### Header
- One row: back button (44×44, existing style) + title **"Gear & beans"** (Instrument Serif 40px / 41px line-height, `#273D22`).
  - `gap: 12px`, `padding: 0 22px 14px`.
  - This is the same header pattern as Edit cup.

### Tab row
- The same tab component as Home.
- At the right end of the row, aligned to the bottom with `padding-bottom: 12px`, is the slot count:
  - Number: 12px / 700, `#9E5202`.
  - Label: 11px / 700, `.06em`, uppercase, `#6B5D55`.
  - Gear: `7 / 8 in my kit`. Beans: `3 / 5 on the shelf`.
- The page can be swiped between the two sides as well as tapped. The whole body swaps, slot count included.

### Body
- **Gear (17c):** the existing 3b list rows and the `Add gear · N slots left` dashed button. No other changes.
- **Beans (17d):** 3d's body: the bean cards, Finish bag / Open this bag, Add a bag, and Finished bags ›. The one change is that the roast tag (LIGHT / MEDIUM) is **removed**, because there is no roast data.
- Remove 3b's and 3d's old headers (serif title + large slot number).

---

## 4. Gear usage data (new)

The right-hand status column needs per-gear `cupCount` and `lastUsedAt`. Neither exists today.

- **Lookup.** Code to confirm that cups can be queried by gear id: count them, and take the latest `createdAt` (or brew date, if that exists).
- **Date format for "Last · …"**, by calendar days:
  - 0 days: `Last · today`
  - 1 day: `Last · yesterday`
  - 2–6 days: `Last · N days ago`
  - 7 days or more: `Last · Apr 12`
  - A different year: `Last · Apr 12, 2025`
- **Used, but no date can be resolved.** This is not "Not used". Show line 1 `N cups` only, omit line 2, and centre the column vertically.
- **Never used** (`cupCount = 0`): `Not used` / `Add to a cup`.

---

## Data notes
- Tab counts and slot counts must come from live data. The mock uses 7 gear and 3 beans.
- Gear "last used" and "N cups" come from cup records. If the data isn't there, fall back to `Not used`.
- Duplicate generic gear names are being handled separately and are out of scope.
