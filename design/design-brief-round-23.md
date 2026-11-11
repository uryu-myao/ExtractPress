# Design brief — Round 23 (2026-11-08)

Round 23 · after Round 22 (24b, built 2026-11-07)

**Status: draft, waiting for the planner's review (2026-11-08). Not sent.**

Reply under "Round 23" in `design-response-next.md`, numbered as in this brief.
- **A** reports what is built. Say if you see a problem. A2 has two questions.
- **B** asks you to draw the Try next card. **It is not built until you have drawn it.**
- **C** asks you to draw Restore, in My data. The engine is being built now; the rows wait for you.
- **D** carries two items collected since Round 22.
- **E** asks you to draw a new bottom bar (Uryu, 2026-11-08): floating again, three tabs, and the + on its own to the right.

**Context: V1 is going to the App Store by the end of December 2026.** The app is now called **Extract Press** (2026-11-08).

## A. Built (2026-11-08)

### A1. The bottom bar has four slots: Home · Records · + · Profile

- **Why**: Try next is not a tab in V1 (planner, 2026-11-08). On V1's data it can make four kinds of suggestion, each needing weeks of records, so as a tab it would sit empty for a new user for weeks. App Review also rejects the placeholder it shows today ("This screen is being rebuilt.", Guideline 2.1). It becomes a card on Home instead (B).
- **Layout A, four equal slots** (planner's choice): the icons evenly spaced inside the gutter, as before.
  - **The + is no longer in the middle.** It sits right of centre, at about 5/8 of the width (61 %).
  - Rejected: keeping the + centred (two tabs on the left, one on the right: lopsided), and moving it to the end (the thumb has learned it inside).
  - At 390pt the icon centres are 65 / 152 / 238 / 325.
- **Not final until checked on Uryu's phone** (15 Pro Max): whether the + is harder to reach with one hand off centre. The build is on his phone.
- §9's bar text now says four slots (`design-system.md`).
- **This is the interim bar.** Uryu wants the bar drawn again for 3 + 1 (E). Don't redraw A1 in your file; draw E.

### A2. Process is back on 3c and 3g

- Washed / Natural / Honey / Anaerobic, as decided 2026-10-09 (`components.md`, "Bag form: origin, region and process").
- **Clearable**: pressing the selected chip clears it.
  - No "Unknown" chip: unset means "don't know" (decided earlier).
  - The selected chip is ink, with no darker tier, so it presses by scale (§1, "no darker tier left"). This is the first clearable set built.
- Origin and Region stay out of V1: they need the country list and its search sheet.
- Why now: Washed / Natural is on every bag's label and is what people choose beans by, so a bag record without it has a hole. It is also a Try next input.
- **Where it sits**: under Roaster, above Roasted on, on both screens. 3g draws it under Roast level, and Roast level isn't built, so it sits where that block would.
- **Two questions** (built one way for now; tell us which):
  1. **Fold or show on 3c?** Your 3c folds Process into a "+ Origin · Process / Optional" line. With Origin out, that line would open onto one row of four chips, so 3c shows the row itself, as 3g does. 3c is the 15-second path: keep a fold (now just "Process"), or show the chips?
  2. **Chip size: 44 or your smaller one?** Built with the maker chips' padding (14 / 16, 44 tall, the tap target). Your 3g draws 9 / 14, about 33 tall. Either way four labels wrap to two lines on every phone, as your 3g does at that width. If smaller, it would be SegmentedControl's compact size (32, with a hit-slop back to 44), as 2b's Group by.
- Where the value shows: 2a's row second line, "roaster · process" (already drawn). Cups logged from the bag carry it, and editing the bag on 3g rewrites it on those cups (the copy rule).

### A3. The name in the eyebrows

1b's and 6a's eyebrow reads **EXTRACT PRESS** (was MORECOFFEE). Your file still has the old name in these places:
- 1b's and 6a's eyebrows;
- "Rate MoreCoffee";
- "MoreCoffee 1.4.0 (2026.09)";
- "System permission is on for MoreCoffee.";
- "Only shown to you — MoreCoffee has no social feed."

The last four aren't built. Please update them when you next touch those boards.

## B. Please draw: the Try next card on Home

Background: `try-next-v1.md` (the whole analysis). Decided by the planner, 2026-11-08: **no tab, no 8e, a card on Home**.

**B1. What the card carries.** One suggestion at a time. Each suggestion has **one reason line and one or two actions**, plus "Not for me". The four kinds:

| Kind | Title (provisional) | Reason line (provisional) | Actions |
|---|---|---|---|
| Revisit a bag | Hoja Verde, again? | Five stars in September. Your last cup of it was six weeks ago. | **Add it to my beans** (opens 3c with name and roaster filled in) · Not for me |
| Revisit a café | Back to Fuglen? | Five stars in September, not since. | Not for me. "Open in Maps" is possible (the café's MapKit id is stored) but would be a new interaction: your call |
| The other brewer | Guji in the AeroPress | Your AeroPress cups average 4.3 stars; Guji in the V60, 3.0. | **Log a cup** (the Record sheet with that bag and brewer preselected) · Not for me |
| A tag lead | Look for blackcurrant | It's on 4 of your 5-star cups. Check the next bag's label. | Not for me (nothing to do in the app until you buy beans) |

The copy is yours. The facts in it are what the data can say: V1's stars are whole, so "4.5" can't appear, and averages can.

**B2. No suggestion means no card.** The whole card is absent: no empty state, no "Try next opens at 5 cups", no teaser. 5c's "One more cup and Try next opens up" is gone too.

**B3. When several qualify**: the other brewer first (usable today, with what you already have), then a bag, then a café, then a tag. The suggestion changes on Monday, or when dismissed. A dismissed one never comes back.

**B4. Where on Home.** Our proposal: under the Taste DNA card.
- It is "what to do with what the DNA knows", so it reads after it.
- It must not push "Record a coffee" or the counts down when it appears.
- Its look should say it is a suggestion, not a record or a stat: it shouldn't read as part of the Taste DNA card.
- Your call: the position, and whether it is one card with the four as variants (we expect so).

**B5. States to draw.** Each of the four kinds. "Not for me" pressed: does the card leave at once, or leave a line ("Hidden. It won't come back.")? Pressed states follow §1.

**B6. Something to know before you start** (the planner's concern, recorded 2026-11-08).
- For someone logging about a cup a day, the first suggestions arrive roughly when:
  - a tag lead: day 10–20;
  - a café: day 30 or later;
  - a bag: day 45 or later;
  - the other brewer: only for people with two brewers.
- So in the first month most people see at most the tag lead, the weakest kind: there is nothing to press except "Not for me".
- **The planner will judge from the built card whether it is strong enough for the store build**, and may leave it out of V1. If the tag lead can be made to carry more (a link to the cups it's based on, say), that helps.

## C. Please draw: Restore from a backup (My data, 6b)

Decided 2026-11-08 (planner): V1 can read a backup back in (`import-v1.md`). Without it, a user who changes phones or deletes the app has no way to bring their records back. Everything but the UI is being built now.

**What changes:**
- **"Export everything" now writes a zip**: the records and the bags' photos (originals; the styled copies are remade). It was a JSON with no photos. Its sub line is ours for now: "Cups, bags, gear and photos". Please confirm or rewrite.
- **A new row, "Restore from a backup"**, in My data next to it. It opens the iOS file picker. Older JSON exports and files from before the rename are read too.

**The rule that shapes the row: restore works only on an empty app** (no cups, bags, gear or cafés). Never a merge, never an overwrite.

**C1. The row when there are records.** This is the main question:
- **hidden**: clean, but someone who logs a first cup on a new phone and then looks for Restore finds nothing;
- **shown, disabled, with a line saying why** ("Only on an empty app"): honest, but a dead row on every screen from then on.
- Your call. A third way is fine.

**C2. The steps to draw:**
1. Picker, then a **confirm sheet** with what the file holds, e.g. "Restore 214 cups, 9 bags and 31 photos from 8 Nov 2026?". We give you the counts and the date.
2. **Working**: usually a second or two; longer with many photos.
3. **Done**.
4. **Refused**, one message each. Our wording is provisional:
   - not a backup: "This isn't an Extract Press backup."
   - made by a newer app: "Update the app, then try again."
   - damaged;
   - the app isn't empty.
5. **Photos missing**: the records came back but some photos didn't (missing from the file). Those bags show the placeholder. A line on Done, or nothing?

**C3. The first setup?** Someone restoring is usually on a fresh install. Should Restore also appear where a new user starts? Your call.

## D. Carried from `design-brief-next.md`

1. 3c's photo slot is built solid, not dashed (drift D-63; dashed never says "press this", §8).
2. Bags counts every bag added, not only bags across my cups (Uryu, 2026-11-06).

Details for both are in `design-brief-next.md`.

## E. Please draw: the bottom bar, floating, with the + on its own (Uryu, 2026-11-08)

Now that the bar holds three tabs and the +, Uryu wants it to say so: **three tabs in one body, and the + as a separate button beside it.**

**Uryu's direction:**
1. **Floating again**, no longer full width on the bottom edge: the bar sits above the bottom edge, inside the screen.
2. **Two pieces side by side**:
   - the **body**: Home · Records · Profile, the three tabs, each with its name under the glyph as now;
   - the **+**: its own button, **to the right of the body**.
3. **The + takes the CTA's blue**, `color.action.bg` (#067BC2), the same as "Record a coffee", with `color.action.fg` for the glyph. Today it is an ink square.
4. **One style for both**: the + is drawn in the body's language (frame, height, corners, shadow or none), so they read as one bar in two parts, not as a bar plus a stray button.

**What to settle in the drawing:**
- **The gap and the sizes**:
  - the space between body and +;
  - the +'s width (square at the body's height?);
  - the inset from the screen's sides (`layout.gutter`, 22, as the screens?);
  - the inset from the bottom: above the home indicator, and how far.
- **Shadow or frame.** The old floating bar (the source's 1b / 2a / 6a / 8d: 90% wide, `shadow.floating`) was taken off on 2026-10-05: over a full Records list its elevation read as noise. The full-width bar with a 2px top rule replaced it. A floating bar comes back to that question. Options:
  - a frame only (2px, `border.container` or ink, Round 22);
  - `shadow.floating` on both pieces;
  - the + with the CTA's hard shadow, as "Record a coffee", and the body without.
  
  Your call. Please show it over a full list (2a with 20 rows), not only over an empty screen.
- **What shows under and between the pieces.** Content scrolls behind the bar. The gap between the pieces and the strip below them show the list through. Is that fine, or does the strip need a ground behind it? Screens keep room under their content so the last row clears the bar.
- **Pressed**:
  - The tabs scale, as now.
  - The + changes rule: as an ink square it had no darker tier, so it scaled. **A blue fill does have one**, `state.pressed.action` (as "Record a coffee"), so by §1 it would darken instead. Please confirm.
- **The active tab**: today's blue glyph and name. With a blue + right beside the body, does the active tab still read, or does it need another sign (an underline, a fill)?
- **Reach**: the + moves to the right edge of the bar. Planner's note: in A1, "the + at the end" was the option set aside, because the thumb had learned it in the middle. On the right edge it sits under a right thumb. Please keep it inside the tap target (44 or more) and clear of the screen's rounded corner.

**What we'll do**:
- A1's four-slot bar stays until you have drawn E.
- Then E replaces it, and §9 is rewritten again.
- Building it is mostly `FooterNav`: the body and the + become two views, and the screens' room under the content follows the new height.

