# Round 22 handoff — quiet frames (24b)

Decided by Uryu 2026-11-07: **24b**. Reference frames in `MoreCoffee design.dc.html`, Turn 23: **24a** 5a as now, **24b** 5a as decided, **24c** the rule, **24e** pressed. **24d** (the reference's fuller version, buttons pale too) was **not chosen** — don't apply it. Reasoning: `design-response-next.md`, Round 22.

One rule, applied by you across the app. No screen list: sort each 2px frame by the categories in §2.

---

## 0. Token check (Code: verify against the repo's `tokens.ts`; stop and report anything that doesn't map)

**No new values.**

| Use | Token |
|---|---|
| Control frame | `color.border.strong` (#273D22), as today |
| Container frame, chrome edge | `color.border.muted` (#C8BCB4), 2px (`shape.borderWidth.box`) |
| Hairlines inside containers | unchanged (`divider.hairline` / `hairlineStrong`, 1.5) |
| Pressed | unchanged: `state.pressed.row`, `state.pressed.surface`, `state.pressed.action` |

**Proposed aliases** (names only, same hex). Code: add if you agree, report if not.
- `color.border.container` → `border.muted`
- `color.border.control` → `border.strong`

Contrast: `border.muted` is 1.60:1 on ground, 1.82:1 on raised, 1.31:1 over `border.subtle`. That is the reference's level (1.55:1); don't go lighter.

---

## 1. §1 text (add to Hard Rules, after Shape)

> **Border colour: who gets ink (added 2026-11-07).** Width says what an edge is (§1 Shape: 2 = a box's outline, 1.5 = an internal divider or a weak frame). Colour says whether the box acts. The two are independent: every frame keeps its width.
> - **Control → ink** (`border.strong`). A box whose whole body is the thing you press and which holds nothing but its own label, glyph or value; it acts where it is (commits, types, toggles, sets, adds).
> - **Container → quiet** (`border.muted`, 2px). A box that encloses information or other things — including a whole card or row block that leads to another screen. Leading somewhere is the chevron's job (§1 Tap affordance), not the frame's.
> - **Chrome edges → quiet** (`border.muted`).
> - **Unchanged**: options, error frames and `state.error.shadow`, badges and stamps, thumbnails' 1.5 edge, hairlines, every dashed line (§8).
> - **The test**: does it act where it is, holding only its own label? Ink. Does it hold things, or go somewhere? Quiet.
> - **Shadows follow controls only.** A container never carries one.
> - **Pressed**: unchanged (§1 Pressed). No frame changes colour on press, pale or ink.

---

## 2. Categories

### Ink — controls (no change)
- `Button` primary and secondary (with their `HardShadow`)
- `IconButton` (back, close, edit, share…)
- Text fields and the search field
- `Switch` track and knob
- Unchecked checkbox and radio markers
- `AddButton`, steppers
- The slider's track keeps §9's `text.secondary` frame (full weight, unchanged)

### Unchanged — not border-coloured by this rule
- Options: selected = role fill; unselected = 1.5 `border.muted` (§1 Tap affordance)
- Error frames, error swatches and `state.error.shadow` (brown)
- Badges, the Early signs / Locked in stamp
- Thumbnails' 1.5 edge
- Hairlines and every dashed line (§8)

### Quiet — `border.muted` 2px
- Cards: Taste DNA (Home, 5c, 8f), bag cards (My beans), the star card (5a), Where it sat (2c / 11a), notices (13a)
- Form sections and FieldRow groups (5a / 5d / 5e shelf, café and product cards; 3c / 3g / 11a sections)
- List blocks: My gear, Profile groups, 8g's My numbers, Edit cup sections
- **Whole cards or row blocks that open another screen**: 6a's Taste DNA card and My shelf, 8d's suggestion card. Their chevron stays; their frame goes quiet.
- The 2c photo frame
- A sheet's top edge
- **Chrome edges**: the bottom bar's 2px top rule; fixed foot panels' top rule (5a's Save area, 5d, Edit bag / Edit cup)

### Shadow removed
- **8d's suggestion card** (`shadow.primary` on a container). Nothing else: every other ink shadow is already on a button.

### Not this round
- 5a's dashed "Add a photo" slot stays as is (hidden at this stage; it's drift against §8 and becomes an `AddButton` when it returns).
- Welcome (9a / 9b / 8a) brand graphics: out of scope.

---

## 3. Pressed (24e) — confirm nothing regresses
- A row inside a quiet container: `state.pressed.row`, bleeding to the container's frame (as now). The frame stays `border.muted` while held.
- A whole card that opens a screen: `state.pressed.row` across the card.
- Light controls: `state.pressed.surface`; primary: `state.pressed.action`; shadows unchanged.
- **No frame ever changes colour on press.**

---

## 4. Check on device
- 5a against 24b: only close, the selected maker option, Save and Add tasting note should read as heavy.
- Home and 6a: the Taste DNA card's edge must still be visible on ground in daylight. If it disappears on device, report it; don't darken it locally.
