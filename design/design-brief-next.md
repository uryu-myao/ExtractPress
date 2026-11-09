# Design brief — next round (collecting; not sent yet)

Items for Design's next brief, gathered as they come. Only what Design has not answered stays here: an item leaves this file in the commit that builds its answer (`ways-of-working.md`, "Before sending a brief"). Cleaned 2026-10-23: everything answered in Rounds 1–12 was removed (the items Design answered twice in Round 12 came from here). Cleaned 2026-10-28: Design's Round 15 addendum answered every item collected after Round 15.

Cleaned 2026-10-30: Round 16 (`design-brief-round-16.md`) answered every item collected since Round 15; they were built the same day.

Sent 2026-10-30: the café report went out in Round 17 (`design-brief-round-17.md`) with 8g.

Sent 2026-11-01: the photo questions, search sheets' Back / ✓, and 2b's same-name groups went out in Round 19 (`design-brief-round-19.md`).

2026-11-08: the two items below are in the Round 23 draft (`design-brief-round-23.md`, C), which waits for the planner's review before it is sent. They stay here until answered.

## 3c's photo slot is built solid, not dashed (2026-11-01; drift D-63)

3c draws the photo slot (76 square, camera and "Photo") in a 2px dashed `#6B5D55` frame. §8 keeps dashed for "empty or not started" and never for "press this", and the slot is a button (it opens the camera / library sheet, Round 19 A4), so it is built with a solid 2px ink frame on the ground colour. Once a photo is chosen, the square shows the styled copy and the title reads "Bag photo" (ours). Confirm, or redraw.



## Bags counts every bag added, not only bags across my cups (2026-11-06, Uryu)

Overturns Round 21's 23c rule for Bags ("distinct bags across my cups"). **Why the old rule no longer holds**: someone who has just added a sealed bag thinks "I have two bags", and Home said 1. "Bags" without a qualifier reads as the bags you have had, and 6a already counted it that way (Round 11, D5: "counting every bag ever added"). When build question 7 said "6a and Home count the same things", the two still counted Bags differently; now both use one rule (`countBags`):
- every bag in the app: sealed, open or finished;
- plus each deleted bag my cups still name, by its copied bean name + roaster + roast date (your build-question 3 key).

A bag deleted before any cup used it is gone from the count. Home and 6a re-read on any shelf change, so a new bag shows at once. Confirm, or say what the stat should mean.

## 3c on the first cup: a line saying the rest can wait (2026-11-09, Uryu)

Uryu: a first cup that also needs a bag shouldn't feel like a long form, so 3c tells the user the bag can be finished later. Built (ours, not drawn):
- **When**: 3c is pushed from the Record sheet and no cup has been logged yet. From Home / My beans, or from the second cup on, it doesn't show.
- **Where**: over the form card, `gap.section` (12) above it, at the gutter.
- **Copy**: "Just the name is needed for now. The rest can be added or changed any time in My beans." `body`, `text.secondary`.

Confirm or redraw: the copy, the place (over the card, or under the name field, or by the buttons), and the condition (first cup only, or every time 3c is opened from the Record sheet).
