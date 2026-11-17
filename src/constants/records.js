/**
 * Records' order and groups (2b): pure functions over the list listCups
 * reads. Everything runs in memory: a few hundred cups a year. Search
 * (Design Round 15) is constants/search.js.
 *
 * The sort is not remembered: each launch starts from the defaults
 * (data-model.md, V1 migration scope g).
 *
 * 2a's category chips (Round 13, E1) are gone with Round 15: search's Kind
 * chips filter by mode (18a), and 2a is the archive itself.
 */

export const SORTS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'rated', label: 'Highest rated' },
  { key: 'roaster', label: 'Roaster A–Z' },
];

export const GROUPS = [
  { value: 'month', label: 'Month' },
  { value: 'method', label: 'Brew method' },
  { value: 'roaster', label: 'Roaster' },
  { value: 'none', label: 'None' },
];

export const DEFAULT_SORT = 'newest';
export const DEFAULT_GROUP = 'month';

export const sortLabel = (key) => SORTS.find((s) => s.key === key).label;


/**
 * Cups that fit no group go at the end (handoff-records §1, 2026-11-16):
 *   By Brew method: No brewer (an I made it cup logged with no brewer), then
 *     "Made by a barista", then "Packaged".
 *   By Roaster: No roaster (an I made it cup whose bag names none), then ONE
 *     "Cafés" group for every Barista cup (each row names its café; was one
 *     group per café, Design Round 16, B6), then "Packaged".
 * "Roaster A–Z" puts its tail after Z in the same order.
 */
const TAIL = { none: 1, barista: 2, packaged: 3 };
const tailKey = (cup) => (cup.mode === 'made_it' ? 'none' : cup.mode);
const TAIL_LABEL = {
  method: { none: 'No brewer', barista: 'Made by a barista', packaged: 'Packaged' },
  roaster: { none: 'No roaster', barista: 'Cafés', packaged: 'Packaged' },
};

const byNewest = (a, b) => b.logged_at - a.logged_at || b.id - a.id;
const compareText = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' });
/** The group of a cup with no roaster / no brewer. */
const tailGroup = (cup, group) => {
  const key = tailKey(cup);
  return { key, label: TAIL_LABEL[group][key], rank: TAIL[key] };
};
/** 0 for a cup with a roaster, else its place in the tail. */
const roasterRank = (cup) => (cup.bean_roaster ? 0 : TAIL[tailKey(cup)]);

const COMPARE = {
  newest: byNewest,
  oldest: (a, b) => -byNewest(a, b),
  // Ties (and the unrated) fall back to newest first.
  rated: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || byNewest(a, b),
  // After Z: I made it with no roaster, Barista, Packaged; newest first in each.
  roaster: (a, b) => {
    if (!a.bean_roaster || !b.bean_roaster) return roasterRank(a) - roasterRank(b) || byNewest(a, b);
    return compareText(a.bean_roaster, b.bean_roaster) || byNewest(a, b);
  },
};

const pad = (n) => String(n).padStart(2, '0');
/** A cup's day on this phone's calendar, as a sortable key (months 0-based; only compared). */
export const dayKey = (time) => {
  const d = new Date(time);
  return `${d.getFullYear()}-${pad(d.getMonth())}-${pad(d.getDate())}`;
};

/**
 * A Month group's days (handoff-records §2): the gutter is written once per
 * day, so a day's cups stay together. Days follow the date (oldest first
 * only under "Oldest first"); the sort orders the cups inside each day
 * ("Highest rated" orders a day's cups, where it ordered a month's before).
 * TODO(design): §2 doesn't say how a non-date sort meets the day gutter;
 * this keeps each day whole.
 */
function daysOf(cups, sort) {
  const days = new Map();
  for (const cup of cups) {
    const key = dayKey(cup.logged_at);
    if (!days.has(key)) days.set(key, { key, time: cup.logged_at, cups: [] });
    days.get(key).cups.push(cup);
  }
  return [...days.values()].sort((a, b) => (sort === 'oldest' ? compareText(a.key, b.key) : compareText(b.key, a.key)));
}

/**
 * The list as 2a shows it: [{ key, label, cups, days? }]. Design Round 10,
 * 15; handoff-records §1.
 *   - Inside a group, cups follow the sort.
 *   - Month groups always follow the date (oldest month first only under
 *     "Oldest first"), and carry their days (daysOf); `cups` is in the
 *     days' order.
 *   - Other groups come in the order their first cup has under the sort (by
 *     each group's newest cup under Newest first, and so on); then the tail.
 *   - "None" is one group with no label.
 */
export function arrangeCups(cups, sort, group, monthFormat) {
  const sorted = [...cups].sort(COMPARE[sort]);
  if (group === 'none') return sorted.length ? [{ key: 'all', label: null, cups: sorted }] : [];

  const keyOf = {
    month: (cup) => {
      const d = new Date(cup.logged_at);
      return { key: `${d.getFullYear()}-${pad(d.getMonth())}`, label: monthFormat.format(d), rank: 0 };
    },
    method: (cup) => (cup.brew_method ? { key: `m:${cup.brew_method}`, label: cup.brew_method, rank: 0 } : tailGroup(cup, 'method')),
    roaster: (cup) =>
      cup.bean_roaster ? { key: `r:${cup.bean_roaster.toLowerCase()}`, label: cup.bean_roaster, rank: 0 } : tailGroup(cup, 'roaster'),
  }[group];

  const groups = new Map();
  for (const cup of sorted) {
    const { key, label, rank } = keyOf(cup);
    if (!groups.has(key)) groups.set(key, { key, label, rank, cups: [] });
    groups.get(key).cups.push(cup);
  }
  const list = [...groups.values()];
  if (group === 'month') {
    list.sort((a, b) => (sort === 'oldest' ? compareText(a.key, b.key) : compareText(b.key, a.key)));
    return list.map(({ rank, ...g }) => {
      const days = daysOf(g.cups, sort);
      return { ...g, cups: days.flatMap((d) => d.cups), days };
    });
  }
  // Map order is already "first cup under the sort"; only the tail moves
  // (a stable sort keeps the rest as they are).
  list.sort((a, b) => a.rank - b.rank);
  return list.map(({ rank, ...g }) => g);
}

/** Whether the list is in its default order: 2a's state strip shows only when not. */
export const isDefaultOrder = ({ sort, group }) => sort === DEFAULT_SORT && group === DEFAULT_GROUP;

const GROUP_PHRASE = { month: 'By month', method: 'By brew method', roaster: 'By roaster', none: 'Not grouped' };
const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);

/**
 * 2a's state strip (handoff-records §1): "By brew method · newest first".
 * TODO(design): §1 writes "By ‹group›"; Group by None reads "Not grouped" (ours).
 */
export const orderPhrase = ({ sort, group }) => `${GROUP_PHRASE[group]} · ${lowerFirst(sortLabel(sort))}`;
