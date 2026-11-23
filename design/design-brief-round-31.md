# Design brief — Round 31

## Beans: visual-led shelf and detail page

---

## Why this round

Bean bags are the only objects in the app that are physically
distinctive. Right now they appear as square thumbnails, which throws
that away — a shelf of real packaging is recognisable at a glance, a
grid of squares is not.

iOS can lift the bag out of its background on device (subject lifting).
Code has confirmed this is available: the app's minimum is already
iOS 17. So the shelf can show the bag itself, standing free, rather
than a photo of a table with a bag on it.

This round also feeds the App Store screenshots, which are shot in
December. **The Home shelf is the single most important screen in this
brief** — if time runs short, finish that first and leave the detail
page.

---

## Decisions already made — do not re-open

**Photography is full colour everywhere, including cup photos.** The
duotone + dither treatment is retired. Bags and gear are *objects* and
have to stay recognisable; a duotoned bag is an unidentifiable brown
shape. A unifying filter or outline may be added later, but not in this
round.

**Scheme D (Ruled lines) is adopted — but only as a backdrop inside
photo tiles and the detail-page top visual. Never as a page background.**

Your own note on D said it was the weakest of the four and shown to be
ruled out. That judgement was correct *for a full-page background*,
where rules cut across text at arbitrary heights and fight the hairlines
inside cards. Inside a fixed-size tile with no text and no card over it,
none of that applies. The 28pt rhythm does not carry over either — see
the spacing rule below.

Page background stays `mc-bg-main`, flat.

**No new colours.** The three colour roles stand.

**A hand holding the bag is part of the look.** Most bag photos are
taken holding the bag up, and the cutout keeps the hand. This is the
intended result, as in the kissaten examples — not a defect to hide.
There is no setting to remove it and no "use rectangle" option on the
edit page (see 2a for what this means for the tile).

---

## In scope

1. Home → the Beans shelf (horizontal, with the next item peeking)
2. The Beans tab — full list view
3. The Beans detail page — top visual and its scroll behaviour
4. Tile geometry, shared with Gear

## Out of scope — do not touch

- **The Gear detail page.** Unchanged.
- Gear tile *content* — it keeps its photo-or-placeholder behaviour.
  Only the tile frame is shared (see below).
- Cup photos — now full colour, but no layout change.
- Everything below the top visual on the Beans detail page: name,
  roaster, Country / Farm / Process, Finish, edit. Already designed.
- OCR and auto-fill. Not in V1.

---

## 1. Tile geometry

One tile component, two contexts:

- **Home shelf** — horizontal scroll, next tile peeking at the edge
- **Beans tab** — vertical grid

State the aspect ratio you choose and the reasoning. Bags are portrait
objects; a square tile will crop them or float them in dead space.

Gear uses the same frame at the same size, with different content
inside. The two tabs sit behind one switcher, so if Beans tiles become
tall image cards while Gear stays text rows, switching tabs will feel
like two different apps. Shared frame, different fill.

## 2. Three tile states for Beans

A real shelf will contain all three at once. **The hard part of this
brief is making them sit at the same visual weight so a mixed shelf
doesn't look broken or half-finished.** Please solve that explicitly
rather than designing the happy path and leaving the others as
fallbacks.

**a. Lift succeeded** — bag cut out, full colour, standing on the ruled
backdrop.

**The hand-held cutout.** Code tested the cutout on 14 real photos
(bags, cans and bottles, held up in shops, on a shelf, flat on a
table). What it showed:

- **The hand is always kept.** Vision returns the bag and the hand
  holding it as one object, so Code can't drop the hand by picking a
  part. Every hand-held photo became bag + hand.
- **The hand is cut off where it leaves the photo.** The arm runs out of
  the frame, so the cutout has a hard straight edge there, usually at
  the bottom or the right. Floating free in a tile, it looks like a
  severed hand.
- **Softening the cut hand is a design problem: please propose a
  solution.** Code knows which side(s) of the photo the cutout touches
  and can pass that to the tile. Each of these can be built, and they
  can be combined:
  1. **Snap to the edge.** Put the cut edge flush against the tile's
     bottom or right side, so the hand reads as reaching in from outside
     the frame.
  2. **Fade the cut.** The cutout fades out over the last part of its
     length toward the cut edge, so the wrist dissolves into the
     backdrop instead of ending in a hard line. This is done once, when
     the photo is saved. Prototype: `faded/` (22% of the cutout's
     length; `-fade-compare.jpg` shows before and after). The catch:
     when the bag itself also reaches that edge of the photo, the bag's
     bottom fades with the hand (see 1137, 1147).
  3. **Cover the cut.** A foreground element at the tile's foot, such as
     a caption band or a rule, overlaps the bottom of the cutout, so the
     wrist goes under it.
  4. **Crop in.** Scale the cutout up so most of the hand falls outside
     the tile. The bag gets bigger, and the hand shows as fingers only.

  Pick one, or a combination, and say why. Show a cutout touching the
  bottom edge, one touching the right edge, and one touching neither
  (a bag flat on a table or on a shelf). Say how much of the tile the
  cutout fills in each case. Remember 1146 below: there the hand ends
  at the sleeve, inside the photo, so options 1 and 2 don't reach it.
- **The hand takes up room**, so a hand-held bag is smaller in its tile
  than a bag photographed alone. Make sure a mixed shelf still lines up.
- **Clear plastic bottles stay see-through.** The shop behind a
  transparent bottle shows through it in the cutout, and nothing can
  remove it. Accept it; don't design around it.
- Edges are soft and clean at full size, with no jagged steps. Gold foil
  and white bags against bright shop shelves cut out fine.

**b. Lift failed** — Vision may find no subject. In the 14 test photos
this never happened, including the bag flat on a table. Kraft paper
hasn't been tested yet and is the most likely case. The tile falls back
to the original rectangular photo. It should look like a deliberate
alternative, not a degraded one.

**c. No photo** — a large typographic block built from the first
character of the bag name.

- Japanese names take the first character: 「森彦の時間」→ 森,
  「キリマンジャロブレンド」→ キ. CJK glyphs are square and will not
  behave like a Latin cap — check both.
- No new colours. If a shelf of these looks monotonous, solve it with
  type scale and placement, not with tinting by name.
- Must not read as an error or an empty slot.

## 3. Ruled-line backdrop

- **Spacing must divide the tile height evenly**, so every tile has its
  rules in the same place and no rule is ever clipped mid-gap. Give the
  value per tile size, and state the rule you used so Code can derive it
  for any future size.
- Line weight stays constant between the shelf tile and the detail-page
  visual, so both read as the same material. Spacing may differ.
- The rules sit under full-colour photography and must not compete with
  it. They are a surface, not a pattern.

## 4. Beans detail page — top visual

- Large visual at the top: cutout on the ruled backdrop, same material
  as the tiles.
- **The nav title appears on scroll.** The bag name is not in the nav
  bar at rest; it fades in as the visual scrolls away. Specify the
  threshold, and both nav states.
- Pull-down on the visual can scale it. Confirmed feasible on the
  native driver — specify if you want it.
- All three tile states apply here too, at a larger size.

---

## Attached: the test cutouts

Real cutouts from the 14 test photos, made the way the app will make
them (long side 1200, Vision). Use them in the mocks instead of
invented ones.

- `cutouts/IMG_xxxx-cutout.png`: transparent PNG, cropped to the
  cutout. Use these to lay out tiles.
- `IMG_xxxx-sheet.jpg`: the original photo, the cutout on a checkerboard
  and the cutout on dark green, side by side, for reference.
- `faded/IMG_xxxx-faded.png`: the same cutouts with option 2's fade
  (2a), transparent. `faded/IMG_xxxx-fade-compare.jpg`: before and after.

Which edges of the original photo each cutout touches (share of that
edge), which is where the hand is cut off:

| Photo | Subject | Touches |
|---|---|---|
| 1135 | Kaldi bag, held | right 7% |
| 1136 | Kaldi bag, flat on a table | none |
| 1137 | OK bag (gold foil), held | bottom 14%, right 20% |
| 1138 | OK bag (gold foil), held | bottom 18%, right 17% |
| 1139 | Morihiko bag (pink), held | bottom 34%, right 11% |
| 1140 | Morihiko bag (white), held | bottom 42%, right 16% |
| 1141 | Morihiko bag (white), held | bottom 52%, right 4% |
| 1142 | Ogawa bag (white), held | bottom 21%, right 27% |
| 1143 | AGF bag (blue foil), held | bottom 7%, right 34% |
| 1144 | Starbucks clear bottle, held | right 30% |
| 1145 | BOSS bottle on a shop shelf | none |
| 1146 | Craft Boss bottle, held | none (the hand ends at the sleeve) |
| 1147 | Tully's can, held | bottom 25%, right 55% |
| 1148 | Tully's can, held | bottom 8%, right 50% |

1146 shows that a held subject can touch no edge. The placement rule
must cover a hand that ends inside the photo too.

---

## Reference, and what not to take from it

The attached screenshots are from **kissaten**. They are included for
*the idea* — free-standing packaging on a textured ground, photography
as the primary content — and for nothing else.

**Do not carry over its styling.** It uses rounded corners, soft
shadows and graph paper. Extract Press has no border radius anywhere,
hard shadows with zero blur, and ruled lines. The badges ("Review") and
the Recipes action in those screenshots are their features, not ours.

---

## Please return

1. Home shelf with a mixed set — at least one of each of the three
   states, side by side, with at least one hand-held cutout among the
   lifted ones. This is the one that matters most.
2. Beans tab grid, same mixture.
3. Beans detail page top, at rest and scrolled past the threshold.
4. The ruled-line spec: weight, spacing, colour, and the rule for
   deriving spacing at a new tile size.
5. Tile aspect ratio with reasoning.
6. The cut-hand solution (2a): which option(s), and why. Show a cutout
   touching the tile's bottom edge, one touching the right edge, and one
   touching neither. Give the rule Code should follow: which edge it
   snaps to, how much of the tile the cutout fills, and, if you choose
   the fade, its length.
