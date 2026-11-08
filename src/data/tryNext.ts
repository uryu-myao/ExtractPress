/**
 * Try next on V1's data (design/try-next-v1.md; Design Round 23, 25c / 25d;
 * planner, 2026-11-08). Pure: repository.ts loadTryNext reads the rows and
 * the dismissals, Home's TryNextCard draws the result.
 *
 * Four kinds, in priority order (the first kind with a suggestion wins; within
 * a kind, the strongest). No suggestion, no card. No global cup threshold:
 * each kind's own condition is its "enough data".
 *   brewer  the open bag in another brewer: the bag has 3+ rated cups in brewer
 *           A and none in brewer B (on the shelf), and B's rated cups (3+)
 *           average at least 0.75 stars more than the bag's in A
 *   bag     a bean to buy again: its cups (by the copied name + roaster) have
 *           2+ ratings averaging 4+, or a 5; the last was 30+ days ago; no
 *           unfinished bag of it is on the shelf
 *   cafe    a café to go back to: the same rule over its Barista cups
 *   tag     a word the 5-star cups share: 10+ rated cups with tags; the word
 *           is on 3+ 5-star cups and on fewer 1–2-star ones; it isn't on the
 *           open bags' cups already
 * The 0.75 / 30 days / 10 cups are the proposal's numbers, still the planner's
 * to change.
 *
 * "It changes on Monday" (planner, B3): every time condition is read as of
 * this week's Monday 00:00, so the same suggestion shows all week unless the
 * records change or it is dismissed. A dismissed suggestion never returns
 * (key, migration 7).
 *
 * Copy is Design's (Round 23): whole stars as words ("Five stars"), averages
 * to one decimal, no "your". Ours: "Last visit ‹n› weeks ago" when a café's
 * best cup wasn't its last (25d's "not since" would be untrue); the month
 * takes its year when it isn't this year's.
 */
export type TryNextCup = {
  id: number;
  logged_at: number;
  rating: number | null;
  mode: 'made_it' | 'barista' | 'packaged';
  flavours: string[];
  bag_id: number | null;
  bean_name: string | null;
  bean_roaster: string | null;
  brewer_id: number | null;
  place_id: number | null;
};
type BagRow = { id: number; name: string; roaster: string | null; opened_at: number | null; finished_at: number | null };
type GearRow = { id: number; name: string; category: string };
type PlaceRow = { id: number; name: string; lat: number | null; lng: number | null };

export type TryNextInput<B extends BagRow, G extends GearRow, P extends PlaceRow> = {
  cups: TryNextCup[];
  bags: B[];
  gear: G[];
  places: P[];
  dismissed: Set<string>;
  now: number;
};

type Base = { key: string; title: string; reason: string };
export type Suggestion<B, G, P> =
  | (Base & { kind: 'brewer'; bag: B; brewer: G })
  | (Base & { kind: 'bag'; name: string; roaster: string | null })
  | (Base & { kind: 'cafe'; place: P })
  | (Base & { kind: 'tag'; tag: string; count: number });

const DAY = 86400000;
const GAP_DAYS = 30;
const MIN_BREWER_CUPS = 3;
const MIN_BREWER_LEAD = 0.75;
const MIN_TAGGED = 10;
const MIN_TAG_CUPS = 3;

const STARS = ['', 'One star', 'Two stars', 'Three stars', 'Four stars', 'Five stars'];
const average = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const number = new Intl.NumberFormat('en-US');
const monthOnly = new Intl.DateTimeFormat('en-US', { month: 'long' });
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const norm = (s: string | null) => (s ?? '').trim().toLowerCase();

/** This week's Monday, 00:00 local. */
export function weekStart(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

const monthOf = (ms: number, now: number) => {
  const d = new Date(ms);
  return (d.getFullYear() === new Date(now).getFullYear() ? monthOnly : monthYear).format(d);
};
const weeksAgo = (ms: number, now: number) => {
  const n = Math.max(1, Math.floor((now - ms) / (7 * DAY)));
  return `${number.format(n)} ${n === 1 ? 'week' : 'weeks'} ago`;
};

/** A group of rated cups worth going back to: 2+ averaging 4+, or a 5. */
function worthIt(rated: TryNextCup[]): boolean {
  const ratings = rated.map((c) => c.rating as number);
  return (ratings.length >= 2 && mean(ratings) >= 4) || ratings.includes(5);
}

/** The best rating and the latest cup that got it. */
function best(rated: TryNextCup[]): TryNextCup {
  return rated.reduce((a, b) => ((b.rating as number) > (a.rating as number) || (b.rating === a.rating && b.logged_at > a.logged_at) ? b : a));
}

export function pickTryNext<B extends BagRow, G extends GearRow, P extends PlaceRow>(input: TryNextInput<B, G, P>): Suggestion<B, G, P> | null {
  return brewerLead(input) ?? bagLead(input) ?? cafeLead(input) ?? tagLead(input);
}

function brewerLead<B extends BagRow, G extends GearRow, P extends PlaceRow>({ cups, bags, gear, dismissed }: TryNextInput<B, G, P>) {
  const brewers = gear.filter((g) => g.category === 'brewer');
  const ratedIn = (id: number) => cups.filter((c) => c.mode === 'made_it' && c.brewer_id === id && c.rating != null);
  let found: (Suggestion<B, G, P> & { kind: 'brewer' }) | null = null;
  let lead = 0;
  for (const bag of bags.filter((b) => b.opened_at != null && b.finished_at == null)) {
    const fromBag = cups.filter((c) => c.mode === 'made_it' && c.bag_id === bag.id);
    for (const a of brewers) {
      const inA = fromBag.filter((c) => c.brewer_id === a.id && c.rating != null);
      if (inA.length < MIN_BREWER_CUPS) continue;
      const bagInA = mean(inA.map((c) => c.rating as number));
      for (const b of brewers) {
        if (b.id === a.id || fromBag.some((c) => c.brewer_id === b.id)) continue;
        const inB = ratedIn(b.id);
        if (inB.length < MIN_BREWER_CUPS) continue;
        const avgB = mean(inB.map((c) => c.rating as number));
        const key = `brewer:${bag.id}:${b.id}`;
        if (avgB - bagInA < MIN_BREWER_LEAD || avgB - bagInA <= lead || dismissed.has(key)) continue;
        lead = avgB - bagInA;
        found = {
          kind: 'brewer',
          key,
          bag,
          brewer: b,
          title: `${bag.name} in the ${b.name}?`,
          reason: `${b.name} cups average ${average.format(avgB)} stars. ${bag.name} in the ${a.name}: ${average.format(bagInA)}.`,
        };
      }
    }
  }
  return found;
}

function bagLead<B extends BagRow, G extends GearRow, P extends PlaceRow>({ cups, bags, dismissed, now }: TryNextInput<B, G, P>) {
  const cutoff = weekStart(now) - GAP_DAYS * DAY;
  const onShelf = new Set(bags.filter((b) => b.finished_at == null).map((b) => `${norm(b.name)}\u001f${norm(b.roaster)}`));
  const groups = new Map<string, TryNextCup[]>();
  for (const c of cups) {
    if (c.mode !== 'made_it' || !c.bean_name) continue;
    const id = `${norm(c.bean_name)}\u001f${norm(c.bean_roaster)}`;
    groups.set(id, [...(groups.get(id) ?? []), c]);
  }
  let found: (Suggestion<B, G, P> & { kind: 'bag' }) | null = null;
  let score = 0;
  for (const [id, group] of groups) {
    const rated = group.filter((c) => c.rating != null);
    const last = group.reduce((a, b) => (b.logged_at > a.logged_at ? b : a));
    const key = `bag:${id}`;
    if (!rated.length || !worthIt(rated) || last.logged_at > cutoff || onShelf.has(id) || dismissed.has(key)) continue;
    const top = best(rated);
    const s = mean(rated.map((c) => c.rating as number)) * 100 + rated.length;
    if (s <= score) continue;
    score = s;
    found = {
      kind: 'bag',
      key,
      name: last.bean_name as string,
      roaster: last.bean_roaster,
      title: `${last.bean_name}, again?`,
      reason: `${STARS[top.rating as number]} in ${monthOf(top.logged_at, now)}. Last brewed ${weeksAgo(last.logged_at, now)}.`,
    };
  }
  return found;
}

function cafeLead<B extends BagRow, G extends GearRow, P extends PlaceRow>({ cups, places, dismissed, now }: TryNextInput<B, G, P>) {
  const cutoff = weekStart(now) - GAP_DAYS * DAY;
  let found: (Suggestion<B, G, P> & { kind: 'cafe' }) | null = null;
  let score = 0;
  for (const place of places) {
    const here = cups.filter((c) => c.mode === 'barista' && c.place_id === place.id);
    const rated = here.filter((c) => c.rating != null);
    const key = `cafe:${place.id}`;
    if (!rated.length || !worthIt(rated) || dismissed.has(key)) continue;
    const last = here.reduce((a, b) => (b.logged_at > a.logged_at ? b : a));
    if (last.logged_at > cutoff) continue;
    const top = best(rated);
    const s = mean(rated.map((c) => c.rating as number)) * 100 + rated.length;
    if (s <= score) continue;
    score = s;
    const stars = `${STARS[top.rating as number]} in ${monthOf(top.logged_at, now)}`;
    found = {
      kind: 'cafe',
      key,
      place,
      title: `Back to ${place.name}?`,
      reason: top.id === last.id ? `${stars}, not since.` : `${stars}. Last visit ${weeksAgo(last.logged_at, now)}.`,
    };
  }
  return found;
}

function tagLead<B extends BagRow, G extends GearRow, P extends PlaceRow>({ cups, bags, dismissed }: TryNextInput<B, G, P>) {
  const tagged = cups.filter((c) => c.rating != null && c.flavours.length);
  if (tagged.length < MIN_TAGGED) return null;
  const open = new Set(bags.filter((b) => b.opened_at != null && b.finished_at == null).map((b) => b.id));
  const onOpenBags = new Set(cups.filter((c) => c.bag_id != null && open.has(c.bag_id)).flatMap((c) => c.flavours.map(norm)));
  const counts = new Map<string, { word: string; five: number; low: number }>();
  for (const c of tagged) {
    for (const word of new Set(c.flavours)) {
      const k = norm(word);
      const entry = counts.get(k) ?? { word, five: 0, low: 0 };
      if (c.rating === 5) entry.five += 1;
      if ((c.rating as number) <= 2) entry.low += 1;
      counts.set(k, entry);
    }
  }
  let found: (Suggestion<B, G, P> & { kind: 'tag' }) | null = null;
  for (const [k, { word, five, low }] of counts) {
    const key = `tag:${k}`;
    if (five < MIN_TAG_CUPS || low >= five || onOpenBags.has(k) || dismissed.has(key)) continue;
    if (found && (five < found.count || five === found.count)) continue;
    found = {
      kind: 'tag',
      key,
      tag: word,
      count: five,
      title: `Look for ${word}`,
      reason: `It's on ${number.format(five)} of the 5-star cups.`,
    };
  }
  return found;
}
