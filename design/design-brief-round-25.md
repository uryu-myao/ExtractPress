# Design brief — Round 25 (2026-11-09)

Round 25 · after Round 24 (26a / 26b, built 2026-11-09)

**Status: sent, waiting for Design.**

Reply under "Round 25" in `design-response-next.md`, numbered as in this brief. 6b and 6c are built as far as V1 has them (2026-11-09). Two questions about Reset, one regression, and three things for your boards.

**Questions:** A1, A2. **To fix on the board:** B1. **For your information** (decided; tell us if a board should change): C1–C3.

## What was built

- **6b**: Taste DNA (How my DNA is built) and My data: Export my cups (CSV), Export everything, Restore from a backup (empty app only, 25e) and **Reset my taste DNA**, the last row, red label and glyph (Round 24), 25e's glyph, Round 12's line.
- **Reset's confirmation** (gaps 18, Round 24 §2: red secondary on top, "Keep it" under it). The copy is Uryu's and approved; it says first that nothing is deleted, because the action only looks destructive:
  - "Reset my taste DNA?"
  - "Every cup stays in Records, with its notes. Taste DNA starts again from today: only cups from now on count."
  - "Reset my taste DNA" / "Keep it"
- **No undo** (Uryu). Cups logged after a reset store a change worked out from the empty profile, so going back would leave those stored changes wrong.
- **6c**: Legal (Privacy policy, once its page exists; Licences) and the version line, "Extract Press 1.0.0 (1)".

## A. Questions

### A1. Right after a reset, the profile says what a new user's says

A reset counts only cups from that moment, so the profile is empty until the next cup with a note. Empty is the "none" state, and Home's card and 8f show the new-user line: **"Rate a cup and note one taste to start."**

Someone who just reset isn't new. They have 147 cups in Records and asked for this. The line is right about what to do, but not about who is reading it.

- **Please give the line for "empty because of a reset"**, or confirm the new-user line is fine for both.
- The app knows which case it is (`reset_at` is set), so a second line costs nothing to build.
- After the first noted cup it is Early signs, with its usual lines.

### A2. 2c on a cup logged before the reset

2c's "Feeds my taste DNA" shows the change a cup made when it was saved (the sentence and the change tags, 23g). It is stored at save and never recomputed: true when it happened.

After a reset, a cup from before it no longer counts. The change is still a fact about that day, but **the heading "Feeds my taste DNA" is no longer true.**

Ways we see (your call, or another):
1. **Change the wording** of the block for these cups.
2. **Hide the block** on cups from before the reset.
3. **Keep the record and say where it stands now**: the heading in the past tense ("Fed my taste DNA"), or one line under it saying this cup isn't in the profile now. The record stays correct, and so does the present.

**Built for now (PROVISIONAL, 3)**: "Fed my taste DNA" and, under the tags, "Logged before the reset, so it isn't in my taste DNA now." (body.sm, muted). The chevron still opens 8f.

## B. To fix on the board

### B1. 25e's Reset line is the old one

25e draws "My cups and notes stay. Only the profile is rebuilt." **Round 12 replaced it** with **"Counts from today. Older cups stay in Records."** (`design-response-next.md`, Round 12; `taste-dna.md`). The app uses Round 12's. Please bring 25e (and 6b) back to it, and draw the row red as Round 24's table says ("8g's Reset my taste DNA (and 6b's row): yes, when built"); 6b still has it brown.

## C. For your information (decided)

### C1. Export my cups (CSV) stays

25e drops it ("The row was 'Export my cups'; 'everything' now earns its name"). **Uryu keeps it**, above Export everything. They do different jobs:
- **the CSV is for reading**: one cup a row, opened in any spreadsheet;
- **the zip is for putting back**: Restore reads it, a person doesn't.

"Everything" earning its name doesn't make the CSV redundant. Whether the board changes is yours.

### C2. Rows not shown in V1

| Row | Board | Why |
|---|---|---|
| Backup ("Last saved today, 08:24" / "Not saved yet") | 6b, 25e | It names an automatic backup, and V1 has none: the row would lead nowhere. Export everything + Restore are V1's way |
| Account ("Account & sign-in", "Sign out") | 6b | V1 is on the phone only: no account |
| Terms of use | 6c | No terms of our own, so Apple's standard EULA applies |

Recorded as drift D-64 to D-66. They stay on the boards for later.

### C3. Licences: a page we made without a board (after the fact)

6c draws only the row. We built the page in the pushed screens' shape: compact header, Back, "Licences"; one opening line; then each package as shipped, name (label), "version · licence" (meta, muted) and **its licence text in full** (body.sm, secondary), split by dashed `dividerSoft` as 8g's rules. Full texts because MIT, BSD and Apache ask for the copyright notice to be kept: names alone aren't enough. 61 entries.

If you want to draw it, it is yours; nothing else waits on it.

Also: the version line is "Extract Press 1.0.0 (1)" in body.sm, the build number where 6c has a date (D-67): App Store Connect shows version and build, so a report can be matched to an upload.
