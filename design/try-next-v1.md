# Try next on V1's data: a proposal (2026-11-07)

Asked by the planner on 2026-11-07, for Uryu to decide. Nothing is built. Follows `todo.md` T-14.

**Decided 2026-11-07 (planner):** no tab; a card on Home. No 8e. A condition per kind, no global threshold. The four kinds: Revisit a bag (as "buy it again", 3c prefilled), Revisit a café, the open bag in another brewer, a tag the best cups share. "Not for me" is stored in a settings column or a small table, decided when built. **Before building: show that the four kinds hold as a Home card** (below, "Does the Home card hold").

## What V1 actually records

| Where | Entered in V1 | Never entered in V1 (columns exist, no input) |
|---|---|---|
| cups | time, mode, rating (whole stars, optional), the four axes (optional), flavour tags (up to 5), My words (never read by Taste DNA); I made it: the bag (name, roaster, roasted on, copied onto the cup), brewer, grinder; Barista: the café, drink; Packaged: product name | `bean_origin`, `bean_region`, `bean_process`, `bean_roast_level`, `grind_setting`, `water_temp_c`, `ratio` |
| bags | name, roaster, roasted on, opened on, finished on, photo | `origin`, `region`, `process`, `roast_level`, `size_g` |
| gear | brewers and grinders by name | — |
| places | cafés (name, MapKit id) | — |

3c / 3g (`BagForm`) have four inputs: bean name, roaster, roasted on, opened on (and the photo). `EditBagScreen` says it: "origin, region, process and size have no inputs yet".

## The verdicts

| Suggestion | Verdict | Why |
|---|---|---|
| "Revisit ‹bag›" | **can be built** | ratings, bag identity and dates are all recorded. One correction: a bag you stopped drinking is usually *finished*, so the action is "buy it again" (Add bag to my beans, name and roaster filled in). "Rated 4.5" can't be said: V1's stars are whole. |
| "A natural process, once" | **cannot be built** (the brief said it could) | process has no input anywhere in V1: every bag's `process` and every cup's `bean_process` is empty. "You have never logged one" would be true of every process, for every user. Making it would need a Process field on 3c / 3g (Design, then build), and it would only know bags added after that. Not for V1. |
| "2°C cooler", "two clicks coarser" | cannot be built | confirmed: no temperature or grind input (T-11) |
| "A washed Kenyan" | cannot be built | confirmed: no origin / process input and no origin → axis table |
| 8e's "The plan" | cannot be built | confirmed: all three values are unrecorded |

## Others V1's data can make

1. **Revisit a café.** Barista cups have the café and a rating: "Back to Fuglen? Five stars in September, not since." Same rule as a bag, and closer to the claim than a bag is: only your own record knows it.
2. **The open bag in your other brewer.** From brewer, bag and rating: "Your AeroPress cups average 4.3; Guji in the V60 has been 3.0. Try Guji in the AeroPress." Action: Log a cup with that bag and brewer (11a / 5a can preselect gear). Needs minimum counts on both sides, or it is noise.
3. **A tag your best cups share.** From flavour tags and ratings: "Your 5-star cups say 'blackcurrant' most. Look for it on your next bag's label." A direction, not a product, as 8d intends; the user reads the label, so no bean database is needed.

Considered and dropped: a packaged product to buy again (a convenience-store can is not worth a tab); "your Chemex hasn't brewed since August" (gear, not taste); "one step darker" from the roast axis (bags' roast level is not entered, so the advice would be generic).

## What is left, and does it stand as a screen

Left: Revisit (bag, café), the other brewer, the tag lead. Four kinds, all from the user's own history. That fits the product's claim better than 8d's origin talk did.

As a **tab**, it is thin:
- **A new user sees nothing for weeks.** Revisit needs a month's gap after a good bag or café; the brewer needs two brewers and enough cups; the tag lead needs about ten rated cups. A store user in week 1 meets an empty tab, so it needs a real empty state.
- With four kinds, "Suggestions refresh every Monday" will often show the same card again.

**My view:** in V1, don't keep a tab for this. Show one card on Home when there is something to suggest, and hide the tab. If the tab stays, it needs an honest empty state that says when suggestions come ("Revisits appear once a bag you loved has been gone a month"). **Not "Coming soon"**, and not today's "This screen is being rebuilt.": App Review rejects placeholder content (Guideline 2.1, app completeness). (Uryu's decision.)

## Is 8e needed

**No.** 8e existed for "The plan" and "Your usual / The stretch". Without them, each card holds what is left: one reason line ("Five stars in March, not since") and one or two actions (Add bag to my beans, or Log a cup with it), plus "Not for me". If more is needed, link to screens that already exist: the bag's page, or search results for the café.

"Not for me" must be remembered, so V1 does need somewhere to keep it: a `settings` key holding a JSON list of dismissed suggestions, or a small table (migration 7). The brief's "no new table" holds only without dismissal.

## Thresholds: agree, one per kind

Agree with the planner: a single threshold for the feature doesn't fit, because each kind needs different data. More than that, **each kind's own condition already says "enough data"**, so no total cup count is needed:

| Kind | Shown when (proposed numbers, to be decided) |
|---|---|
| Revisit a bag | the bag has at least 2 rated cups averaging 4 or more, or one 5; its last cup was at least 30 days ago; it isn't open on the shelf now |
| Revisit a café | the same, over Barista cups at that café |
| The other brewer | the open bag has at least 3 cups with brewer A; brewer B (still on the shelf) has at least 3 rated cups averaging at least 0.75 stars more |
| A tag lead | at least 10 rated cups with tags; one tag is on at least 3 cups rated 4 or more and on fewer of the 1–2 star ones; not a tag already on the open bag's cups |

**None of these reads the Taste DNA profile**, so the risk that one axis never locks in and keeps the tab shut goes away. If V2 brings origin-based suggestions, they can wait on **the axis they talk about** reaching Locked in (10 cups), not on all four.

With no global threshold, 5c's "4 of 5 cups · One more cup and Try next opens up" and the Try next teaser (`gaps.md` 31) have nothing to count. Drop both.

## Why origin / region / process were never built

They were decided on 2026-10-09 (`components.md`, "Bag form: origin, region and process"; `design-brief-A.md`): an optional "Origin · Process" line on 3c, full fields on 3g. Process is an option set (Washed / Natural / Honey / Anaerobic). Origin is a country sheet that reuses the flavour tags' Search.

They fell out in two steps, **deferred, never rejected**:
1. **2026-10-10, stage 2**: the Bag form got two field sets, *minimal* (name, roaster, roasted on: 8o's set) and *full* (the rest, origin / region / process among them). 3c was built on the minimal set. The full set was to come "when the full 3c is built" (`components.md`, "Adding a bag and gear before the full screens exist").
2. **2026-10-11, the V1 scope** ("what Uryu needs to log his own coffee every day"): Try next went to V2. `data-model.md` calls origin / region / process "Try Next inputs", so with Try next gone they had no V1 reader, and the full set was never scheduled. 3g was built minimal on 2026-10-14 (`design-missing.md` 32: "The rest stay out").

**If V1 wants them back**, Process is the cheap one. It is already designed (one option row under Roast level), the column is copied onto cups at logging (`repository.ts`), and 2a's row already shows "roaster · process" when it is set. About half a day for 3c and 3g. Origin needs the country sheet and a bundled country list, which is a bigger job. Either one only knows bags added after it ships: Uryu's existing bags stay empty unless he edits them; a new store user would start with it. Even with Process, "A natural process, once" can still only say "you haven't logged one", not what it would do to the taste. (For the planner to decide.)

## The bar with four slots

Today: Home · Records · [+] · Try next · Profile. Five equal slots inside the gutter, the + exactly in the middle (`FooterNav`, `navigation.js`). The tab pager has four pages.

Without Try next, the tabs are Home · Records · Profile with the +. The ways to lay them out:

| | Layout | Effect |
|---|---|---|
| A | Home · Records · [+] · Profile, four equal slots | evenly spaced; the + moves right of centre (to 5/8 of the width) |
| B | Home · Records · [+] · Profile, the + kept in the middle | the left half holds two tabs, the right half one: lopsided |
| C | Home · Records · Profile · [+] | the + leaves the middle: the thumb has learned it there |

The code change is small for each: drop the entry from `TABS` and the screen map, and the bar's split (`slice(0, 2)` / `slice(2)`) changes for C. The pager drops to three pages, and swiping still moves between tabs. TryNextIcon goes unused. **The arrangement is Design's** (a new round): §9's bar text says "five slots" and "the centre +". My suggestion is A: equal spacing reads as balanced.

## Does the Home card hold (for review before building)

**One card**, under the Taste DNA card, **only when a suggestion qualifies**. No empty state on Home: when there is none, the card isn't there. One suggestion at a time.

| Kind | Title | Reason line | Actions |
|---|---|---|---|
| Revisit a bag | Hoja Verde, again? | Five stars in September. Your last cup of it was six weeks ago. | **Add it to my beans** (3c, name and roaster filled in) · Not for me |
| Revisit a café | Back to Fuglen? | Five stars in September, not since. | Not for me. **Open in Maps** is possible (the MapKit id is stored) but is a new interaction: Design's call |
| The other brewer | Guji in the AeroPress | Your AeroPress cups average 4.3 stars; Guji in the V60, 3.0. | **Log a cup** (the Record sheet with the bag and brewer preselected, which already works) · Not for me |
| A tag lead | Look for blackcurrant | It's on 4 of your 5-star cups. Check the next bag's label. | Not for me (nothing to do in the app until you buy beans) |

Copy is provisional (Design's). **Which one, when several qualify**: the other brewer first (usable today, with what you have), then a bag, then a café, then a tag. It changes on Monday, or when dismissed. A dismissed suggestion doesn't come back.

**When each first appears**, for a user logging about a cup a day and rating most:

| Kind | Earliest | Who never sees it |
|---|---|---|
| A tag lead | ~day 10–20 (about 10 rated, tagged cups) | someone who never tags |
| Revisit a café | ~day 30+ (a good visit, then a month away) | someone who doesn't go to cafés |
| Revisit a bag | ~day 45+ (a 200–250 g bag lasts 2–3 weeks, then 30 days gone) | — |
| The other brewer | as soon as there are 3 + 3 cups | someone with one brewer (many people) |

**Verdict: it holds as a card that turns up now and then, not as a fixed block.**
- In the first month most users see at most the tag lead, the weakest kind: passive, with nothing to do in the app.
- The strongest, Revisit a bag, comes after about six weeks.
- Never showing an empty card is what makes this acceptable.
- If an always-there block is wanted, four kinds aren't enough.

**What building it needs:**
- four queries in `repository.ts`;
- one card, four variants: **Design draws it**, new round;
- where "Not for me" lives: `settings` is a one-row table with typed columns, so either way it is migration 7 (a column holding JSON, or a small table);
- 3c taking a prefilled name and roaster.

About 2 days after Design's card.

