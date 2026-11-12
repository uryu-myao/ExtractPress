// Notices and the bags' reminders (migration 8, data/notices.ts,
// data/bagReminders.ts): who gets which notice when, and what is pending
// after any change to the shelf. node:sqlite, the real migrations.
// Run: npm run check:notices
import { DatabaseSync } from 'node:sqlite';
import { MIGRATIONS_TABLE, migrations } from '../src/data/migrations.ts';
import { compareVersions, countUnreadNotices, deliverNotices, listNotices, markAllNoticesRead, markNoticeRead, type BundledNotice } from '../src/data/notices.ts';
import { MERGE_DAYS, planBagReminders, reconcileStale, reminderText, type BagReminder, type ReminderBag } from '../src/data/bagReminders.ts';
import { bestBeforeOf, staleOf } from '../src/data/freshness.ts';
import { NOTICES, NOTICE_TARGETS } from '../src/constants/notices.js';

const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);
const same = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) fail(`${label}: got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
};

function appDb() {
  const d = new DatabaseSync(':memory:');
  d.exec(MIGRATIONS_TABLE);
  for (const m of migrations) for (const sql of m.statements) d.exec(sql);
  return {
    d,
    db: {
      all: async <T,>(sql: string, params: (string | number | null)[] = []) => d.prepare(sql).all(...params).map((r) => ({ ...r })) as T[],
      run: async (sql: string, params: (string | number | null)[] = []) => {
        d.prepare(sql).run(...params);
      },
    },
  };
}

// --- The bundled list itself.
const ids = new Set<string>();
for (const n of NOTICES as BundledNotice[]) {
  if (ids.has(n.id)) fail(`bundled notice id ${n.id} is used twice`);
  ids.add(n.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(n.date)) fail(`${n.id}: date ${n.date} is not YYYY-MM-DD`);
  if (!/^\d+\.\d+\.\d+$/.test(n.version)) fail(`${n.id}: version ${n.version} is not x.y.z`);
  if (n.action && !NOTICE_TARGETS.includes(n.action.to)) fail(`${n.id}: action leads to ${n.action.to}, not one of ${NOTICE_TARGETS}`);
  if (n.action && n.action.label.length > 22) fail(`${n.id}: action label "${n.action.label}" is over 22 characters (Round 26 B4)`);
}
if (!(NOTICES as BundledNotice[]).some((n) => n.id === 'welcome' && n.kind === 'notice')) fail('the welcome must be a notice (everyone gets it)');
for (const n of NOTICES as BundledNotice[]) if (n.kind !== 'notice' && n.kind !== 'update') fail(`${n.id}: kind ${n.kind} is neither notice nor update`);
for (const n of NOTICES as BundledNotice[]) if (n.kind === 'update' && n.version === '1.0.0') fail(`${n.id}: an update shipped with 1.0.0 reaches nobody; make it a notice`);

// --- Versions.
same('1.10.0 > 1.9.2', compareVersions('1.10.0', '1.9.2'), 1);
same('1.0 = 1.0.0', compareVersions('1.0', '1.0.0'), 0);
same('1.0.0 < 1.0.1', compareVersions('1.0.0', '1.0.1'), -1);

// --- Delivery.
const bundled: BundledNotice[] = [
  { id: 'welcome', kind: 'notice', version: '1.0.0', date: '2026-12-01', title: 'W', summary: '', body: [] },
  { id: 'cafe', kind: 'update', version: '1.1.0', date: '2027-01-10', title: 'C', summary: '', body: [] },
  { id: 'phone', kind: 'notice', version: '1.1.0', date: '2027-01-12', title: 'P', summary: '', body: [] },
  { id: 'dates', kind: 'update', version: '1.2.0', date: '2027-02-10', title: 'D', summary: '', body: [] },
  { id: 'later', kind: 'update', version: '1.3.0', date: '2027-03-10', title: 'L', summary: '', body: [] },
];
{
  const { db } = appDb();
  same('first launch on 1.0: the notices of 1.0', await deliverNotices(db, '1.0.0', bundled, 1), ['welcome']);
  same('same version again', await deliverNotices(db, '1.0.0', bundled, 2), []);
  same('1.0 → 1.2: 1.1 and 1.2\'s updates, 1.1\'s notice, not 1.3', await deliverNotices(db, '1.2.0', bundled, 3), ['cafe', 'phone', 'dates']);
  same('back to 1.1 (a dev build) delivers nothing', await deliverNotices(db, '1.1.0', bundled, 4), []);
  same('…and keeps the version', (await db.all('SELECT notices_version FROM device'))[0], { notices_version: '1.2.0' });
  same('newest first', (await listNotices(db, bundled)).map((n) => n.id), ['dates', 'phone', 'cafe', 'welcome']);
  same('four unread', await countUnreadNotices(db, bundled), 4);
  await markNoticeRead(db, 'cafe', 10);
  await markNoticeRead(db, 'cafe', 20);
  same('read once, time kept', (await listNotices(db, bundled)).find((n) => n.id === 'cafe')?.read_at, 10);
  await markAllNoticesRead(db, 30);
  same('mark all read', await countUnreadNotices(db, bundled), 0);
  same('a notice no longer bundled is left out', (await listNotices(db, bundled.slice(1))).map((n) => n.id), ['dates', 'phone', 'cafe']);
}
{
  const { db } = appDb();
  same('new install on 1.2: every notice up to 1.2, no update', await deliverNotices(db, '1.2.0', bundled, 1), ['welcome', 'phone']);
  same('…then 1.3 brings 1.3\'s update', await deliverNotices(db, '1.3.0', bundled, 2), ['later']);
}
{
  const { db } = appDb();
  same('an update shipped with 1.0.0 reaches nobody', await deliverNotices(db, '1.0.0', [{ ...bundled[1], version: '1.0.0' }], 1), []);
}

// --- Stale and best-before.
const day = (y: number, m: number, d: number, h = 0) => new Date(y, m - 1, d, h).getTime();
const now = day(2026, 11, 11, 12);
same('opened 21 days ago is stale', staleOf(day(2026, 10, 21, 8), now), { daysOpen: 21, stale: true });
same('opened 20 days ago is not', staleOf(day(2026, 10, 22), now)?.stale, false);
same('sealed is never stale', staleOf(null, now), null);
same('best before today: 0 left, not passed', bestBeforeOf(day(2026, 11, 11), now), { daysLeft: 0, passed: false });
same('best before yesterday: passed', bestBeforeOf(day(2026, 11, 10), now), { daysLeft: -1, passed: true });

const bag = (id: number, b: Partial<ReminderBag>): ReminderBag => ({ id, name: `Bag ${id}`, opened_at: null, finished_at: null, best_before: null, ...b });
const at = (r: BagReminder[]) => r.map((x) => `${x.id}@${new Date(x.at).toISOString().slice(0, 13)}`);
const local9 = (y: number, m: number, d: number) => new Date(day(y, m, d, 9)).toISOString().slice(0, 13);
same(
  'opened → stale on day 21 at 9:00; sealed with best-before → 7 days before, at 9:00',
  at(planBagReminders([bag(1, { opened_at: day(2026, 11, 1, 18) }), bag(2, { best_before: day(2027, 3, 1) })], now)),
  [`bag:stale:2026-11-22@${local9(2026, 11, 22)}`, `bag:best-before:2027-02-22@${local9(2027, 2, 22)}`]
);
same('finished bags get nothing', planBagReminders([bag(1, { opened_at: day(2026, 11, 1), finished_at: now - 1 })], now), []);
same('a sealed bag with no date gets nothing', planBagReminders([bag(1, {})], now), []);
same('a moment already passed is not scheduled', planBagReminders([bag(1, { opened_at: day(2026, 10, 1) })], now), []);
same(
  `within ${MERGE_DAYS} days of each other: only the earlier`,
  at(planBagReminders([bag(1, { opened_at: day(2026, 11, 1), best_before: day(2026, 11, 30) })], now)),
  [`bag:stale:2026-11-22@${local9(2026, 11, 22)}`]
);
same(
  'further apart: both',
  planBagReminders([bag(1, { opened_at: day(2026, 11, 1), best_before: day(2026, 12, 20) })], now).map((r) => r.kind),
  ['stale', 'bestBefore']
);
same(
  'the earlier one passed, the later within 3 days: neither',
  planBagReminders([bag(1, { opened_at: day(2026, 10, 20), best_before: day(2026, 11, 20) })], now),
  []
);

// Same morning: one notification, Design Round 26 C2's words.
const guji = { opened_at: day(2026, 11, 1, 8), name: 'Ethiopia Guji' };
const morning = planBagReminders(
  [bag(1, guji), bag(2, { opened_at: day(2026, 11, 1, 19), name: 'Hoja Verde' }), bag(3, { opened_at: day(2026, 11, 2), name: 'Kenya' })],
  now
);
same('two bags opened the same day: one notification, then the next day\'s', morning.map((r) => [r.id, r.bags.map((b) => b.id)]), [
  ['bag:stale:2026-11-22', [2, 1]],
  ['bag:stale:2026-11-23', [3]],
]);
same('one bag: its name, its opening day, its page', reminderText(planBagReminders([bag(1, guji)], now)[0]), {
  title: 'Ethiopia Guji, open 3 weeks',
  body: 'Opened Nov 1. Brew it soon, or mark it finished.',
  open: { bagId: 1 },
});
same('two bags: both names, My beans', reminderText(morning[0]), {
  title: '2 bags open 3 weeks',
  body: 'Hoja Verde and Ethiopia Guji. Brew them soon, or mark them finished.',
  open: { beans: true },
});
same(
  'three or more: "and n more"',
  reminderText({ id: 'x', kind: 'stale', at: 0, bags: ['A', 'B', 'C', 'D'].map((name, i) => ({ id: i, name, openedAt: 0, bestBefore: null })) }).body,
  'A, B and 2 more. Brew them soon, or mark them finished.'
);
same('best-before, sealed: Round 27 C2', reminderText(planBagReminders([bag(4, { name: 'Colombia', best_before: day(2027, 1, 1) })], now)[0]), {
  title: 'Colombia, best before Jan 1, 2027', // another year: formatDay adds it
  body: "That's a week away, and it's still sealed. Open it soon, or mark it finished.",
  open: { bagId: 4 },
});
same(
  'best-before, opened',
  reminderText(planBagReminders([bag(5, { name: 'Special Blend', opened_at: day(2026, 12, 20), best_before: day(2027, 1, 1) })], now)[0]).body,
  "That's a week away. Brew it soon, or mark it finished."
);
same(
  'best-before, two the same morning',
  reminderText(planBagReminders([bag(5, { name: 'Special Blend', best_before: day(2027, 1, 1) }), bag(4, { name: 'Colombia', best_before: day(2027, 1, 1) })], now)[0]).title,
  '2 bags, best before next week'
);
for (const r of [...morning, ...planBagReminders([bag(4, { best_before: day(2027, 1, 1) })], now)]) {
  const { title, body } = reminderText(r);
  if (/peak|best$|drink now|past its/i.test(`${title} ${body}`)) fail(`a reminder implies a flavour peak: ${title} / ${body}`);
}

// --- Reconcile: cancels only bag reminders, schedules only with the switch on.
{
  const { d, db } = appDb();
  const pending = new Set(['bag:stale:2026-11-01', 'something-else']);
  const scheduler = {
    pending: async () => [...pending],
    cancel: async (id: string) => void pending.delete(id),
    schedule: async (r: BagReminder) => void pending.add(r.id),
  };
  d.prepare("INSERT INTO bags (id, name, opened_at) VALUES (1, 'Guji', ?)").run(day(2026, 11, 1));
  d.prepare("INSERT INTO bags (id, name, opened_at, finished_at) VALUES (2, 'Done', ?, ?)").run(day(2026, 11, 1), now);
  await reconcileStale(db, scheduler, now);
  same('switch off: every bag reminder cancelled, others kept', [...pending].sort(), ['something-else']);
  d.prepare('UPDATE device SET notify_stale = 1').run();
  await reconcileStale(db, scheduler, now);
  same('switch on: the open bag only', [...pending].sort(), ['bag:stale:2026-11-22', 'something-else']);
  d.prepare('DELETE FROM bags WHERE id = 1').run();
  await reconcileStale(db, scheduler, now);
  same('a deleted bag leaves nothing pending', [...pending].sort(), ['something-else']);
}

if (problems.length) {
  console.error(`check:notices FAILED (${problems.length})\n  - ${problems.slice(0, 30).join('\n  - ')}`);
  process.exit(1);
}
console.log("check:notices OK — bundled notices well formed; notices to everyone, updates to updaters only, skipped versions and a downgrade as ruled; read state; stale, best-before, the 3-day rule, one notification a morning with Round 26 C2's words, and reconcile.");
