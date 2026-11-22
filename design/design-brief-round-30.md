# Design brief — Round 30 (2026-11-21)

Round 30 · after Round 29 (roast level as a slider)

**Status: sent; answered 2026-11-21 (Round 30 in `design-response-next.md`, boards 36a–36e). Built the same day, with Uryu's change: the bag step first, then gear (drift D-89–D-91).**

Reply under "Round 30" in `design-response-next.md`, numbered as in this brief. One subject: **Welcome and first setup, for V1**.

- **A** reports decisions. No answer needed; say if one breaks a board.
- **B** asks you to draw and write. Everything in B is built already with our PROVISIONAL copy and a token-only layout, so the release isn't waiting on it; your boards replace ours.

## A. Decided

1. **First setup is in V1 after all, but smaller (Uryu, 2026-11-21).** It was moved to V1.5 on 2026-11-09. Now V1 has three screens: **8a Welcome, gear (8c), bag (8o)**.
   - **8n "How do you take your coffee?" is out**, and so is **8c's "I mostly drink out"**. Nothing in V1 reads either answer: the flavour suggestions aren't reordered by coffee style, and 5a's first-cup mode doesn't come from drinks out. An answer that changes nothing is worse than no question. Both come back in V1.5, together with what reads them.
   - **No account** (8a's "I already have an account", 8b): V1 has none.
   - **No permission is asked during setup.** Notifications are asked at 8i's switch, the camera when a photo is taken. In setup, the user doesn't yet know what they'd be notified about.
2. **Restore goes into first setup.** This answers **Round 23 C3** ("Restore in first setup too?"): yes. Restore works only on an empty app. Adding gear or a bag in setup makes the app non-empty, so **Restore would be closed for good by the very first thing a new install does**, and someone moving to a new phone is the person who needs it most. So Welcome has a way to Restore **before** the gear step.
3. **Every way out marks setup done, and setup never comes back.** Finished, skipped or restored. Skipping is a choice, and repeating the question ignores it. Nothing is lost: adding gear and adding a bag are ordinary screens in the app.
   - A restored backup always counts as past setup, even one made before setup existed.
   - The notices and this phone's settings are not in a backup, so the welcome notice stays as delivered on the new phone.
4. **The gear step is 3a; the bag step is 3c.** Without "I mostly drink out", 8c is 3a (Add gear) under another title, so it **is** 3a, in a setup mode. 8o is 3c (Add a bag) the same way. One screen each to keep.
   - **The gear cap is 8, not 8c's "up to three" / "2 of 3 picked".** 8 was decided in gaps 24, and 3a / 3b / 4a / 6a all say 8.
   - **Defaults follow 3a's rule**: the first of each kind added becomes its default. That is what fills 5a's Method.
   - **8c's generic kinds (Pour-over dripper, Hand grinder…) are replaced by 3a's catalogue** (Hario V60 02, Comandante C40… in four tabs, with "Not listed — add your own").
   - **8o's three fields become 3c's whole form** (photo, date and its kind, roast level, origin…). All optional except the name, as 8o says.
   - **8o's "I'll add a bag later"** keeps D-31's name.

## B. Please draw and write

1. **8a Welcome, new.** Today's 8a is the account-era board (Morecoffee, three numbered steps, "I already have an account"). What it says:
   - **Where the app stands, not a feature list.** "Four axes", "ten cups to lock in", "15 seconds" are the welcome notice's job (B2). The screen says only what the app is.
   - **That the data never leaves the phone belongs here**: it decides whether to use the app at all, so it's part of the first impression.
   - Our PROVISIONAL copy, built:

     > EXTRACT PRESS
     >
     > You log a cup.
     > Extract Press works out what you like.
     >
     > Not a diary — the cups you rate add up into a profile of your taste. It all stays on your phone.
     >
     > [ Set up my shelf ]
     >
     > I have a backup
     >
     > Skip for now

   - **Three ways out, two levels.** One primary, **Set up my shelf** (→ gear). Two text actions: **I have a backup** (→ the file picker, then Restore's sheets, 25f / 25g) **above** **Skip for now** (→ Home). Restore goes first because someone moving phones is in more of a hurry.
   - The brand graphic of 9a / 9b (the printed extraction rings) is yours to bring in or leave out; we built none of it.
2. **The welcome notice (7b), rewritten.** Welcome now says "you rate, the app works it out", so the notice doesn't repeat it: its lead becomes **how it works**. Our PROVISIONAL copy, built:

   > **Welcome to Extract Press**
   >
   > Here's how it works.
   >
   > ---
   >
   > **Log a cup in 15 seconds.** Rate it and you're done. The beans, the gear, the four taste axes — all optional.
   >
   > **Your taste DNA builds itself.** Four axes — acidity, body, roast, sweetness — weighted by how you rated each cup, and by how recently you drank it. Ten notes on an axis and it locks in.
   >
   > **Nothing leaves your phone.** No account, no server. Your cups stay on this device.
   >
   > [ How my DNA is built ] → 8g

   Two facts to keep true when you polish it:
   - **A café cup needs its café as well as a rating** (the old copy said so). "Rate it and you're done" holds for I made it and Packaged only.
   - **"Ten notes on an axis" means ten slider notes.** Flavour words never count toward locking in (`taste-dna.md` item 4).
   - 7a's unread row needs a one-sentence summary. Ours: "Here's how it works: a cup in 15 seconds, a taste DNA that builds itself, and nothing leaves your phone."
3. **8c as 3a in setup mode.** What we built:
   - **Header**: ‹ (back to Welcome), "SETUP · 1 OF 2" in the title's place, **Skip all** at the row's end. No "N / 8 Selected" stat: Skip all takes its place, and the footer's "N slots left" keeps the count.
   - **Body**: 8c's question and line, then 3a as it is: "How do you usually brew?" / "Pick what you own now. This becomes your gear shelf — up to 8, changeable any time."
   - **Footer**: **Next**, never off: with something checked it saves, then goes to the bag; with nothing checked it just goes on. Under it, 3a's "N slots left". (8c's "2 of 3 picked" would be "2 of 8 picked"; say which you want.)
   - Please draw it, and say whether "up to 8" should be spelled "up to eight".
4. **8o as 3c in setup mode.** What we built:
   - **Header**: ‹ (back to the gear step), "SETUP · 2 OF 2", 3c's "2 / 5 On the shelf". **No Skip all** on the last step: it would do what "I'll add a bag later" does.
   - **Body**: "What's in your bag right now?" / "Your first cup gets logged against it. Only the name is needed.", then 3c's form.
   - **Footer**: **Open this bag** (primary; adds the bag, opened, and goes to Home) and **I'll add a bag later** (a text action, centred; to Home). 3c's "Add without opening" is left out: this step is the bag the first cup comes from, and only an opened bag fills 5a's Bag.
   - 8o's primary read **"Start logging"**; ours is 3c's "Open this bag", because it goes to Home, not to the Record sheet. Your call: a label, or to open the Record sheet after it.
5. **The three ways out, as a pattern.** One primary plus two text actions (8a), and one primary plus one text action (8o). Please confirm the order and spacing, or draw your own.
