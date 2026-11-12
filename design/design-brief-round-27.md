# Design brief — Round 27 (2026-11-11)

Round 27 · after Round 26 (notifications, 6c, notices, tips; answered 2026-11-11, boards 28a–28g)

**Status: answered 2026-11-11** (`design-response-next.md`, Round 27; boards 29a–29e, Turn 28). Built 2026-11-12.

Reply under "Round 27" in `design-response-next.md`, numbered as in this brief. Two subjects: **bags with a best-before date** (A–C), and **follow-ups to Round 26** (D).

- **A** reports decisions. No answer needed; say if one breaks a board.
- **B** asks you to draw three things.
- **C** asks three things to write.
- **D** follows up Round 26: one decision, one text to polish, one typo.

## Why

Uryu found this while dogfooding. **Supermarket beans print no roast date, only a best-before date (賞味期限).** Today every freshness signal counts from the roast date, so such a bag shows nothing: no day, no state, no bar.

A best-before date can't be turned back into a roast date. Makers set it anywhere from 3 months to 2 years after roasting. So it doesn't replace the roast date; **a bag can carry either clock, or both.**

**The two clocks say different things, and the app must keep them apart:**

| | Roast date | Best-before date |
|---|---|---|
| What it is | when the beans were roasted | the maker's quality guarantee, for the sealed bag |
| What the app can say | a guide to the flavour peak: "Day 7 · drink now", resting / drink now / past peak, the bar and its peak band | how many days are left until the date, or that it has passed |
| What the app must not say | — | "drink now", "resting", "past peak", "Day N", or any peak band |

A best-before date is not a peak. Without a roast date the app doesn't know where the peak is, and must not suggest one.

## A. Decided (Uryu, 2026-11-11)

1. **Both dates can be stored on one bag.** Some specialty roasters print both.
2. **With both, the roast date drives the freshness display.** It says more. The best-before date still shows on 19a (B2).
3. **No bar for a best-before bag.** A bag has no purchase date to measure from, and a bar months long would be an empty track. Text only.
4. **Three kinds of bag will sit in one list:** roast date, best-before only, neither. A bag with neither shows what it shows today: no freshness at all.
5. **3c and 19a split the work**, as they already do (3c is the 15-second path, 19a is where a bag is tidied later):
   - **3c takes one date**: the one printed on the bag. A switch inside the date sheet says which kind it is.
   - **19a always shows two rows**: Roasted on and Best before. The second date is added here.
6. **Stale is about opening only.** 21 days after a bag is opened it goes stale, whatever dates it has (oxidation once open). A sealed bag is never stale. This is Round 26's stale notification, unchanged.
7. **A second notification: best-before.**
   - It comes 7 days before the date, at 9:00.
   - It comes for a **sealed** bag too: the guarantee is for the sealed bag.
   - If it falls within 3 days of the stale notification for the same bag, only the earlier one is sent.
   - 6c's "Bag going stale" switch (Round 26 B1, 28a) covers both. No new switch (see C3).
8. **Cups don't keep the best-before date.** 2c and the CSV are unchanged.

## B. Please draw

1. **3c's date row.**
   - Empty: a label and placeholder that tell the user **either kind of date can go in**.
   - Today's placeholder, "Add it to see when it's at its best.", doesn't hold for best-before: a best-before date doesn't say when a coffee is at its best.
   - Filled: the row shows which kind was chosen, e.g. "Roasted Apr 1" / "Best before Oct 1".
   - The date sheet with its switch between the two kinds.
   - **Our proposal for the framing**: stop asking "when was it roasted?" and ask for **the date printed on the bag**. The user is holding the bag and there's one date on it. They enter it and say which kind it is. That's what actually happens. The label and placeholder words are yours.
2. **19a: two date rows, and the status block of a best-before bag.**
   - Roasted on and Best before, always both, either one empty.
   - The status block where a roast-date bag shows "Day 7 · drink now" and the bar: what a best-before bag shows there. Days left, or past the date. No bar.
   - With both dates: the roast clock as today, and where the best-before date goes.
3. **The three kinds side by side, in the six places a bag shows freshness today:**

   | # | Place | Roast-date bag today |
   |---|---|---|
   | 1 | 19a status block (B2) | "Day 7 · drink now", the bar under it |
   | 2 | 3d / Gear & beans card | clock glyph, bar, "Day 7 · drink now" |
   | 3 | 3d's footnote | "The windows are a rough guide…", shown when any card has a bar |
   | 4 | Home's shelf row (17a / 17b) | the state word over a short bar |
   | 5 | Search results' line (18c / 18d) | "… · day 7" |
   | 6 | 5a's bag line | "Blue Bottle · day 7, drink now" |

   - The kinds must sit next to each other without looking wrong.
   - A best-before bag has no peak band anywhere.
   - A bag with neither date is in the same lists, as today.
   - Home's shelf orders bags "what to drink first" (past peak, drink now, resting, then bags without a roast date). Say where best-before bags go, if you have a view; ours is: a passed best-before date near the top, the rest by nearest date.

## C. Please write

1. **A sealed bag with a best-before date.**
   - A sealed bag shows "Sealed · clock starts when opened" today.
   - That's true of the roast clock only. **A best-before date runs whether the bag is open or not**, so the line is wrong for these bags.
   - What does a sealed best-before bag say?
2. **The best-before notification's words** (title and body).
   - Stale's are settled (Round 26 C2, 28b: "‹Bag›, open 3 weeks"). They hold for every kind of bag.
   - Best-before comes 7 days before the date. It's a different fact: "its date is close", not "it's been open a while". The words should keep the two apart.
   - No flavour peak, as with stale.
   - We send it on Round 26 C2's pattern unless you say otherwise: bags due the same morning share one notification ("2 bags …"), and a tap opens the bag's page, or My beans for several.
3. **6c's switch row covers both now.**
   - Its sub line, "21 days after a bag is opened, at 9:00" (28a), states the stale rule only.
   - With Round 27 the same switch also sends the best-before reminder, so the line would leave half of what it does unsaid.
   - Please reword the sub line, or the row, so it covers both.

## D. Follow-ups to Round 26

1. **Notice and Update: who gets which (decided, Uryu, 2026-11-11).**
   - **Notice**: everyone on that version or later, **new installs included**.
   - **Update**: only people who **updated** from an older version. A new install never gets one: for them nothing is new.
   - So **28c's "Move to a new phone" must be a Notice.** As an Update shipped with V1 it would reach nobody: there's no one updating to the first version.
   - Please relabel it on 28c. The rule is written into the code beside the notices, so a later notice gets the right kind.
2. **The welcome: please polish the words.**
   - 28c / 28d's sample, "Every note you add shapes my taste DNA.", isn't true: My words never shape taste DNA (`gaps.md` 31; Round 18 voided the same claim).
   - **Its job (Uryu)**: not how to use the app, but **what sets it apart** from other logging apps. Used as a diary, logging stops in two days.
   - **The content, as built now (PROVISIONAL; the words are yours to polish):**

     | Part | Content |
     |---|---|
     | Lead (2 sentences) | You log a cup. Extract Press works out what you like. Not a diary — the notes add up into a profile of your taste. |
     | Point 1 | **Log a cup in 15 seconds.** Rate it, and you're done. Everything else is optional — the beans, the gear, the four taste axes. |
     | Point 2 | **Your taste DNA builds itself.** Four axes — acidity, body, roast, sweetness — weighted by how you rated each cup, and by how recently you drank it. |
     | Point 3 | **It stays on your phone.** No account, no server. Your cups never leave the device. |
     | Action | **How my DNA is built** → 8g |

   - **Why not "Discover" as point 3**: V1 has almost none (Try next is a card that shows on Home now and then). Written down, people would look for it and not find it. "It stays on your phone" is a real difference, and true today.
   - **The action leads to 8g**, right after "builds itself": how it builds. **8g joins B4's fixed set of destinations** (Record a coffee, Records, My beans, 8f, 6b, 6c, and now 8g).
   - **No picture.** 7b has no image slot (7b, 28d), and the welcome reads as text alone. Say if you think it needs one.
   - **Facts to keep true while polishing:**
     - "Rate it, and you're done" holds for I made it and Packaged. A Barista cup also needs its café.
     - "Your cups never leave the device": the app never sends them, but the user's own exports, and the phone's iCloud backup, do carry them. Something like "never sent to us" stays true.
     - Point 2 matches the arithmetic (`taste-dna.md`): rating weights 0.25–3, recency halving every 90 days. Flavour tags count too, at most a third of an axis.
3. **Typo in Round 26's "For Code".** Its last line says the boards are in "Turn 10"; they're in Turn 27 (28a–28g). Nothing to redraw.
