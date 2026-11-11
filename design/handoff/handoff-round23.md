# Round 23 handoff: floating bar, Try next on Home, Restore

> **Version 2, 2026-11-08 (updated 2026-11-09). Read `handoff-README.md` first.**
> - **v2 change: the tab body takes the +'s ink frame and hard shadow** (2px `border.strong` + `shadow.floating`), Uryu's comment on 25a. Version 1 had a quiet `border.container` frame and no shadow. If your copy says "no shadow" on the body, it is v1.

The reference frames are in `ExtractPress-design.dc.html`, Turn 24:

| Frame | Shows |
|---|---|
| **25a** | the bar over Records, 20 rows |
| **25b** | the bar's spec, pressed and active states |
| **25c** | Home with Try next |
| **25d** | Try next's four kinds and the dismissed state |
| **25e** | 6b My data |
| **25f** | Restore: confirm, working, done |
| **25g** | Restore: refusals, and first setup |

The reasoning is in `design-response-next.md`, Round 23.

Status: **§1 Bottom bar is decided (Uryu, 2026-11-08): build it.** It replaces A1's four slots. §2 Try next waits for the planner (it may still leave V1, see the brief's B6). §3 Restore and §4 go ahead.

All type is Archivo unless noted. Colours by token; hex only for reference.

---

## 0. Token check

Code: verify against `tokens.ts`; stop and report anything that doesn't map.

**No new values.**

| Use | Token |
|---|---|
| Bar height (both pieces) | `size.tabBar.height` (56) |
| Side inset | `layout.gutter` (22) |
| Gap between body and + | `space[12]` |
| Under the bar | home-indicator inset − `space[8]` (26), as today |
| Body: fill / frame / shadow | `surface.raised` / 2px `border.strong` / `shadow.floating` (4) — revised 2026-11-08, Uryu: the tabs are controls |
| +: fill / glyph / frame / shadow | `color.action.bg` / `color.action.fg` / 2px `border.strong` / `shadow.floating` (4) |
| + pressed | `state.pressed.action` |
| Tab glyph, name, colours | unchanged: `component.tabBar.glyph` (20), `textStyle.tabLabel`, `tabBar.icon.active` / `inactive` |
| Try next card | ground `surface.ground`, 2px `border.container`, `spacing.inset.container` (14 / 16) |
| Try next title / reason / eyebrow | `display.sm` (Instrument Serif 30 / 31) / 13 `text.secondary` / `labelEyebrow` `text.accent` |
| Try next action | secondary `Button` (paper, ink frame, no shadow), 44 tall; "Not for me" / "Undo" = text action |
| Restore meter | `size.meter.track` (4), track `border.subtle`, fill `text.muted` |
| Photos-missing divider | 1.5 dashed `border.soft` (§8: two parts of one block) |

**Dropped when this lands**:
- `tabBar.addSlot` and `tabBar.add` (the ink square);
- `component.tabBar.addLift`.

`shadow.floating` gets a consumer again.

**One new glyph**: `restore` (24 viewBox, stroke `currentColor`, round caps and joins, as the others), paths `M12 20V9` · `M7 14l5-5 5 5` · `M5 4h14`. It pairs with Export's down-arrow-into-tray. Also `spark` for Try next's eyebrow, at `icon.sm`, `text.accent`: `M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18`.

---

## 1. Bottom bar (25a, 25b) — replaces A1's four slots and §9 Bottom bar

### Layout (402 × 874; scales with width)
- A row of two pieces, `layout.gutter` from each side and 26 above the bottom edge, `space[12]` apart, both 56 tall, square corners.
- **Body** (flex): `surface.raised`, 2px `border.strong`, `shadow.floating` (the same frame and shadow as the +; revised 2026-11-08). Three equal slots: Home · Records · Profile. Each slot is the whole touch area (≈ 95 × 52 at 402). Glyph (20 box) + `gap.tight` + name, centred, as today.
- **+** (56 × 56): `color.action.bg`, 2px `border.strong`, `shadow.floating`, a 22 plus in `color.action.fg` at stroke 2.6. No name. The `addLift` goes: the + is centred.
- At 402: body x 22–312, + x 324–380, both y 792–848.

### The band
- From 12 above the bar's top to the screen's bottom edge (12 + 56 + 26 = **94**), content doesn't show. Paper ground with its dots, no rule, no fade, no blur.
- Simplest build: the scroll viewport ends 94 above the edge, so the fixed `DotTexture` shows through. Only if that's awkward: an opaque view with a `DotTexture` aligned to the fixed one.
- Screens keep **94 + `space[20]`** under their last row.
- Toast: `space[12]` above the band (§9 Toast's "above the bar" now means above the band).

### States
- Active tab: blue glyph and name, as today. Nothing added.
- Tab pressed: scale 0.88 (`motion.press`), as today.
- **+ pressed: `state.pressed.action`**, no scale; frame and shadow unchanged. Update §1 Pressed: the + moves from the scale list to the darken list.
- Haptic: light impact on both, as today.

### §9 text: replace the Bottom bar section with
> **Bottom bar (2026-11-08, Round 23).** Two pieces, floating: a body with three tabs (Home · Records · Profile) and the + to its right. Both are 56 tall (`size.tabBar.height`) with square corners and a 2px frame, `space[12]` apart, inset by `layout.gutter` and sitting the home-indicator inset less `space[8]` above the bottom edge. Both pieces are controls, with a `border.strong` frame and `shadow.floating`: the body on `surface.raised`, its three slots sharing its width, each the whole touch area; the + on `color.action.bg`, darkening to `state.pressed.action`. Behind the bar, from `space[12]` above it to the edge, a band of plain ground hides the content (no rule, no fade). Screens keep the band plus `space[20]` under their content. *The 2026-10-05 objection (elevation over a full list read as noise) is met by the band: the shadows fall on plain ground, never on rows.*

---

## 2. Try next card on Home (25c, 25d)

### Place
- On Home, **under the Taste DNA card**: the DNA card's existing `space[20]` above it, `layout.gutter` at the sides, 22 below it before Recently sipped's heading (the section break Home already uses after the DNA card).
- **No suggestion → nothing is rendered.** No placeholder, no teaser. Remove 5c's "One more cup and Try next opens up."

### Anatomy (top to bottom)
1. Eyebrow row: `spark` (14, `text.accent`) + `space[6]` + "TRY NEXT" (`labelEyebrow`, `text.accent`).
2. Title, `display.sm`, `text.primary`, `space[6]` above.
3. Reason, 13 / 1.45, `text.secondary`, `space[6]` above. **One line** (write copy to fit; it may wrap on the smallest phones).
4. Actions, `space[12]` above: secondary button (when the kind has one) + `space[16]` + "Not for me" text action. Card padding 14 top, 16 sides, 6 bottom (the 44 actions carry their own room).

### Variants

| Kind (priority) | Title | Reason | Action → route |
|---|---|---|---|
| 1 Other brewer | ‹Bean› in the ‹brewer›? | ‹Brewer› cups average ‹x.x› stars. ‹Bean› in the ‹other›: ‹x.x›. | **Log a cup** → Record sheet, that bag and brewer preselected |
| 2 Bag | ‹Bean›, again? | Five stars in ‹Month›. Last brewed ‹n› weeks ago. | **Add it to my beans** → 3c, name and roaster filled |
| 3 Café | Back to ‹Café›? | Five stars in ‹Month›, not since. | **Open in Maps** → Apple Maps with the stored MapKit id (leaves the app) |
| 4 Tag lead | Look for ‹tag› | It's on ‹n› of the 5-star cups. | **See the ‹n› cups** → Records search for ‹tag› (8l results) |

- Stars: whole numbers spelled as words in the reason ("Five stars"); averages to one decimal.
- No "your" in the copy.
- Numbers through `Intl.NumberFormat`.
- If Records search can't match tasting-note tags, report it. The tag lead's action depends on it.
- The selection rules (priority, Monday rotation, a dismissed one never returns) are the planner's (brief B3), unchanged.

### States
- Button pressed: `state.pressed.surface`. Text actions: scale (§1). The card itself is not pressable.
- **"Not for me"**: the card is replaced in place by a 52-tall line in the same frame: "Hidden. It won't come back." (13, `text.secondary`) and **Undo** (text action) on the right. It stays until Home is next shown, then the next suggestion appears, or nothing. Undo restores the card; the dismissal is committed when Home is left.
- Crossfade with `motion.expand`.

---

## 3. Restore (25e–25g)

### 6b My data
- Export row: "Export everything" / "Cups, bags, gear and photos". The file is named **"Extract Press backup ‹date›.zip"**.
- **App empty** (no cups, bags, gear or cafés): rows are Export everything · **Restore from a backup** ("From an Export everything file", `restore` glyph, chevron) · Backup · Reset my taste DNA.
- **App not empty**: no Restore row. Under the block, `space[8]` below: "Restoring a backup works on an empty app only." (12 / 1.45, `text.secondary`). Not a disabled row.
- Restore opens the iOS file picker (zip and the older JSON).

### Sheets (§9 Sheet; scrim, quiet top edge, grab handle)

| Step | Title | Body | Buttons |
|---|---|---|---|
| Confirm | Restore this backup? | From ‹8 Nov 2026›: ‹214› cups, ‹9› bags, ‹6› gear, ‹4› cafés and ‹31› photos. | **Restore** (primary) · Cancel (secondary) |
| Working | Restoring… | Photos ‹18› of ‹31› + meter (4pt) | none; not dismissible |
| Done | All back. | ‹214› cups, ‹9› bags, ‹6› gear and ‹4› cafés are in. My taste DNA is rebuilt from them. | **Go to Home** (primary) |
| Done, photos missing | All back. | ‹214› cups, ‹9› bags, ‹6› gear and ‹4› cafés are in. + dashed divider + "‹3› bag photos weren't in the file. Those bags show the placeholder; a photo can be added from each bag's page." | **Go to Home** |
| Not a backup | That file can't be restored. | It isn't an Extract Press backup. Exports are named "Extract Press backup ‹date›.zip". | Choose another file (secondary) |
| Newer app | Update first. | This backup comes from a newer version of Extract Press. Update the app, then try again. | OK (secondary) |
| Damaged | That file can't be read. | It may be damaged or incomplete. Nothing was changed. Try another copy of the backup. | Choose another file |
| Not empty | Only on an empty app. | There's already ‹1 cup› here. Restoring never merges or overwrites, so it works on an empty app only. | OK |

- Counts omit a zero kind ("214 cups, 9 bags and 31 photos" if there's no gear or café).
- Counts use singular and plural.
- If gear or café counts aren't available from the engine, drop them and report.
- Sheet titles: `display.sm`. Body: 14 / 21, `text.secondary`.
- No error colour on refusals.

### First setup (8n)
- At the foot of step 1, above Next: a hairline, then "New phone?" (13, `text.secondary`) and **Restore a backup** (text action) on the right. It opens the same picker and sheets.
- After a successful restore, setup is skipped and Done's Go to Home lands on Home.

---

## 4. Smaller items
- **3c Process**: show the four chips (no fold), 44 tall, as built. 3g's 33 is drift.
- **3c photo slot**: solid 2px ink, as built (confirmed).
- **Bags stat**: counts every bag added, open or finished, brewed or not. A deleted bag counts only if cups point at it, by their copied name + roaster + roasted on. Supersedes `handoff-round21.md` §3's Bags row.
- **Name**: EXTRACT PRESS in Home's and 6a's eyebrows (built). The unbuilt strings follow the boards.

## 5. Check on device
- 25a over Records on the 15 Pro Max:
  - do the two shadows read as calm over a full list (the band behind them)?
  - does the + reach one-handed?
- Try next on Home: the card must not read as part of the DNA card.
