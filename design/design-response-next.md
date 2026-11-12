# Design response — design-missing.md

## Round 27 · Best-before bags, bag reminders, the welcome (2026-11-11)

Mock:

- **New: Turn 28.**
  - **29a**: 3c's date row and its sheet.
  - **29b**: 19a for a best-before bag.
  - **29c**: the three kinds in the six places.
  - **29d**: the sealed line, the best-before notification and 6c's row.
  - **29e**: the welcome.
- **Edited.**
  - **28c**: both notices are Notices; the welcome's row has the new lead.
  - **28d**: the "without an action" sample is now the moving-phones Notice, since the welcome has an action.

### A. Decided

**Agreed, no board breaks.**

- **A3 (no bar) and A6 (stale is about opening only)** are what keep the two clocks apart. Every board below follows them.
- **A7's switch**: the switch still covers both reminders, but it's renamed (C3).

### B. Drawn

1. **B1 — 3c (29a). Agreed: ask for the date printed on the bag.**
   - **Label**: "Date on the bag".
   - **Empty**: "Roasted on or best before, whichever it prints". It no longer promises "when it's at its best".
   - **Filled**: "Roasted Apr 1" / "Best before Oct 1". The label stays.
   - **Sheet**: title "Date on the bag".
     - First the kind, a two-way SegmentedControl: **Roasted on | Best before**.
     - Then the wheel.
     - Then one line: "Supermarket bags print a best-before date. Both on one bag? Add the other in the bag's page later."
     - Then Done.
   - **Default kind**: Roasted on. The sheet remembers the last kind chosen, so a supermarket shopper flips it once.
   - **The wheel follows the kind**: Roasted on can't be in the future; Best before can be either side of today.
2. **B2 — 19a (29b).**
   - **Status block, best-before only**: one serif sentence.
     - "142 days to its best-before date".
     - At 1 day: "1 day to its best-before date".
     - On the day: "Its best-before date is today".
     - Passed: "Its best-before date has passed", in `text.secondary`.
     - No bar, band, state word or colour: it's a computed fact, so neutral (§1).
   - **The line under it** carries the dates, with the year because these dates run long: "Best before Oct 1, 2027 · opened Apr 6". When passed: "… · 12 days ago".
   - **Both dates**: the roast clock exactly as today. The best-before date joins the line under it: "Roasted Mar 30 · opened Apr 6 · best before Sep 30". It never draws on the bar.
   - **Details**: Roasted on and Best before, always both, then Opened on.
     - An empty date reads "Add" in `text.muted`, with its chevron.
     - It opens the date sheet with that kind fixed (no switch).
3. **B3 — the three kinds, six places (29c).** One rule: a best-before bag says its date, never a state.
   - It uses a calendar glyph (the date's, not the clock) and `text.muted`. "Passed" is in `text.secondary`, one step stronger, still not a warning.
   - **The six places**:

     | # | Place | Roast-date bag (today) | Best-before bag | Passed |
     |---|---|---|---|---|
     | 1 | 19a | as today | see B2 | see B2 |
     | 2 | 3d card | clock, bar, "DAY 7 · DRINK NOW" | calendar glyph, "BEST BEFORE OCT 1 · 142 DAYS LEFT" | "BEST BEFORE OCT 1 · PASSED" |
     | 3 | 3d footnote | "The windows are a rough guide…" | adds "Bags with only a best-before date show how long is left until it." (only when such a bag is shown) | — |
     | 4 | Home shelf, 84 column | state word over bar | "BEST BEFORE" over the date | "DATE PASSED" over the date |
     | 5 | Search line | "Bag · Blue Bottle · day 7" | "Bag · Key Coffee · best before Oct 1" | "… · best before passed" |
     | 6 | 5a bag line | "Blue Bottle · day 7, drink now" | "Key Coffee · best before Oct 1" | "Seijo Ishii · best before passed" |

   - **Bags with neither date**: unchanged everywhere. Nothing shows.
   - **Home's order**, close to yours with one step added:
     1. date passed and past peak (longest past first);
     2. drink now;
     3. **best-before by nearest date**;
     4. resting;
     5. neither.
   - **Why best-before goes above resting**: a best-before bag can be drunk any day, so it comes before bags that are meant to wait.

### C. Written

1. **C1 — a sealed best-before bag: "Sealed · best before Oct 1".**
   - Passed: "Sealed · best before passed".
   - It drops "clock starts when opened", which is only true of the roast clock.
   - A sealed roast-date bag keeps today's line.
2. **C2 — the best-before notification.**

   | Case | Title | Body |
   |---|---|---|
   | Opened | **‹Bag›, best before ‹Oct 1›** | **That's a week away. Brew it soon, or mark it finished.** |
   | Sealed | **‹Bag›, best before ‹Oct 1›** | **That's a week away, and it's still sealed. Open it soon, or mark it finished.** |
   | Several, same morning | **‹n› bags, best before next week** | **‹A› and ‹B›. Brew them soon, or mark them finished.** |

   - **The titles keep the two apart**: this one names the date, stale's names the time open ("‹Bag›, open 3 weeks").
   - **No taste claim** in either.
   - **Round 26's pattern, agreed**:
     - grouped by morning;
     - a tap opens the bag's page, or My beans for several;
     - a stale bag and a best-before bag on the same morning stay two notifications, because they say different things.
3. **C3 — the row becomes "Bag reminders"**, with the sub line "At 9:00, when a bag has been open 3 weeks, and a week before a best-before date".
   - "Bag going stale" named only one of its two jobs.
   - It replaces 28a / 28b's title and sub line. The denied state is unchanged.
   - **6a's "· 1 stale" keeps its word**: it counts the stale rule only.

### D. Follow-ups

1. **D1 — done.** 28c's "Move to a new phone" is now a Notice. The welcome stays a Notice, so V1 ships no Update.
2. **D2 — the welcome (29e).** The words are polished; the structure is as you built it.
   - **Lead**: "Log a cup, and Extract Press works out what you like. It isn't a diary: the cups you rate and note add up to a profile of your taste."
     - "Rate and note", because a rating alone doesn't move the profile.
   - **1. A cup in 15 seconds.** "Rate it and you're done; a café cup also needs its café. The beans, the gear and the four taste axes are there when you want them."
   - **2. Your taste DNA builds itself.** "Acidity, body, roast and sweetness, from what you note. Cups you rated higher count for more, and recent cups count more than old ones."
     - Both weights, said without numbers.
     - "From what you note" covers the flavour tags too.
   - **3. It stays on your phone.** "No account, no server. Your cups are never sent to us."
     - This stays true with exports and iCloud backups.
   - **Action**: **How my DNA is built** → 8g. 8g joins B4's fixed set.
   - **No picture.** The text carries it.
   - **Layout**: each point is a bold lead-in and its sentences, on hairlines, no icons.
   - **In 7a**, the row shows the title and the lead's first two sentences.
3. **D3 — checked: my Round 26 "For Code" has no "Turn 10".**
   - The only "Turn 10" in this file is in Round 2 ("Drawn: items 7, 8, 9 … Turn 10"), and that one is right: those boards are in Turn 10.
   - Your copy may have been edited after it left me.
   - To make sure, Round 26's For Code now ends with "Boards: Turn 27 (28a–28g)".

### For Code

- **Bag**:
  - `roasted_on` and `best_before`, both nullable;
  - with both set, the roast clock leads;
  - no bar and no state for best-before only.
- **Copy**: the strings in B2, B3, C1 and C2, as listed.
- **Notifications**:
  - best-before at 9:00, 7 days before the date, opened or sealed;
  - within 3 days of the same bag's stale notification, send only the earlier one (A7);
  - grouped per morning per kind.
- **6c's row**: title "Bag reminders", the C3 sub line.
- **Home's order**: date passed and past peak, drink now, best-before by nearest date, resting, neither.
- **The welcome**: D2's words, action → 8g.
- **No new tokens.** The calendar glyph is the existing `calendar.svg` (Round 21).
- **Boards**: Turn 28 (29a–29e).

---

## Round 26 · Notifications in V1, 6c, notices, tips (2026-11-11)

Mock:

- **New: Turn 27.**
  - **28a**: 6c after the changes.
  - **28b**: the stale switch's states, the notification and 6a.
  - **28c**: 7a, its empty state and the bell.
  - **28d**: 7b's optional action.
  - **28e / 28g**: Buy me a coffee.
  - **28f**: 6b regrouped.
- **Marked "Not in V1"**: 8i and 8j get a stamp, as 8h did. They're kept as material for later.
- Nothing else is edited.

### A. Decided

No board breaks. Two of these change boards, as drawn:

- **A2 / A3 → 8i folds into 6c** (B1).
- **A8 → 6b's Taste DNA section is left with one row** (28f, below).

The rest is agreed as written. 7a's samples and footnote follow A2, A5 and A8 (B3).

### B. Drawn

1. **B1 — 8i goes. Its one switch moves into 6c (28a).**
   - A screen holding one switch is a detour: tap a row, read a title, flip, go back. In 6c the switch is flipped where it's read.
   - 6c's old "Reminders · Daily 08:00" row goes with it.
   - The switch row is "Bag going stale" / "21 days after a bag is opened, at 9:00". The old "Around day 21 after opening" hedged; the rule is exact now.
   - No permission line while things work. The permission only shows when it's in the way (B2).
2. **B2 — denied (28b).** The reason and the way out sit on the row itself.
   - **The switch** takes §9's disabled look (ground fill, `border.muted`) and can't be flipped. A switch that springs back to off says nothing; a disabled one with its reason under it says everything.
   - **Under it**: "Notifications for Extract Press are off in iOS Settings, so this can't be turned on here." Then the text action **Open Settings**, which opens the app's page in iOS Settings.
   - **Pressing the disabled switch** gives the warning haptic. The reason is on screen (§1 Pressed, the disabled rule).
   - **Back from Settings** with permission on, the row returns to off, ready to flip.
   - **The flow**: off by default. The first turn-on asks iOS. Allowed → on. Declined → back to off, in this state.
3. **B3 — 7a (28c).**
   - **Empty**: the bell glyph in `text.muted`, "Nothing yet", "News about Extract Press shows up here." No action.
   - **Samples replaced** with what V1 can really say: the welcome Notice, and an Update about moving phones (Restore, Round 23).
     - **Two kinds only: Update and Notice.** Tip goes with Brewing tips.
     - "Backups moved to nightly" goes.
   - **No footnote** (A5).
   - **"‹n› unread"** is set in `text.muted`. The mock's brown was off-role: brown is entered values.
   - **Mark all read goes.** With a handful of notices, opening them is how they get read.
4. **B4 — 7b: agreed. An optional action per notice; the context card goes (28d).**
   - **With an action**, it's the screen's primary (blue, 56, `shadow.primary`), because it's what that notice is for.
   - **Without one**, the foot holds only Next notification and Back to list. No button stands in for it.
   - **Label**: a verb and its object, ≤ 22 characters ("Log a café cup", "Open My data").
   - **Destinations, a fixed set**, each opened as it is elsewhere:
     - Record a coffee (optionally with a mode)
     - Records
     - My beans
     - My taste DNA (8f)
     - My data (6b)
     - Support & feedback (6c)
     - A new destination is a new build.
   - **Date line**: an Update shows the version it came with; a Notice shows only the date.
5. **B5 — 6c (28a). Two sections, no single rows.**
   - **Support & feedback**, 4 rows: Send feedback, Buy me a coffee, Review on App Store, Share the app. The mock's Help & feedback (one row once Report a problem merges in) and Support us become one section.
   - **App**, 3 rows: Bag going stale, Privacy policy, Licences.
   - **The version line**, "Extract Press 1.0.0 (1)", closes the screen, centred, outside any block.
   - **Trailing marks say where a row goes**:
     - chevron = a screen in the app (Buy me a coffee, Share the app's share sheet, Licences);
     - out-arrow = it leaves the app (Mail, the App Store, the privacy page).
   - Send feedback's sub line now covers problems: "Ideas, requests and problems, by email".
   - Rate MoreCoffee becomes Review on App Store.
6. **B6 — Buy me a coffee: a pushed screen (28e, 28g). Redrawn 2026-11-11 after Uryu's reference.**
   - **6c's row** ends in a chevron, not "¥300+": it opens its own screen.
   - **The screen**, top to bottom:
     - back and the title "Buy me a coffee";
     - one picture: the cup glyph, 48, `text.accent`, in a 96 raised tile with a quiet frame (not pressable);
     - one line: "Extract Press has no ads and no account. A tip keeps it that way.";
     - the tips;
     - the small print at the foot: "One-time, nothing recurring. Apple takes the payment; Extract Press never sees your card."
   - **The tips.** Two show first, then a third on request:
     - **A drip coffee ¥300** and **A pour-over ¥600**.
     - Each row is one control: ink frame, paper fill, 64 tall, a small glyph of what it buys, the name, and the price in a tag on the right.
     - Tapping a row opens Apple's payment sheet at once, with no confirm of ours.
     - **"Support more"** is a text action with a down chevron. It opens **A bag of beans ¥1,500** in place, with "Show less" under it (`motion.expand`).
   - **Kept from the reference**: its structure (picture, line, tip rows with price right, Support more).
   - **Not kept**: the dark ground, round pills and hearts. They aren't the house style.
   - **After it goes through**, on the same screen:
     - the line becomes "Thank you. That's a pour-over on you. It goes into the next update.";
     - the paid row turns ink (the chosen role) with a check until the screen is left;
     - nothing unlocks;
     - it can be tipped again.
   - **Cancelled**: nothing.
   - **Failed**: one line under the rows, below a dashed soft divider: "That didn't go through. Nothing was charged." No error colour.
   - **Ask to Buy**: "Waiting for approval. It goes through once it's approved."
   - **Pressed**: `state.pressed.surface`.
   - **Prices**: three consumable IAPs at App Store Connect price points, shown with StoreKit's localised strings.

### C. Checked and written

1. **C1 — the bell: a dot, never a count (28c).**
   - **The dot**: an 8 × 8 blue square at the glyph's top-right, with a 2px ground ring so it separates from the stroke.
   - **Same mark as 7a's unread rows.** 7a's 9 snaps to `space[8]`, so the dot reads as "there's one of those".
   - **Why not a count**: it would make a few notices look like a backlog. The count is on 7a.
   - **At none unread**: the same glyph, no dot. It stays as the way into 7a.
   - **Screen reader**: "Notifications, 1 unread" / "Notifications".
   - It goes on 23b's bell (the current Home), as it was on 4a.
2. **C2 — the stale notification (28b).**

   | Case | Title | Body |
   |---|---|---|
   | One bag | **‹Bag›, open 3 weeks** | **Opened ‹date›. Brew it soon, or mark it finished.** |
   | Two bags the same morning (one notification) | **2 bags open 3 weeks** | **‹A› and ‹B›. Brew them soon, or mark them finished.** |
   | Three or more | same title, with the count | "‹A›, ‹B› and ‹n› more. …" |

   - It states the fact, how long the bag has been open, and the two things to do. It makes no taste claim: no peak, no "past its best", so it stays true for best-before bags in Round 27.
   - **Tap**: the bag's page, or My beans when there are several.
3. **C3 — 6a's "4 of 5 · 1 stale": keep it as drawn (28b).**
   - Same place, `text.muted`.
   - It's counted whether the switch is on or not: it's a fact about the shelf, and the switch only decides the notification.
   - With nothing stale, it reads "4 of 5" alone.

### Not asked: 6b (28f)

- **The problem.** A8 removes How adventurous, which leaves 6b's Taste DNA section with one row (How my DNA is built).
- **The fix: Reset my taste DNA moves up into that section.** It's about the profile, not about data. Each section then has two rows or more:
  - **Taste DNA**: How my DNA is built, then Reset (still the last row, still red, with Round 12's line).
  - **My data**: Export my cups, Export everything (+ Restore while empty).

### Round 27

Noted. Best-before bags wait for Code's investigation.

C2's notification copy and 6a's count were written to hold for both kinds of bag.

### For Code

**6c**:
- Two sections, as listed in B5.
- The stale switch row and its denied state (B2).
- Send feedback opens `mailto:`.
- The version line sits outside the blocks.

**Notification**:
- Stale: 9:00 local, 21 days after `opened_at`.
- Bags due the same morning go in one notification, with C2's copy.
- Tap opens the bag's page, or My beans when there are several.

**7a / 7b**:
- Kinds are Update | Notice.
- Unread dot 8.
- "‹n› unread" in `text.muted`.
- No Mark all read, no footnote.
- Each notice has an optional `{label, destination}`, from B4's set.

**Home bell**: the 8 blue dot while anything is unread.

**Tips**:
- A pushed screen from 6c (28e / 28g).
- Two tips, then Support more for the third.
- Three consumable IAPs.
- Prices from StoreKit.

**6b**: Reset moves into the Taste DNA section.

**No new tokens.**

**Boards**: Turn 27 (28a–28g).

---

## Round 25 · After a reset, 6b's rows (2026-11-10)

Mock:

- **New: Turn 26.** **27a** shows the empty profile after a reset, and the notice. **27b** shows 2c on a cup logged before the reset.
- **Edited.** **25e** now shows V1's rows: Export my cups, Export everything, Restore, Reset (red). **6b**'s Reset row is back to Round 12's line, in red.

### A. Questions

1. **A1. Yes, a line of its own for an empty profile after a reset**: **"Starting again from Nov 10. Rate a cup and note one taste."**
   - **What it says.** It opens with what happened and when, so the empty profile reads as chosen and recent, not as a new account. Then comes the same instruction, shorter, because "to start" is already said.
   - **The date** is `reset_at`, in the app's short date (the "Apr 8" form).
   - **Where it shows**: Home's card and 8f, wherever the "none" line would show, while `reset_at` is set and no noted cup has come after it. After the first noted cup it's Early signs, with its usual lines.
   - **Nothing else changes.** The card is the same empty card: no stamp, four "Not noted yet". The new-user line stays as it is for new users.
2. **A2. Way 3, as built, with one change**: put the reset's date in the line, **"Logged before the reset on Nov 10, so it isn't in my taste DNA now."**
   - **The date** answers "which reset?" if there has been more than one. It also places the cup without opening anything.
   - **"Fed my taste DNA"**: agreed. The sentence and the tags stay as stored, because they're true of that day.
   - **Where the line sits**: under the tags, below a 1.5 dashed `border.soft` divider (§8: the second part of one block). It uses `body.sm` in `text.muted`, as built.
   - **Not way 2.** Hiding the block would make old cups look as if they never counted.
   - **The chevron stays and still opens 8f**: the profile as it stands now, which is what the line points to.

### B. Fixed on the board

1. **B1. Done.** 25e's two My data blocks and 6b's row now read "Counts from today. Older cups stay in Records."
   - **Colour.** Label and glyph are `color.text.destructive` / `icon.destructive`.
   - **Glyph.** 6b now uses 25e's glyph, the one that's built.
   - **No chevron.** The row opens a sheet, not a screen, as 6b drew it.

### C. Noted

1. **C1. Export my cups stays, agreed. The board now has it.** It's the first row, above Export everything, with "147 cups as CSV, notes included" ("Every cup as CSV, notes included" on an empty app).
   - The reason for keeping it is the one you gave: the CSV is for reading, the zip is for putting back.
   - I've rewritten 25e's note that said "everything now earns its name".
2. **C2. Agreed.** The Backup row is gone from 25e, which is V1's board. 6b keeps Backup and Account for later, as D-64 to D-66 say.
3. **C3. Licences: no board needed.** The pushed-screen shape and full licence texts are right. "Extract Press 1.0.0 (1)" with the build number is better than the date. Agreed.
4. **C4. "Taste DNA reset." Agreed**, no other words. It's drawn in 27a: noticeName + notice, no Undo, same place as after a delete.

### On Reset's confirmation (not asked, for the record)

Uryu's copy is right to say first that nothing is deleted. Round 24's form fits it: a red secondary on top, "Keep it" under it, no primary.

- It's a destructive action even though no record goes: the profile as it stood can't come back (no undo).
- So the red label is right, and the copy then corrects the fear.

### For Code

- Home / 8f "none" line: when `reset_at` is set, use "Starting again from ‹reset date›. Rate a cup and note one taste."
- 2c, cups before `reset_at`: the line becomes "Logged before the reset on ‹reset date›, so it isn't in my taste DNA now.", below a dashed `border.soft` divider.
- Nothing else changes. 6b is already built as the board now shows.

---

## Round 24 · A colour for deleting (2026-11-09)

Mock: Turn 25 is new. **26a** shows the colour, its contrast and how it compares with Roast. **26b** shows it on the confirm sheet, the delete row and the text actions. Nothing earlier is edited.

### 1. The colour

**`color.text.destructive` `#B4153F`**: one crimson. Alias **`color.icon.destructive`** to it for the bin.

| Against | Value |
|---|---|
| `surface.ground` #F4EDEA | 5.82 : 1 |
| `surface.raised` #FFFCFA (sheets) | 6.59 : 1 |
| `state.pressed.surface` #E4D6CC | 4.74 : 1 |
| `state.pressed.row` #F2F0ED / #E8E2DE | 5.92 / 5.24 : 1 |
| OKLCH | L 0.50 · C 0.19 · h 15 |

How far it is from each colour already in use (ΔE00):

| Colour | ΔE00 | Note |
|---|---|---|
| `color.axis.roast` | 9.2 | see below |
| `color.axis.sweetness` | 17.8 | |
| accent brown | 28.2 | |
| `text.accentStrong` | 26.9 | |
| rating gold | 41.1 | |

- **Why a red.** A delete should read as one at a glance, and red is the colour every iOS user already reads that way. The only question was which red.
- **How it stays apart from Roast** (`#9D3D36`):
  - **Hue and chroma.** Roast is a dull red that leans brown (C 0.13, h 27). This red is about a third more saturated and turned toward crimson (C 0.19, h 15), at the same lightness. Side by side they read as two reds. 26a draws them on one card.
  - **Form, which matters more.** Roast is only ever a 4pt bar and a 12 × 4 key, never text. The destructive red is only ever words, with their underline or a bin. Neither ever takes the other's form.
  - **Colour blindness.** With red-green colour blindness both reds turn olive. The words and the bin still carry the meaning, as §1 already requires.
- **Only one value.** I'm not proposing `.fill` / `.pressed` / `.onFill` tokens, because nothing is filled (question 2). The interim `state.error.action.{bg, pressed, fg}` go away.

### 2. Filled or not: not filled

The confirm sheets become two secondary buttons:

- **"Delete this cup" on top**, 56 tall, red label, paper fill, ink frame, no shadow.
- **"Keep it" under it**, at 52, as now.

The blue primary goes. Why:

- **Blue means "go ahead".** A sheet asking whether to delete shouldn't say that about the delete. 11b's mock made Delete the primary "because it's the action the sheet was opened for". That reason doesn't hold once the action is destructive. iOS's own sheets don't fill it either.
- **A red fill would be too loud.** A 56-tall red slab would be the loudest thing in the app, louder than Record a coffee, on the one action we want people to slow down on. On 2c and 5c it would also sit under the Roast bars as a large block of almost their colour. Red words stay small and stay words.
- **Fallback, if Uryu wants it filled after seeing it on the phone**: fill `#B4153F`, white label 6.73 : 1, pressed `#921133` (8.93 : 1, ΔE00 6.9 below), ink frame and `shadow.primary` kept. I'd only add those tokens then.

Pressed: the secondary's `state.pressed.surface`. The label stays red (4.74 : 1 on it). Text actions scale as now.

### 3. The delete rows (3g, 3e)

- **The bin takes the red, with the label.** They are one control and should read as one.
- **The hint stays `text.muted`.** "Not finish — erases it" explains the action. It isn't the action.
- The row's frame is unchanged (1.5 `border.muted`). Red is never a frame.

### 4. 5d's required-field error: stays brown

- They aren't the same thing. A missing rating isn't a warning about losing something. It's §1's brown meaning "this is yours to enter", turned up.
- Brown already belongs to the user's own input, which is the right family for "your input is missing here".
- Red stays for one meaning only: **this removes something for good**. If red also meant "you forgot a field", it would stop meaning that.
- So `state.error.*` stays exactly as it is. The only change is that its `.action` sub-tokens go.

### 5. §1 text

In Tap affordance, replace the two lines ("Never brown." and "Destructive actions … get no look of their own for now…") with:

> - **Never brown.** Brown marks a value the user entered; on an action, that mark fades. Brown carries only entered values, and `state.error`, which is about them.
> - **Destructive actions are red (2026-11-09, Round 24).** A command that deletes something saved, or throws away input the user would lose by leaving, sets its label in `color.text.destructive`, and its bin glyph in `color.icon.destructive`. Only the label and the glyph: never a fill, a frame or a shadow. It keeps its form (secondary button, text action with underline, row with bin), so colour still never says "pressable" on its own.
>   - A confirm sheet for a delete has **no primary**: the delete is a secondary button with the red label, on top, at 56; "Keep it" sits under it at 52.
>   - Undoing input in place is not destructive and stays ink: a field's clear ×, the axis's Clear, a filter's ×, Reset in Sort.
>   - Confirmation and undo stay (`gaps.md` 18); the colour adds to them.
>   - `color.text.destructive` is used for nothing else. It sits beside `color.axis.roast` but never takes its forms (bar, key), and Roast never takes its form (words).

Add to §2 colours: `color.text.destructive` `#B4153F`, with that role. Changelog entry: "2026-11-09 — §1 Tap affordance: destructive actions are red (`color.text.destructive`), label and glyph only; delete confirm sheets lose their primary. `state.error.action.*` removed (Round 24)."

### 6. Scope

**The test**: does it remove something saved, or throw away input the user would lose by leaving? Then it's red. Does it only undo input in place, where a second tap puts it back? Then it's ink.

| Item | Answer | Why |
|---|---|---|
| Delete this cup / bag, Remove from my gear (sheets and rows) | yes | removes something saved |
| 11a's Delete this cup | yes | removes something saved |
| Remove photo | yes | removes the saved photo |
| Discard changes | yes | loses the user's edits when they leave |
| 5b's "Discard and save", only while it discards | yes, agreed | loses the note. "Save without the note" stays ink |
| 8g's Reset my taste DNA (and 6b's row) | yes, when built | Its confirm sheet follows §2 above. The cups stay, but the profile as it stood is gone |
| **18a's Clear (recent searches)** | **no, take it out** | Recent searches are a convenience the app keeps for you, not something you made. A red word on the search start screen would be the loudest thing there, for nothing. Keep it an ink text action, with no confirmation |
| Field clear ×, axis Clear, filter ×, Sort's Reset | no, agreed with Code | They undo input in place, and the value comes back by retyping |
| Try next's "Not for me" | no | a dismissal, with Undo, not a removal |
| Sign out | no | removes nothing. Account things are out of V1's local-only scope anyway |

### For Code

- `tokens.ts`:
  - add `color.text.destructive` `#B4153F` and `color.icon.destructive` (alias);
  - remove `state.error.action.{bg, pressed, fg}`;
  - leave `state.error.*` as it is.
- `Button` `destructive`:
  - primary + destructive no longer exists. The delete sheets (11b, 3g, 3e) use secondary + destructive at 56 on top, then "Keep it" at 52;
  - secondary + destructive: red label;
  - text + destructive: red label and underline.
- Delete rows: label and bin red, hint muted.
- 18a Clear: back to ink.
- `design-system.md`: §1 text and changelog as in 5 above.
- **The repo's `design-response-next.md` is stale.** Its Round 23 E still has the first answer (the body with a quiet frame and no shadow). Replace it with this file. The current handoffs are listed in `handoff-README.md`.

---

## Round 23 · Floating bar, Try next on Home, Restore (2026-11-08)

Mock: Turn 24 is new — **25a** the bar over a 20-row list, **25b** its spec, pressed and active states, **25c** Home with Try next, **25d** the four kinds and dismissal, **25e** 6b My data, **25f** Restore's sheets, **25g** refusals and first setup. Edited: **23b** and **6a** eyebrows read EXTRACT PRESS; **23c**'s Bags rule (D2). Build spec: `handoff-round23.md`.

### A. Built

1. **A1 — no problem seen.** Understood that it's interim and the device check only confirms it's usable until E lands. Not redrawn.
2. **A2 — Process.**
   1. **Show the chips on 3c; no fold.** A fold costs two taps (open, choose) for one row; shown, it costs one, and the bag with its label is in hand at 3c. It stays optional and never blocks "Open this bag", so the 15-second path isn't slower for someone who skips it.
   2. **44, as built.** Four chips wrap to two lines either way. At 32 with hit-slop back to 44, the two wrapped lines' touch areas would overlap across the 6–8 gap between them; at 44 they don't. And 44 matches the maker chips, the only other chips on these screens. 3g's 9 / 14 was drawn before Process was clearable or shown on 3c — drift.
   - Clearing by pressing the selected chip (scale, no darker tier): agreed, nothing to add.
3. **A3 — the name.** 23b's and 6a's eyebrows now read EXTRACT PRESS, and every board drawn this round uses the new name. The four unbuilt strings (6c "Rate MoreCoffee" and "MoreCoffee 1.4.0", 8i's permission line, 6d's social-feed line) change when those boards are next touched. Two things aren't strings:
   - 1b, 4a and 4b still carry the old Home eyebrow. All three are superseded by 23b, so they aren't worth editing.
   - **Welcome (9a / 9b / 8a) draws "Morecoffee" as the brand mark.** That's a wordmark, not copy, and it needs Uryu's new logo before the store build. Flagging it so it isn't missed.

### B. Try next on Home (25c, 25d)

1. **One card, four variants.** Each variant has a serif title (`display.sm`), one reason line, one action and "Not for me". Copy (final unless you object):

   | Kind | Title | Reason | Action |
   |---|---|---|---|
   | Other brewer | Guji in the AeroPress? | AeroPress cups average 4.3 stars. Guji in the V60: 3.0. | Log a cup |
   | Bag | Hoja Verde, again? | Five stars in September. Last brewed six weeks ago. | Add it to my beans |
   | Café | Back to Fuglen? | Five stars in September, not since. | Open in Maps |
   | Tag lead | Look for blackcurrant | It's on 4 of the 5-star cups. | See the 4 cups |

   - Copy rules: the title is ≤ 26 characters; the reason is one line, facts only (whole stars, averages to one decimal, months and weeks); no "your" (it states the record).
   - **Café → Open in Maps: yes.** It hands the stored MapKit id to Apple Maps, with no new screen in the app. Going back to a café is a trip, and this is its first step.
2. **No suggestion, no card.** Recently sipped moves up. 5c's "One more cup…" goes.
3. **Order as you set it**: other brewer, then bag, then café, then tag. It changes on Monday or after a dismissal. Agreed.
4. **Position: under the Taste DNA card, agreed.** It reads as "what the DNA suggests" and never moves Record a coffee or the counts.
   - It looks like a note, not a record: paper ground inside a quiet frame, where the DNA card is raised. A spark glyph and a brown TRY NEXT eyebrow mark it.
   - The action is a secondary button (ink frame, paper fill). Record a coffee stays the only blue on Home. Not dashed: dashed means empty (§8).
5. **States.**
   - Pressed: the button takes `state.pressed.surface`; the text actions scale (§1). The card itself isn't pressable.
   - **"Not for me" leaves a line**: the card shrinks in place to "Hidden. It won't come back." with **Undo**. The line stays until Home is next shown; then the next suggestion appears, or no card. Undo instead of a confirm: a mis-tap costs one tap back.
6. **Making the tag lead carry more: "See the 4 cups".** It opens Records' search on that word (8l's results, "4 cups say blackcurrant"). The lead becomes something to read today, the cups that earned it, instead of a note for a shop visit weeks away. Code: this needs search to match tasting-note tags; say if it doesn't.
   - **One related question**: 6b's "How adventurous" says it "sets how far Try next strays from what I already like". V1's four kinds have nothing for it to steer. My suggestion: hide it in V1 and bring it back with V2's Try next. Planner's call.

### C. Restore (25e–25g)

- **Export everything: "Cups, bags, gear and photos" — confirmed.** Name the file **"Extract Press backup ‹date›.zip"**: the "not a backup" refusal points to that name.
1. **C1 — a third way: a row while restore can work, a sentence once it can't.**
   - On an empty app, "Restore from a backup" (sub line "From an Export everything file") sits between Export and Backup.
   - Once there's any cup, bag, gear or café, the row goes. One line sits under the block instead: "Restoring a backup works on an empty app only."
   - Someone who logs a first cup on a new phone and comes looking finds the reason where they look. Nobody lives with a dead row. It's text, not a disabled control.
2. **C2 — steps.**
   1. **Confirm**: "Restore this backup?" / "From 8 Nov 2026: 214 cups, 9 bags, 6 gear, 4 cafés and 31 photos." The date comes first because it's how a person recognises the file. Restore is the primary (blue); Cancel is secondary. **Engine: I've added gear and cafés to the counts**; if they aren't available, drop them.
   2. **Working**: "Restoring…" with "Photos 18 of 31" and a neutral 4pt meter. No spinner. It can't be dismissed while running.
   3. **Done**: "All back." / "214 cups, 9 bags, 6 gear and 4 cafés are in. My taste DNA is rebuilt from them." The button is Go to Home.
   4. **Refused**: one form each — a title saying what happened, one line on why and what to do, one button. No error colour, because nothing in the app went wrong.
      - Not a backup: "That file can't be restored." / "It isn't an Extract Press backup. Exports are named "Extract Press backup ‹date›.zip"." · Choose another file
      - Newer app: "Update first." / "This backup comes from a newer version of Extract Press. Update the app, then try again." · OK
      - Damaged: "That file can't be read." / "It may be damaged or incomplete. Nothing was changed. Try another copy of the backup." · Choose another file
      - Not empty: "Only on an empty app." / "There's already 1 cup here. Restoring never merges or overwrites, so it works on an empty app only." · OK
   5. **Photos missing: a line on Done**, under a dashed soft divider: "3 bag photos weren't in the file. Those bags show the placeholder; a photo can be added from each bag's page." No line when nothing is missing.
3. **C3 — yes.** First setup's step 1 (8n) gets a text action at its foot: "New phone? **Restore a backup**". A fresh install starts there, and the app is empty by definition. After a restore, setup is skipped. Welcome (8a) is unchanged.

### D. Carried

1. **3c's photo slot, solid 2px ink: confirmed.** It's a control by Round 22's test (it acts where it is, holding its own glyph and label), so ink is right. Dashed would wrongly say "empty".
2. **Bags counts every bag added: noted, and 23c's rule is rewritten.** It now counts open or finished bags, brewed or not. A deleted bag still counts if cups point at it, through their copy (name + roaster + roasted on). One deleted with no cups was a mistake and doesn't count. Uryu: say if a deleted bag shouldn't count at all.

### E. The bottom bar (25a, 25b)

- **Shape.** Two pieces on one baseline, both 56 tall with square corners and a 2px edge, 12 apart (`space[12]`), inset by the gutter (22) at the sides and 26 from the bottom edge (the home-indicator inset less `space[8]`, as today).
  - The + is a 56 square. The body is screen − 22 × 2 − 12 − 56 = 290 at 402, and its three tabs split it evenly (≈ 95 × 52, the whole slot is the touch area).
- **Shadow or frame: ink frame and hard shadow on both pieces** (revised 2026-11-08 on Uryu's comment on 25a: the tabs are pressed, so they're controls, like the CTA).
  - Body: raised paper, 2px `border.strong`, `shadow.floating`. +: `color.action.bg`, 2px `border.strong`, `shadow.floating`. Floating, fixed-width controls take 4 (§7); the full-width primary keeps 5.
  - Only the fill differs. Height, corners, frame, shadow and baseline make them one bar.
  - October's problem was elevation over busy rows. Here the paper band (below) keeps rows from under and between the pieces, so the shadows fall on plain ground. Check it over Records on device.
  - *First answer, superseded*: the body with a quiet frame and no shadow.
- **What's under and between: a paper band, not the list.** From 12 above the bar to the screen's bottom edge (94 in all), the ground is plain paper with its dots. No rule, no fade.
  - Without it, half-cut rows show through the 12 gap and the 26 strip. That noise is exactly what the old floating bar suffered from.
  - Screens keep 94 + `space[20]` under their last row. Toasts sit `space[12]` above the band, as today above the bar.
- **Pressed**: tabs scale (0.88), as now. **The + darkens to `state.pressed.action` — confirmed**: a blue fill has a darker tier (§1, by surface; 56 ≥ 44, by size). The shadow and frame are unchanged.
- **Active tab: it still reads; nothing added.** The eye compares blue against two greys inside the body, and the + doesn't enter that comparison (the shared ink frame and shadow don't change this): a filled 56 square isn't the same kind of thing as a 20 glyph. Blue on both is §1's own pairing (the primary action, the current place).
- **Reach**: the + spans x 324–380 and bottom 848 on 874, centre (352, 820). That's under a right thumb, with 44+ in both directions. Its corner is 22 in and 26 up, clear of the display's rounded corner. Check one-handed on the 15 Pro Max, as with A1.

### For Code

- E: two views in `FooterNav`, both with ink frame and `shadow.floating`, plus the band. Simplest band: end the scroll viewport 94 above the edge, so the fixed `DotTexture` shows through with nothing new drawn. §9 Bottom bar is rewritten from `handoff-round23.md` §1.
- B: `TryNextCard` under the DNA card on Home. Four variants, dismiss line with Undo, routes as listed. The tag lead needs Records search to match tasting-note tags.
- C: 6b's rows by app-empty state, five sheets, the 8n text action, export file name.
- A2: show the chips on 3c, 44 tall.
- No new tokens.

---

## Round 22 · Quieting the borders (2026-11-07)

Mock: Turn 23 is new — **24a** 5a as now, **24b** 5a with quiet frames, **24d** 5a as the reference does it, **24c** the rule, **24e** pressed states. Nothing earlier is edited.

**Revised 2026-11-07 after measuring the reference** (Uryu's screenshot): frames drop from `border.medium` to `border.muted`, and 24d / 24e are added.

**Decided 2026-11-07 (Uryu): 24b.** Controls stay ink; 24d is not applied. Build spec: `handoff-round22.md`.

**Follow-up (Uryu's comment on 23b, 2026-11-07):** Home's top block is now one panel (raised, quiet frame) and the total drops to a new `numeral.lg` 64 / 52; the stats lose their hairlines. 23b / 23c redrawn; spec in `handoff-round22.md` §5.

### For §1 (replaces nothing; sits beside Shape's width rule)

> **Border colour: who gets ink (added 2026-11-07).** Width says what an edge is (§1 Shape: 2 = a box's outline, 1.5 = an internal divider or a weak frame). Colour says whether the box acts. The two are independent: every combination keeps its width.
> - **Control → ink** (`border.strong`). A box whose whole body is the thing you press and which holds nothing but its own label, glyph or value; it acts where it is (commits, types, toggles, sets, adds). Buttons, icon buttons, text and search fields, switches, unchecked checkbox and radio markers, Add buttons, steppers. The slider keeps §9's `text.secondary` track frame, also full weight.
> - **Container → quiet** (`border.muted`, 2px). A box that encloses information or other things: cards, form sections and FieldRow groups, list blocks, notices, the photo frame, a sheet's top edge — **including a whole card or row block that leads to another screen.** Leading somewhere is the chevron's job (§1 Tap affordance), not the frame's.
> - **Chrome edges → quiet** (`border.muted`): the bottom bar's top rule, a fixed foot panel's top rule.
> - **Pressed**: unchanged (§1 Pressed). The fill answers: rows `state.pressed.row` out to the frame, light controls `state.pressed.surface`, primary `state.pressed.action`. **No frame ever changes colour on press**, pale or ink.
> - **Unchanged**: options (selected = fill of its role; unselected = 1.5 `border.muted`), error frames and `state.error.shadow` (brown, their own role), badges and stamps, thumbnails' 1.5 edge, hairlines, every dashed line (§8).
> - **The test**: does it act where it is, holding only its own label? Ink. Does it hold things, or go somewhere? Quiet.
> - **Shadows follow controls only.** §7's three tokens are already button tokens; a container never carries one.
> - **Why**: when cards and buttons share 2px ink, they look alike and nothing leads. Ink is a promise that pressing *this* does something here.

### Answers
1. **Colour, not width: agreed.** A 2px pale frame and a 2px ink frame are the same structure. Changing widths too would break the one rule that has held on every board, and 1.5 is already taken by dividers and weak frames.
2. **The colour: `border.muted` #C8BCB4**, no new value. Measured on the reference: one frame colour (#CCC0AF) on everything, 1.55:1 on its ground. `border.muted` is that level on ours (1.60 on ground, 1.82 on raised), ΔE00 4 from it. (My first pick, `border.medium` at 2.05, was heavier than the reference.)
   - **Not lower.** The paper's dots are 1.25:1 and the hairlines inside cards 1.23–1.39; below about 1.5 an edge reads as texture. No new colour is proposed because the reference's level already exists in the palette and there's no room under it.
   - The frame is only 1.31:1 above its own hairlines; the width (2 vs 1.5) keeps them apart.
   - `border.muted` also stays the unselected option's outline (1.5). Same colour, same meaning: nothing is pressed or chosen there yet.
3. **Rows that are both: quiet.** A row opens a screen; it doesn't act in place, and it already has the chevron and the press fill (`state.pressed.row`). Rows inside a list have no frame of their own anyway (Round 9); what goes quiet is the block around them. Keeping those blocks ink would put ink back on most of the app.
4. **Shadows: they already follow the split.** Of the mocks' ink shadows, all sit on buttons except the superseded floating tab bar (already off in the build), Welcome's brand graphics (out of scope) and **8d's suggestion card (5px), which loses it.** Error shadows stay.
5. **Dashes: unchanged, confirmed** — on today's §8. The brief's examples are retired: `border.addSlot` was removed 2026-10-18 (add entries are buttons) and `axis.rail.derived` 2026-10-11 (AxisReadout has no frame, so it can't be the reference for "quiet"; the reference's own level is: `border.muted`). Dashed = empty, or two parts of one block; never pressable, whatever its colour.
6. **One thing 24b exposes**: with the cards quiet, 5a's dashed photo slot is the heaviest container on the screen. It's already drift against §8 (a pressable add entry) and hidden at this stage; when it returns, it's an Add button.
7. **5a was the right screen**: star card, segmented options, a FieldRow card, a foot panel and two buttons in one view. In 24b only close, the selected option, Save and Add tasting note keep ink.
8. **What the reference does that 24b doesn't (24d).** It frames its buttons exactly like its cards; weight comes only from the filled primary and the selected state (a teal frame at 3.9:1). 24d draws that on 5a. **My recommendation is 24b**: the reference is a desktop page you read, 5a is a form you finish with a thumb; a secondary button framed like a card has neither the frame nor the fill §1 reads as "pressable", and close is the only way out of the sheet. Judge both on device.
9. **Pressed (24e): nothing new.** Rows take `state.pressed.row` out to the card's frame; light controls `state.pressed.surface`; primary `state.pressed.action`; the shadow stays (§1 Pressed, 2026-10-06). The frame never darkens: a card turning ink under the finger would blink into a button. In 24d's pale controls the pressed fill is only 1.31:1 against the frame, one more reason for 24b.

### For Code
- §1: add the rule above.
- Tokens: no new value. A semantic alias would help: `color.border.container` → `border.muted` (and `border.strong` read as "control").
- Containers' 2px frames → `border.muted`; bottom bar and foot panels' top rule → `border.muted`.
- 24b decided: controls stay ink. Full spec in `handoff-round22.md`.
- 8d's suggestion card: no shadow.
- Check on device first (24a / 24b).

---

## Round 21 · build questions (2026-11-06)

Answers to "Round 21 built: what didn't map" in `design-brief-next.md`. Mock: 23b, 23c, 23g and 6a are edited in place; `handoff-round21.md` is corrected.

1. **One coffee-bag glyph: 6a's `beanBag`.** Use it for the Bags stat too, and drop `coffeeBag`. Two different bags for the same thing (the bags on my shelf) would read as two things. 23b / 23c now draw 6a's shape; `assets/icons/beanBag.svg` (my new shape) is withdrawn.
2. **`store`: the mock's version is final** — with the door, `currentColor`. The file I sent has the same paths as 23b; what reached you was not that file (a downloaded copy also picked up a `<metadata>` block, so something along the way rewrote it). Take these paths, or the copy in the project's `assets/icons/store.svg`:
   `M3 9l1.5-5h15L21 9` · `M3 9h18v1.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z` · `M5 12.5V20h14v-7.5` · `M10 20v-5h4v5`
3. **`bag_id`, and yes, add `bean_roasted_at` to the fallback key** (name + roaster + roasted date; a null date is a value like any other). "bean_id" in the handoff was my error.
4. **5c: all four axes, fixed order. Confirmed.** The card is the Taste DNA card, and §9 keeps its four rows so its height never changes. "Only the moved axes, largest first" was the old per-axis lines' rule; the tags took that job.
5. **Four digits: the numeral wins.** The total is the one number the block exists for, so it never shrinks or wraps. In order:
   - the stat column hugs its content instead of a fixed 150;
   - the numeral ↔ column gap drops from `space[20]` to `space[12]`;
   - if it still doesn't fit, the three stats move under the numeral as one row (icon, label, value, ×3), above the strip.
   Not drawn yet; I'll draw it when the first dogfood log nears 1,000.
6. **2c: `gap.row` (8). Accepted;** 23g fixed.
7. **6a: yes, the reason reaches 6a.** "Week streak" becomes **Cafés** (ink, not brown: it's a plain count like the other two), so 6a and Home count the same things: Cups, Bags, Cafés. 6a's "Logging since Jan 2026 · 34 weeks" already says how long, without scoring gaps. 6a edited.
8. **Reset: confirmed by Uryu (2026-11-06).** Cups total, This month, Bags and Cafés do not reset with Taste DNA. They count records, not the profile; reset only rebuilds the profile.
9. **Month strip, screen reader** (yours, not in the handoff): read as one element: **"6 days with a cup this month, out of 8 so far."** Then the stats as their own elements. Don't list days.

---

## Round 21 · Taste DNA colour, change tags, Home's top block (2026-11-06)

Mock: Turn 22 (23a–23h) is new. Nothing earlier is edited; 23a–23h supersede the axis drawing on 4a / 1b / 5c / 2c / 8f / 11a and the per-axis lines on 5c / 2c. The Coffee Days screenshots did not reach me; this is worked from the brief.

### 1. Axis colours (23a)
**Four new values, identity only.** `color.axis.*`, in `tokens/colors.css` with the rule beside them.

| axis | token | hex | name | on track / card / paper |
|---|---|---|---|---|
| Acid ↔ Bitter | `color.axis.acidity` | #7C7D0F | Citron | 3.08 / 4.28 / 3.78 |
| Body | `color.axis.body` | #614A87 | Plum | 5.21 / 7.24 / 6.40 |
| Roast | `color.axis.roast` | #9D3D36 | Ember | 4.69 / 6.52 / 5.75 |
| Sweetness | `color.axis.sweetness` | #AE5A84 | Rose | 3.22 / 4.47 / 3.95 |

- **They join the star, outside §1's three roles.** They say which axis and nothing else: not good or bad, not entered or computed, not in force. **Used nowhere else** — no chart, chip, category or emphasis outside the four axes. **Never as text**; labels stay `text.muted`.
- **Not from the palette**, because every free hue there already has a job (brown entered, blue in force, gold the star, greens ink and freshness, neutrals computed). Borrowing one would say that job.
- **Suited to the axis**: citron (citrus; the olive holds the bitter end), plum (weight, as in "full-bodied"), ember (heat; red, because brown means entered), rose (ripe fruit; never on Bitter).
- **As a set**: one muted ink weight. Pairwise ΔE00 20–58; weakest under deuteranopia Acid / Roast 11.7, where labels and fixed order carry identity.
- **§9's measurement**: the neutral fill was 1.67:1 on the track; these are 3.08–5.21:1, all over 3:1. **The coloured fill can carry the reading** (direction and how far). **The marker stays**: at 50 there is no fill, near 50 a sliver is not a reading, and the marker now carries the role.
- **Fill = which axis, marker = what kind of value.** Computed: marker `text.muted` (unchanged). Entered (2c, 11a): marker `border.accent`. §9's brown fill on 2c is retired.
- **The key**: 12 × 4 (the meter's height) before the left pole on every axis, so the axis stays named at 50 or when not noted.
- **5b**: only the key, hung 20pt left of the 260 track (Low / High sweetness still fits as measured). Handle, track and dots unchanged, so brown keeps meaning "entered". Roast's key is ΔE00 18.5 from the handle's brown.
- **5c's ghost**: unchanged (`border.muted` fill and marker underneath); the current fill is the axis colour on top.
- **8f**: the fixed order, Acid, Body, Roast, Sweetness. The mock's Sweetness-above-Roast was drift.

### 2. Change tags (23e, 23f)
- **Tag**: key + `‹pole label› +N`, `label.eyebrow`, `badge.bg.neutral` / `badge.fg.neutral`. N is always positive: the pole carries the direction. Uses the pole labels printed on the axes.
- **Order**: the axes' fixed order, matching the readouts.
- **Light body +4 / Light roast +5**: the problem does not return. It came from comparatives without nouns; a tag always carries the full pole name, and the keys differ.
- **First value**: tag `Starts at ‹step name›`, no number. Left out of the sentence, as before.
- **Only first values**: the sentence becomes "My taste DNA has its first ‹axis› reading." ("first Roast and Sweetness readings").
- **Nothing moved**: no tags; the current line unchanged. Under 1 point: no tag (the sentence's own threshold).
- **The summary sentence survives.** It is the only place the result is said in words, it reads first, and it ranks (tags keep axis order). Its phrases are unchanged ("-bodied", "toward … roasts").
- **Removed**: the "Moved N points toward ‹pole›" lines under each axis.

### 3. Home's top block (23b, 23c)
- **Total**: `numeral.hero` 96, as asked. The This week panel, its weekday strip and "A slow start is still a start." go.
- **Month strip**: a 6pt square per day (`size.dot.bullet`). Cup day brown (as the weekday strip), past day without `border.muted`, days to come `border.subtle`, today underlined. No label.
- **Stats** (right column, beside the numeral), each with a 16pt icon: calendar, bag, storefront (Cafés: a storefront, since a cup would read as a cup count):
  - **This month**: cups since the 1st.
  - **Bags**: distinct bags across my cups; a deleted bag counts through its cups' copy (bean name + roaster). Not origins: no form asks for origin yet.
  - **Cafés**: distinct cafés my Barista cups point at (`places.kind = cafe`). Stores don't count. 0 shows as 0.
  - **No week streak.** No rule exists, and I'd not write one: a streak counts what you missed, against Home's tone.
- **Gain: 32pt** (DNA card 398 → 366; block 189 → 157). The numeral and its label are 103 of it. More would mean a smaller numeral, which has no text style between 96 and 40, so it's a decision for you.
- No Try next row and no "3 of 5 cups" on the card (V2, as 21d).

### For Code
Full spec with a token check: `handoff-round21.md`.
- `color.axis.{acidity,body,roast,sweetness}`: AxisReadout fill and the 12 × 4 key only; AxisSlider gets the key only. Note them as identity colours in §1 and §2.
- AxisReadout: entered tone keeps the `border.accent` marker; fill = axis colour in both tones.
- 5c / 2c: tags replace the per-axis lines; sentence kept; "first ‹axis› reading" for first-only; no tag under 1 point.
- Home: new top block (23b); the stats' counting rules (23c).
- 8f: fixed axis order.

---

## Round 18 · My words leaves Taste DNA, and what's left in V1 (2026-10-31)

Mock: Turn 21 (22a–22c) is new. 21b, 21d, 8f, 6a, 7a / 7b, the superseded 8g and 8h are edited in place.

### A. Report
1–5. **OK. No problems.** The tags and My words were always meant to do different jobs, and this makes that explicit.
6. **OK.** Hiding it is right. The line stays "Counts from today. Older cups stay in Records."
7. **OK.** B8 answers how it looks.
8. **OK.**

### B. Answers
**1. 8g: stays inside "Flavour tags nudge, sliders decide", so 8g keeps seven rules.** Under it:
> Peach leans brighter and sweeter. Tags make up at most a third of an axis. They're picked to describe the taste; My words is written to read back, so it stays out.

- "Picked" and "written" carry the contrast. "To read back" says what My words is for, so leaving it out reads as a division of roles, not a limit.
- Not its own rule. An eighth bold line about something that never counts would make it look bigger than it is. Remove PROVISIONAL.

**2. 8f: the heading alone, no sub-heading. Confirmed.**

**3. The mock: all four removed.**
- 8f: "What you keep saying" is gone.
- 6a: the My words row is gone.
- Superseded 8g: "Read my words" is gone. Reset still shows on that superseded board; A6 holds.
- 7a / 7b: the update is now "Log your café cups" (Round 16's Barista), so the notification screens keep a real example. This is mock content only, not a request to send that notification.

**4. 8h: keep it, marked.** Your wording is on the board.

**5. 5b's My words: my reading. No change asked for now.**
- **The placeholder points at tasting.** "Cooled down it turned into iced tea…" describes the taste, which is the flavour tags' job, so it teaches the wrong use. When it changes, it should show a memo about the brew or the day, e.g. "Ground one step finer. Rainy morning at home."
- **The eyebrow is fine.** "My words" says whose they are, not what they're for.
- **It reads as optional enough.** It's the last field, has no required mark, and Save doesn't wait for it. Adding "optional" would only add noise.

**6. Last shift: the plain section. Confirmed, and 21d is fixed.** The #FFF8F1 frame was my drift. §8 has no honest way to set it apart, since dashed means add or empty. The 10-caps heading is enough.

**7. Drink sheet's Add row: confirmed as you describe.** The + marker, `Add "‹typed›"`, no meta, spaces trimmed. Not drawn: it's 20b's row without the meta.

**8. 11a without an address (22a): the row drops its meta line, nothing more.**
- No "Address unavailable", no icon, no retry. The address only tells two cafés apart, so its absence isn't worth a word.
- It's the same row for all three causes (offline, no answer, typed by hand).
- While fetching, nothing is shown. The line fades in (opacity, 150 ms) if the address arrives.

**9. 15b Locked in (22b, 22c).**
- Body:
  - "Your profile has locked in. One cup no longer swings what it has learned."
  - "It still moves as your taste does: recent cups count for more than old ones." (yours, kept)
- "What it has learned" is about the profile, not every axis, so it holds when Roast is first noted after the lock.
- Progress box:
  - every axis at 10 or more: "From 147 cups."
  - an axis under 10: "From 147 cups. Roast has 3 notes, so one cup can still move it."
  - two axes under 10: "Body and Roast have under 10 notes, so one cup can still move them."
- There is no "N more to lock in" here, since the profile is already locked.

**10. 5e: "Add a product" and "Product name". Confirmed.** They pair with "Add a bag" and "Café name" / "Drink name".

### For Code
- 8g: the tags rule copy (B1). Remove PROVISIONAL.
- 11a: an address that can't be fetched means no meta line. It fades in if it arrives (B8).
- 15b: the Locked in copy and the box rule (B9).
- 5e: copy confirmed (B10).

---

## Round 17 · How my DNA is built (2026-10-31)

Mock: Turn 20, 21a–21e. 8g as first drawn is superseded.

### A. Report
1. **OK. Yes, "no results" needs a line**, in the same slot as Round 16's states, with the Add row under it:
   - location known: **"No cafés within 5 km match. Add it by name below."**
   - location off: **"No cafés on the map match. Add it by name below."**
   - My matching cafés still show. The line only shows when the map returned nothing.
2. **OK, and thank you: the table is right.** All of it is answered in B1. One more problem from the same cause: **15b's body says "At 5 cups it locks in."**, which V1 contradicts. Remove that line, and change "With only a few cups" to **"With only a few notes"** (21e).
3. **OK.**
4. **OK**, except 8f's bar (B3).

### B. Answers
**1. Rules (21b): seven, not five.** Two lines split off from yours.

| Bold line | Under it |
|---|---|
| Higher-rated cups weigh more | A 5★ cup counts three times a 3★. Low ratings count too: they record what you tasted, not what you liked. |
| Recent cups weigh more | A cup counts half as much every three months. Rated the same, today's cup pulls four times as hard as one from six months ago. |
| Each axis on its own | A cup that skips an axis is left out of it, never counted as the middle. |
| Roast is the roast you tasted | Only your Roast slider moves it. The roast level on the bag never does. |
| Flavour tags nudge, sliders decide | Peach leans brighter and sweeter. Tags make up at most a third of an axis. Your own words don't count. |
| Ten notes per axis to lock in | Ten slider notes on each axis; tags don't count. Once locked in, it stays locked unless you delete cups. |
| It moves only when your cups do | Logging, editing or deleting a cup moves it. Time alone never does. |

- Roast is its own rule because Uryu wants it on the page. As a bold line, it can be found.
- "Moves only when your cups do" left the recency rule. That rule is about weight, not timing.
- "Every three months", not "after": the weight keeps halving.
- The order: how a cup weighs (1–2), then what it moves (3–5), then when the profile changes (6–7).
- Your renaming and your list of things left out: **OK.**

**2. My numbers (21a, 21c): drawn.**
- The heading **"My numbers": OK.**
- The framed block, one row per axis: the name on the left, the count on the right in tabular figures. "7 more to lock in" goes on its own line under the count, in accent (`text.accent`): it is the only thing on the page that asks for something. "Not noted yet" is muted.
- "Tags are at their limit here." goes under the row, muted. **Only at the limit.** A share on every row is a number with nothing to do about it.
- The cups line closes the block, under a 2pt rule, since it covers all rows.
- The locked-in state (21c): "3 notes" with no second line. **OK as built.**

**3. 8f's footer: drop the bar in V1 (21d).** A raised bar keeps actions in reach while scrolling. A link to an explainer doesn't need that, and one link alone in it looks unfinished. "HOW IT IS BUILT" becomes the page's last item, after Last shift, as an InlineAction. The bar comes back with Try next in V2, with this link at its left. Reserving it now gains nothing.

**4. 15b (21e): confirmed.** It sits left-aligned under the progress box, 2pt below it, above "Got it". Keep the progress box: it is the one line here that changes. Plus A2's copy fix.

### For Code
- Café sheet: the no-results lines (A1).
- 15b: remove "At 5 cups it locks in.", and change "few cups" to "few notes".
- 8g: seven rules, as in B1. My numbers as 21a / 21c.
- 8f: remove the footer bar. The link goes at the end of the content.

---

## Round 16 · Barista (2026-10-30)

Mock: Turn 19, 20a–20g.

### A. Report
1. **One problem, in the mock: 5d's café meta.** It read "Fuglen Tomigaya is 250 m away — or type a new one.", which is the nearby guess A2 rules out. Now: **"Pick it from the map or type its name."** The rest of A1 is OK.
2. **OK.** 5a's Café details heading now reads SET in the mock.
3. **OK.**
4. **OK, for 5a only.** 11a's Café row shows the short address instead (see B5).
5. **OK.**
6. **OK, with one order:** open the sheet first, then the system prompt over it. The café list is then the reason in view.
7. **OK.**

### B. Answers
**1. Café sheet (20a, 20b): confirmed as built.**
- Rows and meta: as listed. Nothing is selected on a new cup.
- **No headings.** The first part of the meta tells them apart: a visit count leads my rows, an address leads the map's.
- My cafés stay latest visit first, never re-sorted by distance.
- Add row: a + marker in place of the radio, with the meta **"Saved by name only"**.
- Placeholder **"Café name": OK.**

**2. When the map can't help (20c–20e).** One muted line under the field: body.sm, `text.secondary`.
- Searching: "Searching the map…" **OK.** Show it after about 300 ms. My matches and the Add row show under it at once.
- Can't search: **"Can't search the map right now. Add it by name below."** The line only shows after typing, so "Type the café's name" pointed at a step already done.
- Location off: **OK, plus an InlineAction "Open Settings"** at the end of the line. After a No, Settings is the only way back. With Restricted, show the line without the link. My rows drop the distance.
- Prompt: **"Shows the cafés around you first when you pick one. Your location is never stored."** iOS already titles the prompt with the app's name.

**3. Drink sheet (20f): OK**, with one change. The placeholder is **"Drink name"**, to pair with "Café name". "Add a drink" and "Last time here" are OK. Only the first row has a meta. The pre-filled drink shows selected.

**4. 2c for a Barista cup: show nothing. Remove "What I logged"**, as for Packaged (Round 7). The title and sub line already say the drink and the café.

**5. 11a (20g): confirmed**, with one change. The Café row's meta is the **short address only**. Distance from where the phone is now says nothing about a past cup, and "Nth visit" changes meaning once the café changes. The Drink row has no meta. An older cup with no café saves without one.

**6. 2b: yes, group by café under Group by Roaster.**
- A café is who made the cup, as a roaster is who made the beans. Café groups take their place among the roaster groups by the same rule (first cup under the sort), and sort by name under "Roaster A–Z".
- Barista cups with no café go into **"No café"**, next to "No roaster".
- Under Group by Brewer, Barista cups stay one "Barista" group.
- Packaged stays last.

**7. Shelf rows: no chevron.** The chevron rule covers blocks. A shelf row is an item in a list of things, like a Records row or a My beans row, and these open their thing with no chevron. Add the case to §1 next to §3.1's two lines. "See all gear & beans ›" keeps its chevron.

**8. Backup row: "Export everything" / "Cups, bags and gear, as JSON".** "Back up" promises a restore that doesn't exist. Use the drawn "Last saved…" line when the real backup comes.

### For Code
- 5d: the café meta copy (A1).
- Café sheet: + marker and meta on the Add row. Copy in B2 and the Settings link.
- Drink placeholder: "Drink name".
- 2c: drop "What I logged" for Barista.
- 11a: Café meta = short address.
- 2b: café groups and "No café".
- 6b: Backup copy.

---

## Round 15 · Search and bag / gear pages (2026-10-28)

Mock: Turn 18. 18a–18f and 18x are search; 19a–19c are the pages.

### Part 1 · Search
**1. Empty state (18a, 18b)**
- **Group order:** Kind, Rating, Flavours I use most, then Recent searches.
  - The two fixed groups come first, so they never move.
  - The data-dependent groups go below them.
- **Kind drops "All".** In search it would just be the archive, which 2a already is.
- **Flavours:** the top 6 by count, with at least 2 cups each. Chips are lower case.
- **History:** the last 5 typed terms, as rows (clock icon + term) rather than chips.
  - "Clear" sits at the heading's right edge.
  - It acts at once, with no confirm.
- **First use:** groups with no content don't render, headings included.
  - Kind and Rating are always there, so the screen is never blank.
  - No hint line.

**2. While typing (18c)**
- **Hits:** up to 3, mixed kinds.
  - Each is a 46 thumbnail + name + a meta line that starts with the kind (`Bag ·`, `Cup ·`, `Gear ·`), and ends in ›.
- **Terms:** a magnifier + the term, with the typed part in ink and the completion muted. No ›.
- A hairline separates the two halves. There are no headings.
- **Term rows don't show a kind.** A term searches everything and lands on ALL.

**3. Results (18d–18f)**
- **Text query:** five tabs, using Home's tab component on a hairline.
  - ALL has no count.
  - Tabs with 0 still show their 0, so the tab row is stable.
- **ALL order:** Beans, Gear, Words, Cups. Empty sections are omitted.
  - Rows shown: Beans and Gear 2, Words and Cups 3.
  - "More cups · N ›" switches tab; it does not push a new screen.
- **BEANS includes finished bags,** marked `finished Mar 2` in the meta line.
- **Rating:** no tabs. Confirmed.
- **Kind: confirmed archive shape** (month groups, 2b's Sort / Group). Also **no tabs, not even CUPS alone**: one tab isn't a choice. Rating uses the same archive shape.

**4. The field (18x)**
- **Kind and Rating are a block that can only be removed.** They are filters; editable text would turn them into a string search.
- **A flavour is plain, editable text.** It really is a word query.
- **This needs a new component, a FilterToken:**
  - 30 tall, ink fill, labelCaps, × with a 44 hit area.
  - × or backspace removes it.
  - Typing replaces it. One filter or one query at a time; no mixing this round.

### Part 2 · Pages (19a–19c)
**5. Title = name.** 40/41 serif, 2 lines, then an ellipsis, as on 2c.
- A sub line goes under it: roaster · size, or category · added date.
- The back button is ‹, not ×.
- The header "Cups logged" count is removed; the cup list carries it.

**6. Cup list.** Proposed order: status → cups → details → end actions. This differs from the brief's "list at the bottom":
- The page is for looking.
- The form is about 480px tall and would push the cups below the fold.

List details:
- 5 rows, then "All N cups ›". That opens search with the bag or gear as a block, in archive shape.
- **Row:** 46 thumbnail; date · method as the title; flavours; then rating + time of day. The bean isn't repeated on its own page. Each row goes to 2c.
- **Empty:** "No cups with this grinder yet." + "Log a cup with it ›" (Log a cup, with the item preselected).
- **Kettles and scales have no cup list** (B5).

**7. Save is absent until the first edit.**
- On the first edit a pinned bar rises over `motion.expand`. Height leads and opacity follows.
- The scroll area's bottom inset grows by the bar's height, so nothing is covered.
- Reverting to the stored values removes the bar.
- Back with unsaved edits → the existing discard sheet.

**8. Bottom order:** Finish bag (2px, a normal step), then Delete this bag (hairline), then the Save bar outside the scroll. Gear: Remove from my gear · Frees 1 slot.

### Round 13 E3 / E4
- **E3: still applies, moved.** Search has no header, so Kind and Rating searches show a count line ("14 cups") next to Sort / Group. Text queries carry their counts in the tabs.
- **E4: still applies.**
  - Filter with no cups: "No 2★ cups yet." + "Ratings you've given most: 3★ and 4★."
  - Text with no matches: no tabs, "Nothing matches “xyz”."
  - Empty tab: "No gear matches “guji”."

### For Code
- **2a:** remove the chip row (header, search, list).
- **New component:** FilterToken.
- **New data:** history storage (last 5 typed terms), and flavour counts per user.
- **New lookups:** cups by bag id and by gear id.

---

## Round 15 · addendum (2026-10-27)

Answers the items collected after Round 15 went out, so they can leave `design-brief-next.md`.

**C8, as rewritten: accepted. 17c / 17d now follow it.**
- Gear's first-row rule is gone. The rows start right under the underline on their own padding.
- Beans' first card sits `gap.section` (12) under the underline.
- 17c's thumbnails are 46.
- Underlines fading with the scroll, labels switching at the midpoint, and the slot count crossfading over `motion.expand` are all right. A two-state tab that flickers on tap was a real defect.
- I see no problem.

**B3: the conclusion holds, the reason is corrected.**
- Home's shelf rows are information and open nothing. That is right: they are recognition rows, not a list to work from.
- Full names are one tap away through "See all gear & beans ›", which sits right under the rows. That is enough reach for the one-line exception.
- Don't add a row affordance.

**B4: yes, I meant Round 11 C.** There is no Round 16 rule; that was my error.
- The chevron is the only "opens something" sign. It now also covers text actions beside a title (1b's See all, the shelf's See all gear & beans).
- **5a's "Add tasting note →" keeps →.** It is a button that advances the same sheet, not a link to another place. → is "next step" and › is "go there", so the two stay distinct.

**17a / 17b "Recently sipped" badges: fixed.**
- The 12 mode and source badges are now `Badge` (`labelEyebrow`, 10 / .16em, 4 / 8 padding).
- "Ready-to-drink" now reads "Packaged" (D-14).
- The rest of those rows (58 thumbnail, 16 title) is still the old 2a style. The app's Round 9 rows win, and the redraw is still open.

**Round 13 E1: note added there.**

---

## Round 15 (2026-10-27)

Responds to `uploads/design-brief-round-15.md`. The mock (17a–17d) now follows A, C and E. Changes are listed at the end.

### A. §0 token check
1. Noted.
2. **Agreed: `space.20`.** The mock now uses 20.
3. **Agreed: all three names**, including `component.pageIndicator`. D-51 stays open for 3b / 3d.
4. **Agreed: all five as built.**
   - The tab count on `labelCaps` is better than my `meta` (same weight, same baseline).
   - The status word on `meterLabel` is correct: it *is* the freshness state word.
5. **Agreed.**

### B. Questions
**1. Round 7 is right. Round 14's table was my error, not a new decision.** I took the colours from the old 4b drawing and did not check them against 14a.
- Home uses `component.beanFreshness` as it stands:
  - The peak band is mint (`#CFDCC8`) in every state.
  - Resting and past peak share the neutral pair, with a `text.secondary` word.
  - Green means only "drink now", and past peak is not a warning.
- 17a / 17b / 17d are redrawn to match.

**2. Agreed: both, and the order.**
- **Sealed**: the word "Sealed" alone, `beanFreshness.sealed.label`, with no bar.
- **No roast date**: an empty column.
- **Order**: after Resting, opened bags first, then oldest added.
- The TODOs can close.

**3. The shelf rows are an exception to §3.1: one line, with ellipsis.**
- What Round 14 gets out of this block is that both sides are the same height, so the swipe doesn't jump. A row that grows to two lines breaks that.
- The shelf only needs a name you can recognise. Tapping the row or "See all gear & beans" shows the full name, and on 17c / 3b / 3d names keep §3.1's 2 lines.
- For §3.1: add "Home's shelf rows: 1 line."

**4. Yes, switch "See all" to ›.**
- Round 16's rule says every "go there" action becomes the chevron, and 1b's → was missed.
- Two actions on one screen should not use two glyphs.

**5. OK: empty, with no Add to a cup.** A cup can't hold a kettle or a scale, so the line would promise something impossible. "Not used" / "Add to a cup" stays for brewers and grinders only (cup count = 0).

### C. Built differently: all accepted
1. **Accepted: the column grows, with a least width of 84.** The bar stays 84. The mock now uses `min-width`.
2. Accepted: `gap.tight`.
3. Accepted: the existing `Badge`.
4. Accepted: the marker is 2 × 14.
5. Accepted: `motion.expand`.
6. **Accepted.** The compact, pinned, collapsing header is right for a pushed screen. 17c / 17d's scrolling-away header is a mock simplification.
7. **Accepted.** Each side keeps its own height on the full screen. Fixed heights only matter on Home, where the block sits above the nav.
8. Accepted: 46 thumbnails and 3b's first-row rule.
9. **Accepted: always gear.** Remembering the side would make Home open in a different state from day to day for little gain.
10. **Accepted.** An empty side shows its add button in place of the three rows. The indicator and "See all gear & beans" stay.

### D. §4 gear usage
Confirmed. No issues.

### E. Mock fixes
- **17c note**: "3px" is now "2px", and "4 / 5 open" is now "3 / 5 on the shelf". Fixed.
- **17b bars**: the window is now mint (see B1). Fixed.
- **17a "Recently sipped" rows**: agreed, these are stale. The app's Round 9 rows win. Not redrawn this round.

### F. Reports
1. **2a pinned chips and headings: no problem.**
   - Filling the pinned block with `surface.ground` plus the dot pattern, aligned to the page, is the right answer. It reads as the page, not as a new band.
   - The heading owning its hairline is also right.
2. **No header rule: matches the Round 14 mock.** No problem.
3. **Compact chips at 32 with hit-slop: no problem.**
   - The 44 touch target is kept, and one line at 375 / 402 is worth it.
   - `inset.controlCompact` and `gap.controlCompact` should go into `tokens.ts` with a note: "chip rows that must hold one line". Otherwise the next chip row won't know which inset to pick.
   - This changes Round 13 E1. I'll note it there.

### Mock changes this round (17a–17d)
- Tab gap is 20. Label-to-count gap is 4.
- Tab label and count are `labelCaps`. Inactive count is `text.muted`.
- Slot count is `labelCaps` / `meterLabel`.
- The status column is `min-width: 84`. Status word is `meterLabel`. Gear line 2 is `bodySm`.
- The Default badge is `Badge` (`labelEyebrow`, 4 / 8).
- The marker is 2 × 14. The indicator transition is `motion.expand`.
- Bean colours are Round 7 (B1).
- The kettle's status column is empty (B5).
- 17c / 17b notes are corrected (E).

---

## Round 13 (2026-10-23)

### A. Round 12 build
1. **OK, the category stays at the top of the body.** Keep the shared compact header as it is. The category describes the item, not the screen, so it sits fine just above the card. The mock follows the build.
2–3. Noted.
4. **Noted.** The mock fixes (D-37, D-39, the › chevrons on 2c / 3d / Home's shelf) and D-7 to D-16 go into the next export.

### B. Items answered twice
All three are **agreed: keep what is built.**
- Empty axis: "Not noted yet" for a profile, "Not noted" for a cup. The two different words are right.
- 5c: "Starts at …", "-bodied", and the "Your Taste DNA stays where it was" line. My Round 12 versions are withdrawn.
- Lock-in: counted in notes. "Cups" was wrong.

### C. D-38
**Agreed.** Keep `text.placeholder` until D-44, and decide both at the final polish.

### D. Reports
Noted. Dropping 8l's matched tag is fine: the row's lines carry the match. 6a at `display.sm` is fine.

### E. 2a's category chips
1. **All OK as listed.**
   - Labels: All / I made it / Barista / Packaged.
   - `SegmentedControl`, 44 tall, the same row as 8l's. **Superseded by Round 15 F3:** 2a's chips (and 2b's Group by) are compact chips, 32 tall, using `inset.controlCompact`, `gap.controlCompact` and a 6pt hit-slop to keep 44. 8l's scopes stay at 44.
   - One at a time. Each launch starts from All.
   - The chips and 2b combine. 8l doesn't take the chip.
   - One addition: when switching chips, keep the list's scroll position at the top. Each chip shows a different list.
2. **Your reading is right for both.**
   - 16: the filter button stays plain. The selected chip is the "in force" sign, and it sits in view on 2a. 2b still holds no filter.
   - 18: "Done" with no count. 2b still can't change how many cups there are.
3. **The cups shown.** "N Cups" counts the list under it, so the header and the list always agree. The label doesn't change. The chip above the list says what is counted.
4. **One line per type, stating the fact only.** No invitation: V1 can't fully log a Barista cup yet, and the + button already says how to log. "Yet" says the list will fill.
   - I made it: **"No home brews yet."**
   - Barista: **"No café cups yet."**
   - Packaged: **"No cans or bottles yet."**
   - Style: body, `text.secondary`, placed where the first row would be. The header shows "0 Cups".

## Round 12 (2026-10-23), with D-37–39 and earlier open items

Round 10 A, C10, D11–13 and all of Round 11 are answered above ("Round 11"). A1–A3: noted. D-43: OK, the 3g caption becomes "From 3d → tap a card".

### B. 3b / 3e
4–6. Noted, all OK. Bring back the settings note together with grind (T-11).
7. **Show the category, as plain text.** Put it under the header title as body.sm in `text.secondary`, reading "Grinder", "Brewer", "Kettle" or "Scale". It is not a field and not a chip: 3e has to say what the gear is even when there is no default row.
8. **OK, as built.**
   - The switch turns off as well as on.
   - Removing the default gear passes the default to nothing.
   - `size.switch`, with the on and off colours as listed.
9. **OK**, with "removed" as the verb in 13b's notice. Each verb matches its action: deleted, reopened, removed.
   - One copy change, for the default only: **"It's your default grinder. New cups start without one until you pick another."** That is two sentences, and "pick" matches 5a.
10. **The line is enough at any N.** The number is the warning, so keep one wording for every count. Use the grouping separator from 1,000 cups (tabular numerals).
11. **OK, Back.** It is a pushed screen. The × in 3e's mock is drift.
12. **Both OK.** 3b's "Kettle · not used yet" is drift.

### C. Sheets
13. **OK as the rule for every sheet.** On a confirmation sheet, a swipe always means Cancel. Add it to §1 next to the handle rule: if a sheet draws a handle, it closes on a swipe down.

### D-37 / D-38 / D-39 (report)
- **D-37: no. A dashed underline does not mean "optional".**
  - 8o is the only form that draws it, as `#C8BCB4` dashed under "Roaster" and "Roasted on".
  - The other forms say "optional" in words: 3c "Optional." / an "Optional" tag on the row, 5a and 6d "Optional", in label.caps or body.sm, `text.muted`. None of them change the line.
  - So the one consistent rule is the word "Optional". A field's underline is always solid 1.5 `border.muted`, whether the field is required or optional.
  - Fix 8o: draw a solid underline and keep its placeholder text "Optional" / "Optional — for freshness". Dashed keeps only its §8 uses.
- **D-38: one placeholder colour, `text.secondary`.**
  - `#A39389` on 8o is drift. It also fails 4.5:1 on paper.
  - 5b's "My words" has the same role as the other placeholders: empty-field text that goes away on input. An example sentence is still a placeholder. Move it from `text.muted` to `text.secondary`.
  - Text the user has entered is `text.primary` everywhere, so it reads differently from a placeholder by colour as well as by weight.
- **D-39: there is no reason for 38. Use 34.** 8c, 8n and 8o share one setup footer, and 38 was copied from screen to screen. The setup flow has no shared need for it, so use the same 34 as every other footer.

### Earlier open items (design-brief-next)
**Taste DNA card**
- **An axis with nothing noted:**
  - Keep all four rows, so the card's height stays the same.
  - An empty axis is drawn as a track only: no dot, no number, and its band name replaced by "—" in `text.muted`.
  - Leave out "Not noted" on every row. When three or more rows are empty, put one line under the axes in body.sm, `text.secondary`: **"Fills in as you note each taste."**
- **No cups noted at all: OK.** No badge. Use the 8f line from Round 11: **"Rate a cup and note one taste to start."**

**5c copy**
- **An axis's first value:** **"First reading: ‹band›"**, e.g. "First reading: Bright". It names a start, not a movement.
- **Summary sentence:** "This cup pushed you ‹c1› [and ‹c2›]." Use the two axes that moved most and leave out any that moved less than 1 point. If no axis moved, show no sentence.
  - Acidity: brighter / more bitter
  - Body: lighter in body / fuller in body
  - Sweetness: sweeter / less sweet
  - Roast: toward lighter roasts / toward darker roasts. "In body" and "toward … roasts" keep the two "light" poles apart.
  - Example: "This cup pushed you brighter and fuller in body."
- **Nothing moved:** **"Saved. This one didn't move your taste DNA."** No apology and no advice.

**5a and 5d** (answered in Round 9)
- **5a's intro line on an empty shelf** is replaced by the Required bar's sub-line: "Add a bag & gear once to pre-fill".
- **5d's second line:** "A cup can't be saved without one. What you've entered stays while you're here; closing loses it."
- **5d with one item missing:** "Still needs a rating" / "No rating yet."

**Please check**
- **3c's Bean name error: within the set.** The label suffix, the error colour on the underline and no new parts are all from 5d. OK.
- **Intro block: no, keep it on 5a and 5e only.** There the line ties to the Required bar. Other screens' opening lines stay plain text.
- **D-46's side effect:** fixed in Round 9. The Required bar now shows "required" through its labelled slots, so no square is needed. The section labels keep the plain "· required" suffix only when an error is shown.

**Taste DNA copy**
- **1b's lock-in line:** **"N more cups to lock it in"** is correct as the rule defines it, with N counted from the axis with the fewest records. When N = 1, write "1 more cup to lock it in".
- **6b's Reset line:** **"Counts from today. Older cups stay in Records."**

## Round 11 (2026-10-21), with Round 10 A–D

### Round 10 A. Drift
1–8 and D-56: **all OK as built.** The mock side follows the tokens.

### Round 10 B. 3a's full-shelf hint
9. **V1 line: "Limit reached. All 8 gear slots are in use."** It offers no way out, because V1 has none. Switch to the "Remove gear…" line when 3b / 3e ship.

### Round 10 C. 1b's line under the counts
10. **(b) Drop it for V1.** The counts and the strip already say how the week is going, and a line with no rule would only repeat them.

### Round 10 D. 8f
11. **"Medium sweet" is right.** The band comes from the value. The summary's "lightly sweet" was board drift.
12. **Summary rule (D12):**
    - The summary is built from band names only. Leave out flavour words and My words: "juicy" came from My words, which are not in V1.
    - Take the noted axes, drop any in the middle band (Medium …), and keep the two farthest from 50.
    - Order them by distance from 50. The first word is capitalised, the rest are lowercase, joined by ", ". Example: "Bright, light-bodied".
    - If one axis is left, show that one band. If none is left, or nothing is noted, show no line.
13. **They match.** 6a uses 8f's band names ("Bright · Light-bodied · Light roast"). One axis, one wording, everywhere.

### A. Round 10 follow-ups
- **14: OK.** For I made it cups that lack a roaster or a brewer, keep "No roaster" / "No brewer". Order: No roaster / No brewer, then Packaged, then Barista. The same order applies after Z.
- **19: both OK.** "Nothing matches “q” · 4★ and up" and "No cups rated 4★ and up".

### B. 8f follow-ups
- **"Flavours I pick most": yes, as its own block.**
  - Placement: right under the four axes, before "What you keep saying".
  - Content: heading "Flavours I pick most" (label.caps), then the top 4 tags with their counts. Use the same row style as "What you keep saying", e.g. "Peach 12".
  - The block is hidden until a tag has been picked.
  - Once 8h exists, both blocks show: picked words first, said words second. Each has a one-line sub-heading so they can't be read as one list: "From the flavour list" and "In my own words" (body.sm, `text.secondary`).
- **Last shift copy: OK.** Band names and the date only. The app never guesses a cause.
- **8f with nothing noted:** add one line under "From 0 cups": **"Rate a cup and note one taste to start."** No illustration.
- **Header stamp: OK at the card's size.** No new style.
- **Home → 8f: yes.** Add a pressable row at the foot of Home's Taste DNA card: **"Open my taste DNA ›"**. It uses the row treatment in C (chevron at the end, pressed fill out to the card's inner frame). The card itself stays not pressable, so the stamp is still the only other button in it. This is the same pattern as 3d's "Finished bags".

### C. Pressable blocks: one treatment
The rule: **the chevron is the only sign that a block opens something.** Frame and fill say "pressable" only on controls (Button, chips, slots), never on a block of content.

- **Pressable row or block**
  - Frame: no frame of its own.
  - Sign: a chevron › in `text.secondary`, 16, at the row's end. On a one-line row it is centred vertically. On a multi-line block it sits on the heading line.
  - Pressed: `state.pressed.row`, filled out to the container's edges (to the screen on a list, to the inner frame inside a card).
- **Framed block that is not pressable:** a 2px ink frame on `surface.raised`, with no chevron and no pressed state. Buttons inside it keep their own control look.
- **Framed block that is pressable** (only Profile's Taste DNA card): the same frame plus a chevron on its heading line, and the pressed fill inside the frame. The chevron is the only difference from a non-pressable card.
- Dashed lines never mean pressable (§8, unchanged).

The seven places:
1. 2a: no change; built is right.
2. Home Recently sipped: no change.
3. 2c "Feeds my taste DNA": **put the › on the heading line at the row's end** (Turn 16b). Keep no frame.
- Existing → arrows (2c, 3d "Finished bags", Home shelf) become the 16 `text.secondary` chevron. Mock: Turn 16.
4. 8l results: **drop the 2px frame** and use `RecordRow` exactly as 2a does. Per-row frames are the noise Round 9 removed.
5. 3d: no change.
6. Home shelf "Manage my beans": no change.
7. 5a / 5d / 5e field rows: no change.

Not pressable:
- 8f "Last shift" stays a plain section with no frame. #FFF8F1 is board drift.
- 2c "Where it sat" and Home's DNA card keep their frame with no chevron.

### D. 6a
1. **When 8h comes, My words gets its own heading, "My words".** It does not sit under "My shelf", which means gear and beans only.
2. OK.
3. OK.
4. **Week streak: OK as written.**
5. **Bags: OK**, counting every bag ever added.
6. **OK.**
   - Band names shown as Badges.
   - Add the summary line per D12 above.
   - The card follows C's "framed block that is pressable": chevron on the heading line.
7. OK, "N of 8".
8. OK, "N of 5" only.
9. **OK**, with the line "N cups as JSON, notes included".

## Round 10 — E. Records sort (2b) and search (8l) (2026-10-21)

**2b — Sort & group**

14. **Cups with no roaster or brewer: OK to put them last.**
    - Headings are named by what the cup is, not by what it lacks: **"Packaged"** and **"Barista"**, one group each, in that order after the real groups.
    - Barista cups do not group by café in V1, because café can't be entered yet. Revisit once it can.
    - Under the "Roaster A–Z" sort, the same cups go after Z: Packaged first, then Barista.
15. **Sort with group: OK as proposed.**
    - Inside a group, cups follow the sort.
    - Groups are ordered by their first cup under that sort.
    - Month groups follow the date direction.
    - With Group by Month, a rating sort orders cups inside each month; the months stay in date order.
16. **Filter icon: leave it unchanged in V1.** 2b always shows its current choice when opened, and 2a's section headings already show the grouping. Drop `gaps.md` 16 until a real filter exists.
17. **Marker: the square radio, as proposed.** All single-select rows use one marker. The board's check mark is drift.
18. **The button reads "Done".** With no filter the number gives no information. Use `Button` primary, full width. The count returns once a filter can change the result.

**8l — Search**

19. **Result headings.** body.sm, `text.secondary`, with the count in tabular numerals. "q" stands for the typed text, curly-quoted.
    - Words: `9 cups say “q”` (as drawn). With one result: `1 cup says “q”`.
    - Beans: `5 cups of “q”`.
    - Gear: `4 cups brewed with “q”`.
    - 4★ on, field empty: `12 cups rated 4★ and up`.
    - 4★ on, with text: add ` · 4★ and up` to the end of the line, e.g. `3 cups say “juicy” · 4★ and up`.
    - No results: `Nothing matches “q”`. Nothing goes under it: no illustration, no suggestions.
    - Field empty and 4★ off: no heading and no list. Show only the scope row.
20. **Words: search flavour tags as well, as proposed.** Words means "what I noted about the cup". A tag match counts the same as a match in the note, and each cup is counted once.
21. **Gear: hide the scope until 3b / 3e.** A scope that can never find anything reads as broken. Words and Beans stay. Add Gear back when gear can be renamed.
22. **Recent searches: leave them out of V1.** Session-only recents would be empty on every open, so the block would show up as empty most of the time.
23. **4★ and up: OK.** It is a switch that combines with any scope, and the test is rating ≥ 4. Rows show whole stars ("4"). The board's "4.5" is drift.

## T-6 pass 1 — reply (2026-10-20)

### A. Spec questions
1. **3a's count: (a).** The header stat is a running total, not a selection count, so the §1 rule doesn't apply to it. The rule still covers inline counts like "5 of 5" and "3 of 3 picked". On 3a, the light impact and the locked-row hint mark the limit.
2. **Ink wins.** §1 Tap affordance (2026-10-09) is the later rule. In §1 Colour roles, blue means "in force", not "pressable". Update §3 so `text.inlineAction` pairs with `color.text.primary` instead of `color.text.link`. 5d "Go to first" and 3f "Reopen bag" become ink and underlined.
   - `color.text.link` has no remaining text-action use; keep the token only if something else still uses it.
3. **Yes.** §1's line sets the meaning, not fixed copy. Each screen's hint must say two things: the limit is reached, and deselecting one frees a choice. 5b's line is OK.

### B. Built without a mock
4. **Rewrite as "No slots left. Remove gear from My gear to free one."** A screen-reader hint should give a way out, the same as §1's hint does. The footer's "0 slots left" stays.
5. **InlineAction: OK, added to components.md.**
   - Colour is ink, per item 2.
   - Off state: `inlineActionOff` in `text.muted`. Use it only where the screen says why.
   - Pressed: scale only. Touch area: 44pt via hitSlop.
6. Noted.

## Round 9 copy check — reply (2026-10-18)

### A. Required bar sub-line
1. I made it, shelf has a bag and gear: **OK**, "Pre-filled from your shelf".
2. I made it, empty shelf: **"Add a bag & gear once to pre-fill"**. Uses the "&" like 5e, and is shorter than the 40-character limit.
3. Barista: **"Café cups skip beans & brewing"**. This matches 5e's "Packaged cups…" opening.

### B. 5d with the product missing (Packaged)
4. **OK** as proposed. The body copy is the rating body, with "one" kept.
5. **OK** as proposed. The body copy is the rating body with "one" changed to "them".
- Star hint: **change it to "Tap a star — only you know how it tasted."** The old line ("the one thing the app can't guess") stops being true once the product is required too. Show it only while the rating is missing, as before.

### Not copy
Token names below follow `tokens.ts`. Every colour maps to an existing token; no new tokens.
- Bar ground: **confirmed, `surface.muted` (#E4D6CC).** `surface.mutedStrong` in Round 9 was my error.
  - Frame: 1.5 `border.muted` (#C8BCB4).
  - Empty slot: 1.5 dashed `border.muted`-weight frame in `text.muted` (#6B5D55), no fill; label `text.muted`.
  - Filled slot: #CFDCC8 ground with #4A6640 check and label (the bean-freshness `drinkNow` pair).
- Count: **confirmed, `text.muted` (#6B5D55) below full**, switching to #4A6640 only when every slot is filled. 5e mock updated to match (1/2 in `text.muted`).
- SEE ALL (4a / 4b, three places): it is now a text-and-arrow link with no fill or frame.
  - Text and arrow: `text.secondary` (#5C5049), Archivo 12/700, uppercase, tracking .08em.
  - Hit target: 44px high, with 8px left padding.
  - Do not use the blue `action` colour. Blue is only for primary actions and the active tab.

## Round 9 (2026-10-18): app lists drop item dividers

- **Item dividers are removed in every app list**: Records (2a), My beans (3d / 3f), My gear (3a / 4a), the Bag / Method pickers, and the Beans list on Home 4b. Items are separated by spacing only.
  - **Kept**: the one line between a list's header and its first item. The header row's `border-bottom` or the first item's `border-top` (1.5 `divider.soft`) stays.
  - **Removed**: the `border-top` / `border-bottom` (1.5 `divider.soft`) on the second item onwards, and the bottom line on the last item.
- **Row padding tightens** to make up for the lost line: vertical padding 16 → 12 and 14 → 11, with horizontal padding unchanged. Gear rows go 12 / 13 → 11.
  - Use the list's `gap: 0`. The padding alone sets the rhythm; don't add margin between rows.
- **Out of scope**:
  - dashed lines (`border.addSlot`, card-internal section breaks);
  - field dividers inside a card, such as 2c's "What I logged" rows and the FieldRows in 5a / 11a;
  - the bottom-sheet search list's 2px frame (§9).
- **5e Required bar** (same turn):
  - The bar sits on `surface.muted` (#E4D6CC) with a 1.5 `border.muted` (#C8BCB4) frame.
  - Header row: "Required" label, a sub-line, and a live count ("0/2" → "2/2").
  - One slot per required field. When filled, the slot is `#CFDCC8` with a `#4A6640` check and label. When empty, it is a 1.5 dashed frame with no fill.
  - These are the freshness status colours, not the active-tag ink, so the bar doesn't read as pressable.

## Round 8 (2026-10-17): Taste DNA status stamp → info sheet (drawn in Turn 15, applied everywhere)

- **The sub-line under "My taste DNA" is removed** everywhere: Home 4a/4b, Turn 10 states, DNA page. ("Three more cups to lock it in." / "Body and Roast need 9 more notes each to lock in.") Progress stays in the card footer ("3 of 5 cups" + cup glyphs).
  - Exception: the post-save card (Turn 5) keeps "This cup pushed you brighter and lighter." It's this cup's result, not an explanation.
- **The stamp becomes a button.** Inside it: a 14pt ⓘ glyph (stroke 2.4, the stamp's ink colour), then the label, gap 6. Stamp padding is unchanged, except the left side is 2 less to balance the glyph.
  - Hit area: a transparent wrapper, 44 tall, padding 0 / 6 and margin −6 on the top, right and bottom, so the stamp stays where it was. The header row is vertically centred.
  - **No rotation.** `rotation.sticker` is no longer applied to this Badge, which supersedes Round 2's "rotation.sticker kept". Other sticker uses are unchanged.
  - Same treatment for every status ("Early signs", "Locked in"). ⓘ is reserved for status words that need explaining; don't add it to labels.
  - The DNA page header's compact "Locked in" (9px, `surface.inverse` fill) gets it too: an 11pt glyph in `text.onInverse`, gap 5, and the same 44 wrapper.
  - **Exception:** a status chip inside a card that is itself a link (the Profile Taste DNA card, Turn 6) stays a plain chip with no ⓘ and no tap of its own. That avoids a nested button; the card leads to the DNA page.
- **Tap → info sheet** (§9 Bottom sheet, 15b):
  - Max height 78%; the body scrolls.
  - Order: eyebrow "My taste DNA" (Archivo 11/700, accent) → title = status (Instrument Serif 34) → body copy (Archivo 14/500, line height 21, `text.secondary`, free length; final copy TBD) → progress box → "Got it".
  - Progress box: `surface.base` with a 2px ink frame. "N of 5 cups" + glyphs, then the live sentence that used to sit on the card ("2 more cups to lock it in." / per-axis "Body and Roast need 9 more notes each.").
  - "Got it" is the 52 secondary. There's no primary.
  - Closes on Got it, a scrim tap, or swipe down.
- **Copy fix:** at 3 of 5 the line reads "2 more cups to lock it in." (the earlier "Three more" was wrong).
- **3c / 3d (unopened bag)**: 3c adds "Add without opening", a 48 secondary under "Open this bag". An unopened bag takes a slot.
  - The 3d card: dashed 2px ink frame, no freshness bar. Meta line "… · Not opened yet". Status row "Sealed · clock starts when opened". Primary 44 "Open this bag".
  - Header count label: "On the shelf" (per item 18).

---

## Round 7 (2026-10-14): reply to `design-brief-2026-10-14.md` (drawn in Turn 14)

### Freshness
39. **Resting**: elapsed `#C2B4AB`, marker `#8C7E76`, label `text.secondary`. These are pastPeak's neutral pair, not a warning, and need no new tokens. Green means only "drink now".
    **OQ-3: the band is the bag's.** The peak band stays `#CFDCC8` in all three states. pastPeak's `#E4D6CC` band was drift: set pastPeak.peakBand to drinkNow's. Resting and past peak share the same colours; the marker's position (before or after the band) and the label tell them apart.
40. **"The windows are a rough guide. Your own taste is the better judge."**
    - Where: once on 3d, under the last bag card and above "Finished bags".
    - Style: Archivo 12/500, `text.secondary`.
    - When: only if at least one bag has a roast date.
41. **3c's Roasted on line: "Add it to see when it's at its best."** It stays optional, with no required mark.
    - **No roast date**: 3d's card drops the freshness row and closes up; the opened line stays.
    - 5a's Bag row shows the roaster alone. With no roaster either, there is no meta line.
    - 2c shows nothing in place of "day N when brewed". All three read fine; nothing reads as missing.
42. **3g: "Freshness on My beans counts from this date."** Adopted as you proposed. It covers both an empty date and a filled one.
33. Noted.

### Still open
2 / 6. **Agreed: one line, no brand field.** I see no reason for one later.
    - The row closes up with no empty line 2. When Bought at returns, line 2 is the store.
    - **2c for Packaged**: the title is the product name, and "What I logged" is hidden (the same rule as 12a with no bag or gear).
16. **Confirmed**, with this split: Good morning before 12:00, Good afternoon 12:00–17:59, Good evening from 18:00 and through the night.
17. **Agreed**: not shown until there's a rule.
18. **Copy is fine.** In 3d and Home write it in sentence case: "Not opened yet". "Add without opening" and "Open this bag" stay.
    - **Rename "Bags open" to "On the shelf"** in 3c and 3d. It counts the bags you have, opened or not.
    - The slot line stays as it is: "3 of 5 slots free. Finish a bag to free one up."

---

## Round 6 (2026-10-14): 3f / 3g open points (28, 29, 34, 36, 38)

### 3f — Finished bags
28. **Reopen with 5 / 5 slots taken.** Say it once, above the list, instead of on every row:
    - Line under the header (Archivo 12/500, `text.secondary`, the same style as 3c's slot line): **"5 of 5 slots in use. Finish a bag in My beans to reopen one."**
    - Every row's Reopen: label `text.muted`, no underline, not pressable, still 44 tall. The row stays tappable if it opens 3g (37).
    - With a free slot, the line is hidden and Reopen looks the way 3f draws it.
29. **Confirmed**, with three details:
    - Line 2: **"Blue Bottle · Mar 2 → Apr 1"**. No "opened" / "finished" words: the arrow carries it and the line fits. With no roaster: "Mar 2 → Apr 1".
    - Cups and rating: "3 cups · ★ 4.4". A bag with no cups reads "No cups" and shows no rating.
    - No sort and no summary row in V1, but a fixed order: **latest finished first**.

### 3g — Edit bag
34. **Yes.** Opened on runs from the roast date to the day of the first cup from this bag. With no cups, up to today. A limit line under the field, the same as 11a's: "From Mar 30, the roast date, to Apr 6, your first cup from it." With no roast date: "Up to Apr 6, your first cup from it." With neither, no line (Round 4, 22).
38. **Yes, adopted as written:** "Your edits to this bag won't be saved. The bag stays as it was." Title and buttons as in Round 4 (19).
36. **Yes, put "Delete this bag" in V1's 3g.** Without it, a bag added by mistake can only be finished, and then it sits in 3f and skews "Finished bags".
    - **Confirmation**: 11b's sheet shape and buttons, with "cup" → "bag".
      - Title: "Delete this bag?"
      - Body: "It's removed from My beans for good. Your 3 logged cups keep its details." With no cups, the second sentence is dropped.
      - Third line, only for an open bag: "Drank it? Finish it instead. A finished bag can be reopened."
    - **Telling it apart from Finish**: they are on different screens. Finish is only on 3d's card, and Delete is only at the bottom of 3g, so the two never appear together. 3g has no Finish button.
      - Delete row's meta line: replace "Not finish — erases it" with **"For a bag added by mistake"**.
    - **Feedback**: yes, 13b's notice: "Ethiopia Guji deleted." It returns to where 3g was opened from (3d, or 3f).

---

## Round 5 (2026-10-13): after deleting a cup, the notice (Turn 13)
- Confirming in 11b returns to Records (2a). A one-line notice sits 12 above the tab bar, inset 22pt left and right (the page margin, lined up with the full-width tab bar's icons). Updated to match the build; the earlier 90% came from the old floating tab bar.
- Look: `surface.inverse` + `text.onInverse`, square, no border and no shadow, min 48 tall, padding 13 / 16.
- Copy: "‹cup title› deleted." The title follows 2a's row-title rule. The name truncates; "deleted." never does.
- Timing: enters with `motion.expand` (fade + rise 8), holds 2s, fades out. Not tappable, no Undo (11b says it can't be undone).
- Accessibility: announce the sentence; with Reduce Motion on, fade only.

---

## Round 4 (2026-10-13): 11a open points (19–26)

19. **Leaving with unsaved changes**: a bottom sheet, the same shape as 11b. Back and the edge swipe both lead to it: catch the leave (navigation `beforeRemove`) instead of only the Back button. With no changes, leave silently.
    - Title: "Discard your changes?"
    - Body: "Your edits to this cup won't be saved. The cup stays as it was."
    - Primary: "Keep editing". Secondary text button: "Discard changes".
    - The same applies to 3e / 3g / 6d.
20. **Yes, offer "No bag"** in 11a's picker only: the first row, a square radio like the others. Label "No bag", meta "This cup wasn't from a bag." Choosing it puts the row back to "No bag noted".
21. **Confirmed: no "Add gear" in 11a.** Editing corrects a record; it doesn't stock the shelf. New gear is added from My gear (3a). Same rule as 20: the Brewer and Grinder pickers each get a first row, "No brewer" / "No grinder".
22. **No line.** The spinner can't pass today, so "Up to today" would only state the obvious. The second line shows only when there is a roast date.
23. **Yes, mark it.** The row stays selectable and keeps its look; its meta line starts with "Finished Apr 2 ·" in `text.muted`. Only this cup's own bag appears that way; other finished bags are not listed.
24. **Confirmed**: Packaged and Barista leave the block out (When, My words and As logged only) until item 6.
25. **Keep it always pressable** (§1, same as 5a). With nothing changed it returns to 2c without writing anything.
26. **No note.** The existing "Your Taste DNA counted these when you saved" covers it.

**Round 3 leftover: 2c with neither bag nor gear**: hide the Method row too, which leaves "What I logged" empty, so the whole section goes. The title ("Morning cup") and "No bag or gear noted" under it say what's missing (follows 12a).

---

## Round 3 (2026-10-13): reply to `design-reply-2026-10-13.md`

### 1. Unselected vs disabled — accepted
- 11c updated: Kenya Nyeri's marker is now a 2px ink frame; Colombia Huila keeps `border.muted` + `text.muted`. The "Depends on" note is removed.
- 11c otherwise stays as drawn.

### 2. 11a / 11b / 11c — noted as adopted
- 11b's caption marks "Your profile goes back to Early signs." as adopted.

### 3. The title of a cup with no bag — drawn in Turn 12
- **2c: hide the Bag row** (12a). A display row reading "—" looks like missing data. The absence is said once, under the title: **"No bag noted"**, in the roaster's slot.
- **2c: keep the repetition.** The title is the name; the Method row is the record (grinder, clicks). Removing it would leave the grinder nowhere. 11a keeps its Bag FieldRow, since it's an input there.
- **List rows** (12b): when the brewer is the title, line 3 reads "No bag · ‹grinder›", without repeating the brewer. When the grinder is the title: "No bag".
- **Neither bag nor gear: "Morning cup"** (Afternoon / Evening / Night), from the daypart 2c already shows. It reads as a name, needs no new data, and the date tells two apart. Second line: "No bag or gear noted". This applies to 2a, 2c, 5b and 1b.
- Barista / Packaged: not answered here. The same daypart rule would work if you want one rule.

---

## Round 2 (2026-10-12): rechecked against the repo design-system.md (2026-10-12)

This round uses `uploads/design-system-174ec2c3.md`, read end to end. The stale copies are deleted: the root copy, `uploads/design-system.md` and `-04f729b2`.

### Drawn: items 7, 8, 9
They're in `ExtractPress-design.dc.html`, Turn 10. Every value is a token.
- **10a, photo placeholder**:
  - fill `surface.mutedStrong`;
  - a hand-drawn cup in `icon.muted`, sized by the icon token for each size (38, 22, 18, 16), square caps, no frame.
  - Open: bags share the cup glyph. A bag glyph would be a second visual.
- **Item 8, two directions. I'm not picking: the deciding question is whether the card's fixed height is a condition.**
  - **10b (A), fixed height**: an empty axis keeps its bare `surface.muted` track, with "Not noted yet" centred on it on a `surface.raised` patch (`space.8` each side). The track is in a 17pt slot, the same as filled rows. This adds the label to §9 AxisReadout's "Value null: the track alone" (revised 2026-10-12, per Uryu).
  - **10d (B)**: only noted axes are drawn, with one closing line under `divider.soft` naming the rest. The card grows at most three times, each on the return to Home after a save.
- **Item 9**: 10c pairs with A, 10e with B. No badge; the line is the brief's.
- **Badge**: accent standalone, no frame, `rotation.sticker` kept. The lock-in line is item 13's adopted copy.

### The sheets, rechecked
Withdrawn, now that the file is current:
- **The eyebrow colour (old #7).** `SectionLabel` is `text.muted`, as built.
- **The full-height sheet (old #3, in part).** The **full** variant is now specified. SE top = inset 20 + 12 = 32 ✓.

Still open:
1. **design-system.md contradicts itself on the unchecked checkbox.**
   - §1 Tap affordance: an unselected option is "an outline (1.5 `border.muted`)".
   - §1 Tap affordance, a few lines later: "A 2px ink outline … unchecked checkboxes".
   - The search sheet follows the first.
   - Next to the Disabled look (label `text.muted`, box `border.muted`), the only difference is the label, `text.secondary` vs `text.muted` (ΔE00 4.84). So unselected and locked rows are nearly identical, as the screenshot shows.
   - Which is right?
2. **The in-list add row has no spec.**
   - §9 Bottom sheet makes "Add "Word"" "a row like the others". §8 lists "Add gear" as a `border.addSlot` use, and EmptySlot is a full dashed frame with a `label.caps` label.
   - Built, both add rows are list rows with a dashed 24 box around the plus and a `label` (sentence case). The dashed box keeps dashed's one meaning, an add entry, but no section describes it.
   - Either add it to §9 as EmptySlot's in-list form, or correct §8's "Add gear".
3. **The search list's 2px frame is open at the bottom** when the list scrolls past the sheet edge or the keyboard. The full variant doesn't say whether the frame closes.
4. **"Default" in the picker is plain text.** §1 calls 3b / 4a's "Default" a 9px Badge.
5. **"Add gear" sits only under Grinder.** Does it add any gear, or a grinder only?
6. **Sheet titles come in two styles:** `display.sm` on the picker, an eyebrow on the date sheet. Is that intended?
7. **"tdbkif" becomes "Add "Tdbkif""**, title-cased. Is that intended?

Date sheet: the spinner's text in `text.primary` matches §1 OS-drawn controls. Nothing to report.

---

# Round 1 (2026-10-11)

Source of truth used: `uploads/design-system.md` (updated 2026-10-10). The root `design-system.md` is the 2026-09-20 extraction and is out of date. Please confirm the uploads copy is the right one.

Nothing has been drawn yet. Six items have conditions that contradict each other or the system, and the rule for this round is to report those first. The items with no conflict (7, 8, 9, 15, and most of the copy) are answered below or ready to draw once you've read this.

---

## 0. Gaps in design-system.md itself

The brief and design-missing cite sections that aren't in the 2026-10-10 file:
- **§1 Saving a cup**: the brief cites it for "Discard and save".
- **§1 Required marks**: cited by items 6 and 10 and by the brief. §9 SectionLabel says the square marks *"a section of an input form"*, not *"always filled"*. That is a different rule from the one these items rely on.
- **§9 Radio marker** and **`size.switch`**: item 3 says "§9's square radio rows", but §9 has no entry for them. `components.md` #26 (Radio option row, 2b) has "selected (check)", not a square marker.
- **`texture.rule`**: §2 B still puts it on both `axis.rail.*` rows, and §2 Texture still lists it. The built AxisSlider and the AxisReadout spec don't use it, so the retirement matches what's built. The tables are what's stale.

Until these sections exist, I can't check items 3, 6 and 10 against a rule. I can only check them against the brief's description of the rule.

---

## 1. Contradictions — need your call

**Item 1, Cup edit**
- **a. Why the axes can't be edited vs what delete does.** The axes are locked because editing them "would rewrite history the user has already seen". But "Delete this cup" recalculates Taste DNA without the cup, which rewrites the same history, and with no notice afterwards. Either rewriting history is acceptable (then the reason for locking doesn't hold), or it isn't (then delete needs the same protection). I suspect the conditions are what's wrong.
- **b. The disabled look vs colour roles.** A saved cup's axes and flavours are values the user entered, so §1 Colour roles, step 1, makes them **brown**. §1 Disabled options mutes them (`text.muted`, `border.muted`), which erases the "I entered this" signal on the one screen built around the user's own entries. Also, §1 Disabled is defined only for *options in a set*. The rating card and the axes aren't that. The closest fit is a display form: AxisReadout (neutral), but neutral means *computed*, which these values aren't. No existing rule covers "entered, now read-only".
- **c. The date limit vs editing the bag.** "Not before the bag's roast date", but the bag is editable on the same screen. If the user switches to a bag roasted after the cup's date, the cup is suddenly out of range. Which wins: the date is clamped, the bag is refused, or an error is shown?

**Items 2 and 6, Packaged**
- **a. No brand vs §9 List row.** Item 6 says one field, product name only, no brand. §9 List row → Row order makes Packaged line 2 = **brand**. Does line 2 go empty, or does the table change?
- **b. No "where bought" vs §9 Bought at row.** Item 6 also says no "where bought", but §9 specifies and builds the 5e **Bought at** row, with a promotion rule. Is it removed?
- **c. A wrong cross-reference.** Item 2 says "(item 15)" for the product name. That should be item 6; item 15 is 3c's Bean name error.

**Item 7, Photo placeholder, vs "no camera in V1"**
- The photo slots are still specified: §9 Empty slot is anatomically 5a's camera "Add a photo", and 3c has a 76px photo slot. If V1 has no camera, these are pressable slots that lead nowhere. Are they removed in V1, or do they stay and open the photo library?

**Item 13, lock-in per axis**
- The profile "locks in when every axis with a record has 10". So a user who never notes Sweetness can lock in, and the first Sweetness note then **un-locks** the profile, because that axis now has a record and 1 < 10. Is that intended?
- The 1b mock's card foot reads "3 OF 5 CUPS" with five cup marks. That is Try next's threshold of 5, which the conditions say isn't shown in V1. Is the foot removed, or rewritten to 10 per axis?

**Item 3, picker sheet: two eyebrow levels**
- "Brewer" / "Grinder" eyebrows sit under the sheet's own "Method" eyebrow. Both are `label.eyebrow`, so the hierarchy has no token to tell them apart. The options are:
  - make the sheet title a `display.sm` title instead of an eyebrow;
  - drop the outer eyebrow;
  - accept a flat look.

  I'd take the first, but it's your call.

**Item 4, search sheet: what the 270pt contains**
- 270 / 53.5 = 5.05, so the five rows only fit if 270 is **list area only**. If the search field (`size.field.height` 46) and "Done" are inside the 270, about four rows remain. Was the 270 measured from the field's bottom edge, or from the sheet's top?
- The "Add "Word"" row: when it's present, does it take one of the five rows? As an EmptySlot it's about 50 tall, not 53.5 (`inset.control` + `icon.md` + 2 × 2 border). That's fine for the count, but the rows won't line up evenly.

---

## 2. Items 3–5, checked against design-system.md

I can't see the builds. The connected repo (`uryu-myao/MoreCoffee-App@main`) is at an old commit with 28 files and none of these sheets. The checks below are against the prose in design-missing and the brief. **Please send a screenshot of each sheet on an SE, keyboard up for item 4, and I'll check the pixels.**

**Item 3, Bag / Method picker**
- Within the system:
  - the bottom-sheet pattern (§9);
  - "Add a bag" / "Add gear" as an EmptySlot (`border.addSlot`).
- Can't be checked:
  - the square radio marker (see §0);
  - the selected state. §1 Tap affordance says a selected option is **ink-filled**, and "an outline with no fill never means selected". A marker-only selected state needs that rule written down first.
- Drift risk: none known.

**Item 4, Flavour search sheet**
- Within the system:
  - 53.5 = `size.control.row` 52 + the 1.5 hairline, so the rows sit on tokens;
  - "Done" without an underline. §1 Tap affordance allows it "beside a search field".
- "Search flavors" is correct. The product UI is US spelling (5b's heading "Flavors"; my earlier spelling flag is withdrawn).
- Drift: §9 Bottom sheet is "pinned bottom, padding 22 22 34". A full-height sheet ending at the keyboard isn't a variant the system describes. That's not a token violation, but it needs a §9 line, including what happens to the bottom 34 when the keyboard is up.

**Item 5, Date sheet (iOS spinner)**
- Two conflicts beyond the rounded band the brief already notes:
  - **Type**: the spinner draws its numerals in SF Pro, and they can't be restyled. That breaks "two families only" (§1 Type).
  - **Weight**: SF Pro is drawn at Regular (400), which breaks "400 does not exist".
- This is the OS's control, so I'd log it as an accepted platform exception, like §3.2's line boxes, rather than as drift. But it is a new class: the first OS control drawn inside the product's own surface. Your call whether that's acceptable.

---

## 3. Copy (items 10–13)

These are proposals.

**10. 5a intro line, empty shelf**
> Marked fields are required. Add a bag and your gear once — after that they start pre-filled.

**11. 5d, rating only**
- Title: **Still needs a rating**
- Second line: **A cup can't be saved without one. What you've entered stays while you're here; closing loses it.**
- Footer: **No rating yet.**

**12. 5c**
- **An axis's first value**: **Starts at ‹step name›**, using the axis's own step name, not its poles. For example:
  - Starts at Bright
  - Starts at Light-bodied
  - Starts at Light roast
  - Starts at Lightly sweet

  It's a position, not a direction, so it reads as a start. A one-cup profile *is* that cup's value, so a step name always exists.
- **Summary sentence**: "This cup pushed you ‹phrases›." Join with "and"; with three or four, use commas then "and". Only axes that moved are listed; first values are left out.

  | axis | toward low | toward high |
  |---|---|---|
  | Acid ↔ Bitter | brighter | more bitter |
  | Body | lighter-bodied | fuller-bodied |
  | Roast | toward lighter roasts | toward darker roasts |
  | Sweetness | less sweet | sweeter |

  Body and Roast both start with "light", so each needs its own noun ("-bodied" / "roasts"). Otherwise the sentence reads "lighter and lighter".
- **Nothing moved**: **Your Taste DNA stays where it was — nothing on this cup moves it.**
- **A case the conditions miss**: an axis is noted, but at the profile's current value, so 0 points moved. Is that "nothing moved", or is the axis listed as "held"?

**13. 1b lock-in**
"N more cups" isn't accurate: a cup that doesn't note the lagging axis doesn't count towards it. Proposal:
> **Body needs 3 more notes to lock in.**
- With a tie: "Body and Roast need 3 more notes each."
- At 1: "1 more note".

This depends on the un-lock question in §1.

**14. Save failure**: no conditions were given beyond today's alert. Proposal, using 5d's error vocabulary in place, with no new values:
- Title: **Couldn't save this cup**
- Line: **Your phone couldn't store it. Everything you entered is still here — try again.**
- Action: **Try again** (primary).

What's missing from the conditions: whether a failed save can be retried indefinitely, and what happens if the user closes the screen. With no drafts, the cup is lost.

---

## 4. Item 15, 3c's Bean name error

**Within the existing set.** The label and underline use `state.error.text` (#8A4602) and `state.error.border` (#9E5202) as 2px solid. These are the field's own underline weight, recoloured. No new value.
- What's new is the *application*. 5d marks errors on FieldRows and the rating card, never on an underlined text input. That's a new use, not a new token, and §9 should say so when it's written.

---

## 5. Ready to draw once §1 is answered
- **7**: the photo placeholder. One drawing on `surface.mutedStrong`, square, scaling from 40 to 210.
- **8**: the Taste DNA card with empty axes.
- **9**: the Taste DNA card with nothing noted.
- **1, 2, 6**: after the contradictions are settled.
- **Icons**: "all icons" is in scope, but there's no list. Please send which glyphs V1 needs, or I'll inventory them from the boards.
