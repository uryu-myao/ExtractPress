# V1 status (scope decided 2026-10-11)

> **This scope is what Uryu needs to log his own coffee every day. It is not a version to hand to other people.** Before any store release, Barista, Welcome, settings, Profile and the legal pages need deciding separately. **A screen marked "not now" is not "not needed"; it is "not needed at this stage".**

Scope test (2026-10-11): can Uryu use it every day himself? His cups are mostly I made it, sometimes Packaged; no café visits lately.

**In scope, in order**: 1. 3c / 3a on the compact header · 2. 5c · 3. Home's My beans / My gear + 3d (Finish bag) · 4. Packaged's minimal input (product name only; needs Design) · 5. the rest of Home (cups total, this week, recently sipped).

**In scope since 2026-10-14, after the above**: 3f (minimal: list + Reopen bag), then 3g (minimal: name, roaster, roasted on). Questions: design-missing.md 27–38.

**Not now**: 8n · 8c · 8o · 7a · 7b · 8i · 8m · 8j · 6b (except its How my DNA is built and My data rows) · 6c · 6d. Barista came in 2026-10-30 (Uryu: dogfood café cups), and 8g the same day (8f's footer led nowhere; Try next stands on it). 8h is not built at all (its premise doesn't hold, 2026-10-31). The Try next tab stays a placeholder (decided before release); Profile is 6a's upper part (2026-10-21).

**Next to fall due (recorded 2026-10-20; met: 2b and search are built and seen on device): 2b (sort) and 8l (search)**, the next deadline we set ourselves after the five-bag problem. Dogfood has a few dozen cups today, so scrolling 2a still reaches them; at two a day that is several hundred within three months, and older cups stop being reachable. Home (1b / 4a / 4b) is already done, so this is the next thing to review.

Status: **done** (built from the mock, checked on the simulator) · **partial** · **not started** · **out** (decided outside V1). "Seen on device" marks what Uryu has checked on his iPhone (Release builds since 2026-10-30).

Checked against the code 2026-11-01; Design's open questions are in `design-brief-round-18.md` (sent) and `design-brief-next.md`.

## Screens

| Screen | V1 | Status | What is there / what is missing |
|---|---|---|---|
| 5a Log a cup | yes | **done** | I made it fully; 5d's state; pickers. Packaged: the Product row (5e). Barista (2026-10-30, Design Round 16): café required, from the café sheet (my cafés, then MapKit's cafés within 1 km / 5 km once typed, Add by name; map states and no-results lines, Round 17 A1); drink pre-filled with the café's last; drink sheet. Search sheets (2026-11-01): ✓ enters the typed name, "Back" closes (D-62), what this cup added stays listed; added drinks / products in one written form. **Seen on device** (2026-11-01): the drink and product sheets' Add, ✓ and Back. Not yet: the kept names, a café cup end to end |
| 5b Tasting note | yes | **done** | axes, flavours + Search sheet, My words, three Save paths. A flavour added and unticked stays listed until the cup is saved or discarded (2026-11-01). My words: a free memo, never in Taste DNA (2026-10-31); its placeholder is asked of Design (Round 18, B5) |
| 5c Saved — what the cup changed | yes | **done** | over the steps after a save; moved axes from the stored `dna_change`; copy Design's (design-missing 12; summary Round 12; nothing-moved D-54). Try next's progress not shown (V2; its count undecided, D-47) |
| 5d Missing required fields | yes | **done** | what is required per mode: the rating; the bag and method when the shelf fills them (I made it); the café (Barista: "Which café?" / "Pick it from the map or type its name.", Round 16 A1); the product (Packaged). Copy: Round 9's two-field wording |
| 5e Packaged | **yes (minimal)** | **done** (2026-10-15) | one Product row: the name as typed (one written form since 2026-11-01), from a search sheet over past products with Add "‹typed›"; also editable in 11a. No brand (Design Round 7), container or store (`bought_at_name` exists, always empty). Migration 4. "Add a product" / "Product name" asked of Design (Round 18, B10) |
| 3c Add a bag | yes | **partial (minimal)** | name, roaster, roast date. Not: roast level, size, photo, origin / region / process, "Reuse a past bag" |
| 3a Add gear | yes | **partial (minimal)** | 8c's generic list. Not: catalogue, search, models, "Not listed" |
| Bag / gear picker (no mock) | yes | **done** | from 5a |
| 1b / 4a / 4b Home | **yes** | **done** | greeting, cups total + this week strip, Record a coffee, Taste DNA card, recently sipped (→ 2c, See all → Records), the shelf (17a / 17b, Round 14: My gear / My beans pages; rows open the bag / gear page; an empty side's add button under the first row's rule, 2026-10-30). Taste DNA card's foot row "Open my taste DNA ›" → 8f. **Shelf seen on device** (2026-10-31). Not shown: Try next box (V2), the slow-start line (dropped, Round 10 C10) |
| 2a Records | yes | **done** | the archive (Round 15): grouped list, count; rows open 2c; the search field opens search, the filter button 2b. The category chips are gone with Round 15 (search's Kind filters by mode). Pinned group headings; no rule under the header. **Seen on device** (2026-10-31) |
| 2b Sort sheet | **yes (2026-10-21)** | **done** | four sorts, four groups, Reset, Done; not remembered. Tails per Round 10 / 11 A. Group by Roaster: cafés among the roasters, then No roaster, No café, Packaged (Round 16 B6; fixed 2026-10-31). **Seen on device** (2026-10-31). Open: a café and a roaster with the same name (`design-brief-next.md`) |
| 2c Record (one cup) | **yes** (decided 2026-10-11) | **done** | the pencil opens 11a; "Feeds my taste DNA" opens 8f (D-48); no "What I logged" for Packaged or Barista (Round 7, Round 16 B4); the café's name as copied (migration 6). Share, photo, "22 clicks" / "My default brewer" not shown (gaps 32, 35, 33) |
| 11a Edit cup · 11b Delete · 11c Bag picker | **yes** (approved 2026-10-13) | **done** | bag, method, date & time, My words; "As logged" read only; delete with 11b's sheet; the date wins over the bag. The discard sheet on leaving with changes, "No bag" / "No brewer" / "No grinder", a finished own bag marked. Packaged: one Product row. Barista: café and drink (2026-10-30); a new café's name is copied (migration 6). Not built: the café's address line (live lookup decided, T-15; waits on Round 18 B8) |
| 3b / 3d → Gear & beans (17c / 17d) | **yes** | **done** | Round 14 merged 3b and 3d into Gear & beans (two pages, slot count). Round 15: rows open the gear page (19c, was 3e) and the bag page (19a, was 3g). **Seen on device** (2026-10-31). Uryu is reworking 19a / 19c's emphasis himself: not touched until his version comes |
| 3d Finish bag | **yes** | **done** | Finish bag on the bag page; no confirm and no undo (gaps 17, accepted 2026-11-01): 3f's Reopen is the recovery |
| 19a / 19c bag and gear pages · 3f Finished bags | **yes** | **done** | 19a / 19c (Round 15, Turn 19): name as title, details, freshness, the last 5 cups, "All N cups ›", "Log a cup with it ›", Finish / Delete; a Save bar after the first edit; edits to name / roaster apply to the cups already logged ("Applies to the N cups…"). 3f: list, Reopen, the 5 / 5 line, the reopened notice |
| 6a / 6b / 6c Profile | **6a upper part: yes (2026-10-21)**; 6b: two parts | **6a upper part built**; **6b's built rows seen on device** (2026-10-31); 6c not started | personal card without name / avatar / badge (6d): "Logging since" over Cups / Bags / Week streak (our rule); Taste DNA card → 8f; My shelf: My gear / My beans → Gear & beans; 6b's Taste DNA section with only "How my DNA is built" → 8g (Round 17 A4); 6b's My data: "Export my cups" (CSV) and "Export everything" (JSON, interim, T-8). Not: Edit (6d), "1 stale". No My words heading (8h is not built) |
| 6d Edit profile | not now | not started | |
| 8f My taste DNA | **yes (2026-10-21)** | **built, not yet seen on device** | stamp (ⓘ → 15b, with "How it is built" at its foot), the summary line, "From N cups · shifted N days ago" (with nothing noted, "Rate a cup and note one taste to start."), four axes with band names, "Flavours I pick most" (top 4 tags), Last shift as a plain section (Round 11 C; 21d draws a frame again, D-60, Round 18 B6), "How it is built" as the last item (Round 17). From 6a's card, 2c's "Feeds my taste DNA" and Home's card foot. Not built: "What you keep saying" (8h dropped, 2026-10-31); Try next's footer (V2) |
| 8g How my DNA is built | **yes (2026-10-30)** | **built, not yet seen on device** | Design Round 17 (21a–21e, 2026-10-31): 8g's opening lines; My numbers (per axis notes, "N more to lock in" while Early signs, tags at their limit, the cups line); seven rules in Design's words. From 8f's last item (no footer bar in V1), 6b's row on Profile, 15b's way on (Home, 8f; not 5c). Not: Read my words, Reset |
| 8n / 8c / 8o First setup | not now | not started | `settings.setup_done` ready; 8o reuses the Bag form |
| 8a / 9a / 9b Welcome | out of the token set | not started | designed separately |
| 8b / 8k Sign-in / account | held | not started | |
| 7a / 7b Notifications | not now | not started | |
| 8h My words | **not built: its premise doesn't hold** (Uryu, 2026-10-31) | — | My words are free memos with no repeated words to count, rename or merge. Its jobs are covered: finding a memo (search's Words), what repeats (8f's Flavours I pick most), the memo itself (2c). Also not built: 8f's What you keep saying, 6a's My words heading, Read my words |
| 8i Reminders · 8j Feedback · 8m Language | not now | not started | |
| 18a–18f Search (was 8l) | **yes** | **done** | Round 15: the empty state (Kind, Rating, Flavours I use most, Recent searches), hits and terms while typing, results in five tabs (ALL / CUPS / WORDS / BEANS / GEAR); Kind / Rating / bag / gear as a block (FilterToken) with the archive's shape. Recent searches stored (migration 5). **Seen on device** (2026-10-31) |
| 8d / 8e Try next | **out (V2)** | placeholder tab | |

## The four V1-path gaps

| Gap | Where it stands |
|---|---|
| **Long text** (`gaps.md` 1, 7, 15) | Applied as built: Text's truncation presets (name 2 lines, meta 1, note 3) on every new row and field. Open: Packaged product names need 2 lines (recorded); flavour chips can wrap to 3 rows (accepted). Not yet asked of Design |
| **Tap targets** (`gaps.md` 3, 19) | Chips 44 (decided); new rows (pickers, checkbox lists, fields) ≥ 44; small controls reach 44 by `hitSlop` (switch, compact chips, InlineAction, text buttons, FilterToken). gaps 19 closed 2026-11-01: the unbuilt 36pt buttons (photo, 7a) take the same |
| **Empty states** (`gaps.md` 5) | Built: 5a with an empty shelf (intro copy waits for Design), Records' "No cups logged", search's empty and no-result lines (Round 10 / 15), Taste DNA with nothing noted ("Rate a cup and note one taste to start.", Round 11 B), Home's shelf with an empty side (its add button), the café sheet with no map results (Round 17 A1). Open: a first run end to end (Home, Profile) not yet looked at as one |
| **Loading / error** (`gaps.md` 6) | Built: save failure (alert, copy undesigned), 5d, 3c's name error, add bag / gear failures (alerts), the café sheet's map states (searching, can't search, location off; Round 16 B2). Loading: none needed so far (local SQLite, instant). Open: inline input error (Design to check 3c), the save-failure copy |
