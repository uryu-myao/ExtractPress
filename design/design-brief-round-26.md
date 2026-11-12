# Design brief — Round 26 (2026-11-11)

Round 26 · after Round 25 (27a / 27b, answered 2026-11-10)

**Status: answered 2026-11-11** (`design-response-next.md`, Round 26; boards 28a–28g in `ExtractPress-design.dc.html`, Turn 27). Not built yet.

Reply under "Round 26" in `design-response-next.md`, numbered as in this brief. One subject: **notifications in V1, and what 8i, 7a / 7b and 6c become.**

- **A** reports decisions. No answer needed; say if one breaks a board.
- **B** asks you to draw six things.
- **C** asks three things to check or write.
- **Round 27** is announced at the end. It waits for Code.

All of this is decided. Nothing here waits for Code.

## A. Decided (Uryu, 2026-11-11)

1. **Notifications are in V1, local only.**
   - There's no backend.
   - Notices (7a / 7b) ship inside the app.
2. **8i loses three of its four items:**

   | Item | Why |
   |---|---|
   | **Nudge me to log** (Morning reminder, Time, Days: three rows) | little value, and the heaviest UI on the screen |
   | **Brewing tips** | V1 has neither the content nor a way to make it. Turned on, nothing would ever arrive |
   | **Updates & notices** | notices don't send a notification at all (A4), so there's nothing to switch |

   **Bag going stale** is the only one left.
3. **8i's defaults are all OFF.** Left ON, nobody touches them, and the permission prompt never appears. The user turns stale on, and that's when iOS asks.
4. **Adding a notice sends no local notification.**
   - A notice is only added when the app starts, so the user is already looking at the app.
   - Unread is carried by the badge on Home's bell (C1).
5. **7a's footnote goes.**
   - The footnote is "Older than 60 days is cleared automatically."
   - Notices ship with the app and are few, so after 60 days the list would be empty. Nothing is cleared automatically.
6. **No 8j (Send feedback screen).**
   - This follows from having no backend.
   - 6c's Send feedback row opens `mailto:`.
   - **Report a problem merges into Send feedback**: one row.
   - 8j can come back when there is a backend.
7. **Review on App Store and Share the app are in 6c.**
   - They're live once the App ID is fixed.
   - 6c's mock already has them, as "Rate MoreCoffee" (Support us) and "Share the app".
   - **Buy me a coffee stays in V1** (Support us, ¥300+), as drawn.
     - It is an in-app purchase: App Review requires one for tips to the developer. Apple's own sheet takes the payment (B6).
8. **Not shown in 6b / 6c in V1:**

   | Row | Where | Status |
   |---|---|---|
   | Backup (automatic) | 6b | already reported, Round 25 C2 (D-64) |
   | Account section | 6b | already reported, Round 25 C2 (D-65) |
   | Terms of use | 6c | already reported, Round 25 C2 (D-66) |
   | How adventurous | 6b | new. Follows your Round 23 B6 suggestion: V1 has nothing for it to steer |
   | Language | 6c (App section, beside Reminders) | new |

**On the boards.** Whether to delete the cut items from the mocks is your call. Marking them "Not in V1" instead of deleting keeps them as material for later, as was done for 8h.

## B. Please draw

1. **8i, reduced.**
   - The screen holds one switch (Bag going stale) and the permission line.
   - **Also decide**: does one item still earn its own screen, or does it move into 6c?
     - Today 6c's App section has "Reminders · Daily 08:00", which pointed at the removed morning reminder.
   - The permission line still says "System permission is on for MoreCoffee." (Round 23 A3). Use the new name.
2. **8i when permission is denied.**
   - The switch goes back to OFF.
   - A line says why.
   - A button opens iOS Settings.
   - Judge it against §1's rule that the reason something can't be used must show on the screen.
3. **7a, empty.**
   - With no automatic clearing, this only shows before the welcome notice is added.
   - It may never show in practice. Draw it in case.
   - **Also, 7a's sample rows**: the "Tip" rows ("One bag, three grinds", "Name a bag before you open it") and the Notice "Backups moved to nightly" are kinds of content V1 won't have. There are no Brewing tips (A2) and no automatic backup (A8). Please replace them with plausible V1 notices, or mark them as not V1.
4. **7b's action.**
   - Today's mock has a body about the café feature (Round 18 changed it to "Log your café cups"). Its CTA ("See my taste DNA") and context card ("Your profile shifted 4 days ago") still point at Taste DNA.
   - We read them as left over from the notice Round 18 replaced.
   - **Proposal**:
     - each notice carries an optional action, a label plus a destination from a fixed set;
     - the context card goes.
   - Please confirm, and draw 7b that way.
5. **6c, after the changes.**
   - Rows: Send feedback (one row), Buy me a coffee (Support us, ¥300+, as in the mock), Review on App Store, Share the app, Privacy policy, Licences, the version line ("Extract Press 1.0.0 (1)", Round 25 C3).
   - "Review on App Store" is the mock's "Rate MoreCoffee". Like the version line, it takes the new name (Round 23 A3).
   - Check that no section is left with a single row:
     - **Help & feedback** is down to one row (Send feedback) once Report a problem merges into it (A6).
     - Legal has two (Privacy policy, Licences). Support us has three.
     - With Language and Reminders gone, App could be down to one row or none (B1).
6. **Buy me a coffee, after the tap.**
   - The mock draws only 6c's row ("¥300+").
   - Please draw:
     - the choice of amounts: how many, and which;
     - what shows after a tip goes through (a thank-you);
     - what shows when the purchase is cancelled or fails.
   - Apple's sheet handles the payment itself. Draw only what comes before and after it.

## C. Please check or write

1. **4a's bell** (Home's header, right).
   - What the unread badge looks like (shape, colour, a count or a dot).
   - What the bell looks like at 0 unread.
   - The bell is also on 23b, the current Home, with no badge drawn.
2. **The stale notification's words.**
   - It comes 21 days after a bag is opened, at 9:00.
   - Please write its title and body.
   - **Don't imply a flavour peak** ("past peak", "drink now"). Stale counts from opening, not roasting, and from Round 27 the bag may have no roast date at all.
3. **6a's "· 1 stale".**
   - It's in the mock ("4 of 5 · 1 stale") but wasn't built.
   - Now that stale is being worked out, it ships too.
   - Say if the wording or the place should change.

## Round 27 (notice only)

Best-before dates. Supermarket beans print a best-before date, not a roast date, so the app will handle two kinds of bag. Round 27 will ask for:

- 3c's input;
- how the two kinds look in a bag row;
- the wording of the second kind's notification.

**It waits for Code's investigation**, so it isn't in this round.
