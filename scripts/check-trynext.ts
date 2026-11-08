// Try next's rules (src/data/tryNext.ts, design/try-next-v1.md): each kind
// shows when its condition holds and not before, the priority order holds,
// a dismissal sticks, and time conditions read as of this week's Monday.
// Run: npm run check:trynext
import { pickTryNext, weekStart, type TryNextCup } from '../src/data/tryNext.ts';

const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);

const DAY = 86400000;
// A Wednesday, noon: this week's Monday is two and a half days before.
const now = new Date(2026, 10, 11, 12).getTime();
const monday = weekStart(now);
if (new Date(monday).getDay() !== 1 || now - monday !== 2.5 * DAY) fail(`weekStart: ${new Date(monday)}`);

let id = 0;
const cup = (over: Partial<TryNextCup>): TryNextCup => ({
  id: ++id,
  logged_at: now - 60 * DAY,
  rating: 4,
  mode: 'made_it',
  flavours: [],
  bag_id: null,
  bean_name: null,
  bean_roaster: null,
  brewer_id: null,
  place_id: null,
  ...over,
});
const bag = (id: number, name: string, over = {}) => ({ id, name, roaster: 'Fuglen', opened_at: now - 10 * DAY, finished_at: null as number | null, ...over });
const v60 = { id: 1, name: 'V60', category: 'brewer' };
const aero = { id: 2, name: 'AeroPress', category: 'brewer' };
const fuglen = { id: 1, name: 'Fuglen', lat: 59.9, lng: 10.7 };
const pick = (input: Partial<Parameters<typeof pickTryNext>[0]>) =>
  pickTryNext({ cups: [], bags: [], gear: [], places: [], dismissed: new Set(), now, ...input });

// Nothing to say: no card.
if (pick({}) !== null) fail('empty records gave a suggestion');

// 1. The other brewer.
const guji = bag(10, 'Guji');
const brewerCups = [
  ...[3, 3, 3].map((r) => cup({ rating: r, bag_id: 10, bean_name: 'Guji', bean_roaster: 'Fuglen', brewer_id: 1, logged_at: now - DAY })),
  ...[4, 5, 4].map((r) => cup({ rating: r, brewer_id: 2 })),
];
const b = pick({ cups: brewerCups, bags: [guji], gear: [v60, aero] });
if (b?.kind !== 'brewer') fail(`brewer: got ${b?.kind}`);
else {
  if (b.title !== 'Guji in the AeroPress?') fail(`brewer title: ${b.title}`);
  if (b.reason !== 'AeroPress cups average 4.3 stars. Guji in the V60: 3.0.') fail(`brewer reason: ${b.reason}`);
  if (b.key !== 'brewer:10:2') fail(`brewer key: ${b.key}`);
}
if (pick({ cups: brewerCups.slice(1), bags: [guji], gear: [v60, aero] })?.kind === 'brewer') fail('brewer: shown with only 2 cups in the first brewer');
if (pick({ cups: brewerCups, bags: [guji], gear: [v60] })?.kind === 'brewer') fail('brewer: shown with one brewer');
if (pick({ cups: brewerCups, bags: [guji], gear: [v60, aero], dismissed: new Set(['brewer:10:2']) })?.kind === 'brewer') fail('brewer: shown after dismissal');

// 2. A bag to buy again.
const hoja = [5, 4].map((r, i) => cup({ rating: r, bean_name: 'Hoja Verde', bean_roaster: 'Fuglen', logged_at: new Date(2026, 8, 10 + i).getTime() }));
const g = pick({ cups: hoja });
if (g?.kind !== 'bag') fail(`bag: got ${g?.kind}`);
else {
  if (g.title !== 'Hoja Verde, again?') fail(`bag title: ${g.title}`);
  if (!/^Five stars in September\. Last brewed \d+ weeks ago\.$/.test(g.reason)) fail(`bag reason: ${g.reason}`);
}
if (pick({ cups: hoja, bags: [bag(20, 'hoja verde ', { opened_at: null })] })?.kind === 'bag') fail('bag: shown while a sealed bag of it is on the shelf');
// 30 days before Monday, not before today: a cup 31 days before today is still too recent this week.
const recent = [cup({ rating: 5, bean_name: 'Kenya', logged_at: now - 31 * DAY })];
if (pick({ cups: recent })?.kind === 'bag') fail('bag: shown before 30 days had passed by Monday');
if (pick({ cups: [cup({ rating: 4, bean_name: 'One four' })] })?.kind === 'bag') fail('bag: a single 4 qualified');

// 3. A café.
const visits = [cup({ mode: 'barista', place_id: 1, rating: 5, logged_at: new Date(2026, 8, 20).getTime() })];
const c = pick({ cups: visits, places: [fuglen] });
if (c?.kind !== 'cafe' || c.reason !== 'Five stars in September, not since.' || c.title !== 'Back to Fuglen?') fail(`cafe: ${JSON.stringify(c && [c.title, c.reason])}`);
const later = [...visits, cup({ mode: 'barista', place_id: 1, rating: 3, logged_at: new Date(2026, 9, 1).getTime() })];
const c2 = pick({ cups: later, places: [fuglen] });
if (c2?.kind !== 'cafe' || !/^Five stars in September\. Last visit \d+ weeks ago\.$/.test(c2.reason)) fail(`cafe after a later visit: ${c2?.reason}`);

// 4. A tag lead.
const tagged = [
  ...[1, 2, 3, 4].map(() => cup({ rating: 5, flavours: ['Blackcurrant'] })),
  ...Array.from({ length: 6 }, () => cup({ rating: 3, flavours: ['Cocoa'] })),
];
const t = pick({ cups: tagged });
if (t?.kind !== 'tag' || t.title !== 'Look for Blackcurrant' || t.reason !== "It's on 4 of the 5-star cups." || t.count !== 4) fail(`tag: ${JSON.stringify(t)}`);
if (pick({ cups: tagged.slice(0, 9) }) !== null) fail('tag: shown with fewer than 10 rated, tagged cups');
const onOpen = [...tagged, cup({ rating: 4, flavours: ['blackcurrant'], bag_id: 10 })];
if (pick({ cups: onOpen, bags: [guji] })?.kind === 'tag') fail("tag: shown for a word already on the open bag's cups");

// Priority: brewer over bag over café over tag.
const all = pick({ cups: [...brewerCups, ...hoja, ...visits, ...tagged], bags: [guji], gear: [v60, aero], places: [fuglen] });
if (all?.kind !== 'brewer') fail(`priority: got ${all?.kind}, expected brewer`);
const noBrewer = pick({ cups: [...hoja, ...visits, ...tagged], places: [fuglen] });
if (noBrewer?.kind !== 'bag') fail(`priority: got ${noBrewer?.kind}, expected bag`);
const cafeFirst = pick({ cups: [...visits, ...tagged], places: [fuglen] });
if (cafeFirst?.kind !== 'cafe') fail(`priority: got ${cafeFirst?.kind}, expected cafe`);

if (problems.length) {
  console.error(`check:trynext FAILED (${problems.length})\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
console.log('check:trynext OK — four kinds, their thresholds, the priority order, dismissals and the Monday rule.');
