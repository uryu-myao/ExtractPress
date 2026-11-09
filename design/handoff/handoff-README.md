# Handoff index: read this first

Updated 2026-11-09. Design's handoff files to Code, the latest version of each, and which file wins where they overlap.

## Files and versions

| File | Latest | How to tell you have it |
|---|---|---|
| `handoff-round21.md` | 2026-11-09 | Starts with an "Updated 2026-11-09" box; §3 Layout is marked SUPERSEDED |
| `handoff-round22.md` | 2026-11-09 | Has **§5 "Home's top block becomes a panel"** (added 2026-11-07, after the file first went out) |
| `handoff-round23.md` | **v2**, 2026-11-08 | Says "Version 2" at the top. §0 has "Body: fill / frame / shadow … `border.strong` / `shadow.floating`" |
| `MoreCoffee design.dc.html` | 2026-11-08 | Turn 24 (25a–25g) exists; 25a's tab body has an ink frame and a hard shadow |

A copy without these markers is stale. Take the current set from the artifact, not from an earlier chat attachment.

## Where files overlap, the later one wins

| Topic | Current spec | Superseded |
|---|---|---|
| **Home top (Cups total)** | `handoff-round22.md` §5 | `handoff-round21.md` §3 Layout, §0's rows for the total / stat rule / block padding |
| Home top: counting This month, Cafés | `handoff-round21.md` §3 Stats | — |
| Home top: counting Bags | `handoff-round23.md` §4 | `handoff-round21.md` §3 Bags row |
| **Bottom bar (footer)** | `handoff-round23.md` §1 (v2) | A1's four slots (brief Round 23), `handoff-round22.md` §2's "bottom bar's 2px top rule", design-system §9 Bottom bar |
| Frame colours elsewhere | `handoff-round22.md` §1–§4 | — |

## Check the build against these

### Home top (23b, 23c)
- [ ] The total, three stats and month strip are in **one panel**: `surface.raised`, 2px `border.muted`, padding 14 / 16.
- [ ] The panel sits `space[4]` under the header, gutter at the sides, `space[20]` above Record a coffee.
- [ ] Total: **Instrument Serif 64, line height 52** (`numeral.lg`, new style), `text.accent`. Not 96.
- [ ] "CUPS TOTAL" label and its 12 margin are unchanged.
- [ ] Numeral and stat column are **centre-aligned** (not bottom), `space[20]` apart. The column is 150 wide.
- [ ] Stats have **no hairline** under the rows; rows are `space[6]` apart. Each row: icon 16 · `space[6]` · label … value.
- [ ] Month strip: `space[14]` under the numeral row, inside the panel.
- [ ] On 402 × 874, the Taste DNA card's top is at **369**.

### Bottom bar (25a, 25b)
- [ ] Floating, not full width. There's **no** 2px top rule.
- [ ] Two pieces, both 56 tall with square corners, `space[12]` apart. They sit 22 from each side and 26 above the bottom edge.
- [ ] Body (Home · Records · Profile): `surface.raised`, **2px `border.strong` (ink), `shadow.floating` (4 / 4 / 0 ink)**. Three equal slots.
- [ ] +: 56 square, `color.action.bg` (blue), 2px ink frame, `shadow.floating`, white 22 plus. No name, no lift.
- [ ] On 402: body x 22–312, + x 324–380, both y 792–848.
- [ ] A 94 band (12 + 56 + 26) behind the bar shows paper, not content. Screens keep 94 + 20 under their last row.
- [ ] + pressed → `state.pressed.action` (no scale). Tabs pressed → scale 0.88. The active tab stays blue glyph and name.
- [ ] Tokens dropped: `tabBar.addSlot`, `tabBar.add`, `addLift`.

If any of these can't be built from the tokens, report it. Don't substitute a value.
