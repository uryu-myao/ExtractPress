/**
 * The notices (7a / 7b), shipped inside the app (Uryu, 2026-11-11: no
 * backend). Handled like the bundled flavour tags and drinks: the text lives
 * here, and the database only records that a notice was delivered on this
 * phone and when it was read (migration 8, data/notices.ts).
 *
 * ── CHOOSE THE KIND BY WHO SHOULD GET IT (Uryu, 2026-11-11) ──────────────
 *   'notice'  EVERYONE on this version or later, new installs included.
 *             For what is true for every user: the welcome, how to move to
 *             a new phone, a change in how the app works.
 *   'update'  ONLY people who UPDATED from an older version: what's new
 *             since the version they had. A new install never gets an
 *             update, not even this version's: for them nothing is new.
 * An 'update' whose version is the first release (1.0.0) reaches nobody.
 * If a new user should read it too, it is a 'notice'.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * When (data/notices.ts deliverNotices), on every launch:
 *   every 'notice' with version ≤ this app's, not yet delivered here;
 *   after an update, every 'update' with last version < version ≤ this one
 *   (1.0 → 1.2 delivers 1.1's too).
 * Never twice: the id is the key. Nothing is cleared automatically (Design
 * Round 26 A5). Adding one sends no local notification (A4): the user is in
 * the app when it arrives, and the bell's dot carries it.
 *
 * Each notice:
 *   id        stable, never reused (a delivered id is never delivered again)
 *   kind      'notice' | 'update' (above). 7a / 7b's badge says which
 *   version   the app version it ships with ("1.1.0")
 *   date      'YYYY-MM-DD', shown on 7a / 7b (an update's line adds its version)
 *   title     7a's row and 7b's heading
 *   summary   7a's second line while unread (one sentence)
 *   body      7b's paragraphs
 *   points    7b's list under the dashed rule, optional. A point is a string,
 *             or { lead, text }: lead set bold, then text
 *   action    7b's primary button, optional: { label, to }; `to` one of
 *             NOTICE_TARGETS, the label a verb and its object, ≤ 22 characters
 */

/**
 * Where a notice's action may lead (Design Round 26 B4, 28d: a fixed set; a
 * new destination is a new build): Record a coffee, Records, My beans, My
 * taste DNA (8f), How my DNA is built (8g; Round 27 D2), My data (6b),
 * Support & feedback (6c).
 */
export const NOTICE_TARGETS = ['record', 'records', 'beans', 'tasteDna', 'dnaBuilt', 'myData', 'support'];

/** 7a / 7b's badge: Update and Notice only (Round 26 B3; no Tip in V1). */
export const NOTICE_KIND_LABEL = { notice: 'Notice', update: 'Update' };

export const NOTICES = [
  {
    /*
     * Design Round 26 / 27 (28c, 28d; D1): moving phones. A Notice, so a new
     * install gets it too, which is exactly who needs it: before the first cup.
     * Listed before the welcome: on the same date the later entry shows first.
     */
    id: 'move-phone',
    kind: 'notice',
    version: '1.0.0',
    date: '2026-12-01',
    title: 'Move to a new phone',
    summary: 'Export everything on the old one, then Restore from a backup on the new one, before you log a cup.',
    body: ['Export everything on the old phone, then Restore from a backup on the new one, before you log a cup there. Restore only works on an empty app.'],
  },
  {
    /*
     * What sets the app apart, not how to use it (Uryu, 2026-11-11): used as
     * a diary, logging stops in two days. Words: Design Round 27 D2 (29e).
     * 7a's row shows the lead's first two sentences. The date is the planned
     * release month until the release date is known.
     */
    id: 'welcome',
    kind: 'notice',
    version: '1.0.0',
    date: '2026-12-01',
    title: 'Welcome to Extract Press',
    summary: "Log a cup, and Extract Press works out what you like. It isn't a diary.",
    body: ["Log a cup, and Extract Press works out what you like. It isn't a diary: the cups you rate and note add up to a profile of your taste."],
    points: [
      {
        lead: 'A cup in 15 seconds.',
        text: "Rate it and you're done; a café cup also needs its café. The beans, the gear and the four taste axes are there when you want them.",
      },
      {
        lead: 'Your taste DNA builds itself.',
        text: 'Acidity, body, roast and sweetness, from what you note. Cups you rated higher count for more, and recent cups count more than old ones.',
      },
      { lead: 'It stays on your phone.', text: 'No account, no server. Your cups are never sent to us.' },
    ],
    action: { label: 'How my DNA is built', to: 'dnaBuilt' },
  },
];
