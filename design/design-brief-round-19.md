# Design brief — Round 19 (2026-11-01)

Round 19 · sent before Round 18's reply; independent of it

**Status**: sent 2026-11-01 (Uryu: send the photo questions without waiting; the build goes on).

Reply under "Round 19" in `design-response-next.md`, numbered as in this brief. **We are not waiting**: what is built uses our provisional version, marked PROVISIONAL, and changes when your answer comes.

**Scope reminder**: this is what Uryu needs to log coffee every day, not a version for other people.

## A. Photos: bag and gear first, in one house style (Uryu, 2026-11-01)

Photos come next, bags first (3c, then the bag page 19a once Uryu's rework of 19a / 19c lands), then gear (19c); cups later, decided separately (5a's slot would slow the 15-second log). Every photo is shown **styled**, so that side by side they agree with each other and with the app. The style is yours to set; what it must keep is below.

1. **The style.** Colours, tones, and whether there's a dither. **Condition: the words on the bag must stay readable.** A bag photo is mostly text (roaster, origin, process), and keeping what 3c has no field for is half its point: in six months "what process was that bean?" is answered by reading the photo. So:
   - **no two-level posterize**: it flattens the mid-tones, and small type goes first;
   - **duotone** (the tones kept, mapped between two colours) keeps text; a light dither over it gives a riso-print feel without costing legibility.
   - Tested on a generated label (text from 40 down to 9 pt on a 1200 px image, with Japanese): duotone in the app's ink `#273D22` and ground `#F4EDEA` with a light dither kept every line readable. Real bag photos (angle, gloss, light) are the real test; we can run yours through the same pipeline.
2. **Styled photos beside the placeholder and the 2px frames**: on Home's shelf, Gear & beans, the bag / gear pages, and later Records rows. How do they sit together?
3. **The confirm screen**: after taking or choosing a photo, the user sees it **already styled** before keeping it (showing the original, then a different picture after saving, would be a surprise). Please draw it.
4. **Camera or library**: how the choice is offered (this design has no dialogs; a bottom sheet?).
5. **Crop**: thumbnails are square. Crop to square when picking (iOS's own crop is square only), or keep the whole photo and crop only in thumbnails?
6. **Records rows**: a cup with no photo of its own: its bag's photo, or the placeholder?
7. **Replace / Remove photo**: 3e / 3g drew them (36pt; touch padded to 44 with hitSlop, gaps 19). Where do they go on 19a / 19c?
8. **The camera permission's sentence** (iOS asks once, with your words). The library needs no permission.

How it is built (for context, not a question): every photo is kept twice, the original (long side 1200 px) and the styled copy, so the style can change and every photo be re-made from its original. The style is applied on the phone (Core Image), and its numbers live in one place in the code. **The confirm screen, the camera / library choice and the permission sentence are built with our provisional versions** until you answer.

## B. Search sheets: "Back", and ✓ enters what was typed (built 2026-11-01)

On device, a drink and a product typed into their sheets were lost: the name was typed, the `Add "…"` row wasn't tapped, and "Done" closed the sheet with nothing kept. Two changes, built for every search sheet (flavours, product, café, drink):
- **The keyboard's ✓ enters the typed name**: the row with that name (ignoring case) is picked, otherwise it is added as the Add row would. A single-pick sheet then closes; the flavour sheet stays open with the field cleared.
- **"Done" became "Back"** (drift D-62). It only closes and keeps nothing typed; "Done" read as if it saved. "Done" can't simply save what was typed: "lat" typed to find Latte, then closed, would add a drink called "Lat".
Please confirm the label, or say what fits better (your 20a / 20f draw "Done").

## C. 2b: a café and a roaster with the same name (2026-10-31)

Under Group by Roaster, cafés now stand among the roasters (Round 16, B6, fixed 2026-10-31). A café and a roaster can share a name: Fuglen is both a café and the roaster of its beans. They are two groups today, both headed "Fuglen". Should they be one group, or stay two (and if two, how are they told apart)?
