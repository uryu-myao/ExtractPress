# Design brief — Round 18 (2026-10-31)

Round 18 · responds to design-response-next.md Round 17 (How my DNA is built, 2026-10-31)

**Status**: sent 2026-10-31 (approved by Uryu, with A6–A8 and B6–B10 added after his check of what is left in V1).

Two groups. Reply under "Round 18" in `design-response-next.md`, numbered as in this brief. A is a report: say if you see a problem. B asks for answers.

**Scope reminder**: this is what Uryu needs to log coffee every day, not a version for other people.

## A. Report: 8h is not built, and My words never feeds Taste DNA (decided by Uryu, 2026-10-31)

1. **Why.** 8h counts, renames and merges the words a user writes again and again ("juicy 9 cups"). Uryu's real My words are free memos, close to a diary: reminders about the brew, and things that aren't about taste at all. There are no repeated words to count, rename or merge. So 8h isn't postponed: **its premise doesn't hold for this app.**
   - Describing the taste is the flavour tags' job. They are picked from a finite set, so they repeat and can be counted. My words is the free space beside them. The split was there from the start; 8h assumed otherwise.
   - What 8h was for is already covered:
     - finding a memo → search's WORDS tab (Round 15, a part match on My words);
     - what I keep saying → 8f's "Flavours I pick most";
     - the memo itself → 2c shows it in full.

2. **"Read my words" (old 8g) is abolished, not off.** With My words never feeding the axes, the switch would have nothing to switch, and a setting that changes nothing is worse than none. It was never built or stored. Turn 20's 8g already has no switch; the superseded 8g still draws it.

3. **8f's "What you keep saying" is not built.** It counted My words, so it went with 8h. "Flavours I pick most" carries what repeats.

4. **6a gets no "My words" heading.** Round 11, D1 gave My words its own heading "when 8h comes". 8h isn't coming, so 6a stays as built: My shelf (gear, beans), Taste DNA, My data.

5. **My words itself doesn't change.** Written on 5b, read in full on 2c, found by search. It is a supporting field: logging fast comes first, and a cup without a note loses nothing.

## A (cont.). Report: other things on the record

6. **8g's "Reset my taste DNA" is not shown, not removed.** Reset is V1.5 (`settings.reset_at` exists, nothing else), and a button with nowhere to go isn't shown. Turn 20 doesn't draw it; the superseded 8g does. When Reset is built, its line is the one you gave 6b in Round 12: "Counts from today. Older cups stay in Records." Recorded as drift D-61.

7. **11a's café address will be looked up live, not stored** (Uryu, 2026-10-31; answers Round 16, B5's open part). No `places.address` column: the address is fetched from Apple Maps by the place's id when 11a opens. B8 asks how 11a looks when it can't be fetched.

8. **Try next's 5-cup threshold is out of the code and the copy** (Uryu, 2026-10-31). Its only reason was 15b's old "At 5 cups it locks in", and lock-in is now ten notes per axis (D-47). Nothing in V1 showed it; the comments and docs that still named it as a rule now say it's undecided. It will be decided with Try next itself.

## B. Questions

1. **8g: the words line.** It now reads, under "Flavour tags nudge, sliders decide": "Your own words don't count." The "don't" reads as "not yet", as if they'll count one day. They won't, by design. **Please rewrite it** so that:
   - My words being left out reads as a division of roles, not a limit;
   - it shows the difference: tags are picked to describe the taste, My words is written to read back;
   - your call whether it stays inside "Flavour tags nudge, sliders decide" or becomes its own rule (8g would then have eight).
   Until then the line stays as it is, marked PROVISIONAL.

2. **8f: does "Flavours I pick most" still need a sub-heading?** Round 11, B gave both blocks one ("From the flavour list" / "In my own words") so the two lists couldn't be read as one. With "What you keep saying" gone, the block is alone. Built: the heading alone, no sub-heading. Confirm, or say what it needs.

3. **The mock: what to remove.** All four are yours to decide:
   - **8f**: the "What you keep saying" block (juicy 9, peach 6, …).
   - **6a**: the "My words" row under My shelf.
   - **7a / 7b**: "Taste DNA now reads your notes", "Your 31 saved words are already counted", "Turn word reading off in Profile → Taste DNA". They announce what will never ship.
   - **The superseded 8g**: its "Read my words" row (already marked as replaced by Turn 20).

4. **The 8h board itself: delete it, or keep it marked?** Our view: **keep it, marked "Not built: My words are free memos, with no repeated words to manage (2026-10-31)"**. A marked board keeps the reasoning in view if the premise ever changes (say, another user who writes in tasting words); a deleted one invites redrawing it from scratch. Your call.

5. **5b: does My words' field still say the right thing?** It is drawn as the place to put the taste into words: the eyebrow "My words" over a note field whose placeholder is "Cooled down it turned into iced tea…" (built as drawn). Uryu uses it as a free memo: notes on the brew, and things beyond the taste, close to a diary. The taste itself is described by the flavour tags. Please check:
   - whether the placeholder (and the words around the field) point at a tasting description, and so don't fit how it is used;
   - whether the field reads as optional: a cup without a note loses nothing, and logging fast comes first.
   **We change nothing now.** We'd like your reading only.

6. **8f's Last shift: the mock and the build differ.** Your Round 11, C said "'Last shift' stays a plain section with no frame. #FFF8F1 is board drift", and it is built that way: a plain section like 2c's. Turn 20's 21d still draws it in a dashed `#C8BCB4` frame on `#FFF8F1`. Recorded as drift D-60.
   - Please confirm the plain section, and fix 21d.
   - Or, if Last shift should read as set apart from the axes and the flavours: is there a way inside §8 (dashed means add or empty; no token for `#FFF8F1`)?

7. **The drink sheet's Add row isn't drawn.** 20f shows the sheet with nothing typed. Typing a name that isn't in the list gives `Add "‹typed›"` as the last row, the café sheet's Add row (20a / 20b: the + marker) without its meta ("Saved by name only" is about cafés). The name is stored as typed, spaces trimmed. Please confirm, or draw the typing state.

8. **11a: the café's address can't always be shown** (A7). Offline, or when Apple Maps doesn't answer, there is no address. Please draw that Café row. The conditions:
   - it is not an error: nothing is wrong with the cup, the address just isn't available now;
   - the café's name still shows; only the address line is missing;
   - a café typed by hand never has an address (it has no Apple Maps id).

9. **15b's Locked in copy** (only Early signs is drawn, 21e). Ours, PROVISIONAL:
   - body: "Every axis you note has 10 notes or more, so one cup no longer swings it much." / "It still moves as your taste does: recent cups count for more than old ones."
   - progress box: "From 147 cups."
   - **The first sentence can be false.** The profile stays locked when an axis is first noted after the lock (8g's 21c: Roast at 3 notes). Please write the locked sheet so it holds then too, and say what its progress box should say.

10. **5e's product copy** (design-missing 44, never answered). Ours: the empty Product row reads "Add a product" (5a's "Add a bag" pattern), and the product sheet's placeholder is "Product name". Confirm or rewrite.
