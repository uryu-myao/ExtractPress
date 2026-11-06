# Design brief — next round (collecting; not sent yet)

Items for Design's next brief, gathered as they come. Only what Design has not answered stays here: an item leaves this file in the commit that builds its answer (`ways-of-working.md`, "Before sending a brief"). Cleaned 2026-10-23: everything answered in Rounds 1–12 was removed (the items Design answered twice in Round 12 came from here). Cleaned 2026-10-28: Design's Round 15 addendum answered every item collected after Round 15.

Cleaned 2026-10-30: Round 16 (`design-brief-round-16.md`) answered every item collected since Round 15; they were built the same day.

Sent 2026-10-30: the café report went out in Round 17 (`design-brief-round-17.md`) with 8g.

## Search sheets: "Back", and ✓ enters what was typed (2026-11-01, Uryu; built)

On device, a drink and a product typed into their sheets were lost: the name was typed, the `Add "…"` row wasn't tapped, and "Done" closed the sheet with nothing kept. Two changes, built for every search sheet (flavours, product, café, drink):
- **The keyboard's ✓ enters the typed name**: the row with that name (ignoring case) is picked, otherwise it is added as the Add row would. A single-pick sheet then closes; the flavour sheet stays open with the field cleared.
- **"Done" became "Back"** (drift D-62). It only closes and keeps nothing typed; "Done" read as if it saved. "Done" can't simply save what was typed: "lat" typed to find Latte, then closed, would add a drink called "Lat".
Please confirm the label, or say what fits better (your 20a / 20f draw "Done").

## 2b: a café and a roaster with the same name (2026-10-31)

Under Group by Roaster, cafés now stand among the roasters (Round 16, B6, fixed 2026-10-31). A café and a roaster can share a name: Fuglen is both a café and the roaster of its beans. They are two groups today, both headed "Fuglen". Should they be one group, or stay two (and if two, how are they told apart)?

## Bags counts every bag added, not only bags across my cups (2026-11-06, Uryu)

Overturns Round 21's 23c rule for Bags ("distinct bags across my cups"). **Why the old rule no longer holds**: someone who has just added a sealed bag thinks "I have two bags", and Home said 1. "Bags" without a qualifier reads as the bags you have had, and 6a already counted it that way (Round 11, D5: "counting every bag ever added"). When build question 7 said "6a and Home count the same things", the two still counted Bags differently; now both use one rule (`countBags`):
- every bag in the app: sealed, open or finished;
- plus each deleted bag my cups still name, by its copied bean name + roaster + roast date (your build-question 3 key).

A bag deleted before any cup used it is gone from the count. Home and 6a re-read on any shelf change, so a new bag shows at once. Confirm, or say what the stat should mean.
