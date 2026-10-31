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
 * Cups with no roaster / no brewer go last (Design Round 10, 14), named by
 * what they are: "Packaged", then "Barista". An I made it cup can have
 * neither too (a bag with no roaster; a cup logged from an empty shelf, which
 * requires no bag or gear). It is neither of those, so it keeps "No roaster"
 * / "No brewer" and comes first of the three (Uryu, 2026-10-21; Design Round
 * 11, A: OK, the same order after Z).
 *
 * Group by Roaster (Design Round 16, B6): a café is who made the cup, as a
 * roaster is who made the beans. So a Barista cup groups by its café, and
 * the café groups stand among the roaster groups by the same rule: in the
 * order of their first cup under the sort, by name under "Roaster A–Z".
 * A Barista cup with no café (logged before 2026-10-30) goes under "No
 * café", next to "No roaster"; Packaged stays last (ROASTER_TAIL).
 * Group by Brewer keeps one "Barista" group (TAIL).
 */
const TAIL = { none: 1, packaged: 2, barista: 3 };
const ROASTER_TAIL = { none: 1, noCafe: 2, packaged: 3 };
const tailKey = (cup) => (cup.mode === 'made_it' ? 'none' : cup.mode);
const TAIL_LABEL = { packaged: 'Packaged', barista: 'Barista' };
const NO_ROASTER = 'No roaster';
const NO_BREWER = 'No brewer';
const NO_CAFE = 'No café';

const byNewest = (a, b) => b.logged_at - a.logged_at || b.id - a.id;
const compareText = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' });
/** The group of a cup with no roaster / no brewer. */
const tailGroup = (cup, noneLabel) => {
  const key = tailKey(cup);
  return { key, label: TAIL_LABEL[key] ?? noneLabel };
};
/**
 * Group by Roaster's group for a cup with no roaster (Round 16, B6): a
 * Barista cup's café, which stands among the roasters (rank 0), else the
 * tail.
 */
const roasterTail = (cup) => {
  if (cup.mode === 'barista') {
    return cup.place_name
      ? { key: `c:${cup.place_name.toLowerCase()}`, label: cup.place_name, rank: 0 }
      : { key: 'noCafe', label: NO_CAFE, rank: ROASTER_TAIL.noCafe };
  }
  const { key, label } = tailGroup(cup, NO_ROASTER);
  return { key, label, rank: ROASTER_TAIL[key] };
};
/** 0 for a cup with a roaster, else its place in the tail. */
const roasterRank = (cup) => (cup.bean_roaster ? 0 : TAIL[tailKey(cup)]);

const COMPARE = {
  newest: byNewest,
  oldest: (a, b) => -byNewest(a, b),
  // Ties (and the unrated) fall back to newest first.
  rated: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || byNewest(a, b),
  // After Z: I made it with no roaster, Packaged, Barista; newest first in each.
  roaster: (a, b) => {
    if (!a.bean_roaster || !b.bean_roaster) return roasterRank(a) - roasterRank(b) || byNewest(a, b);
    return compareText(a.bean_roaster, b.bean_roaster) || byNewest(a, b);
  },
};

/**
 * The list as 2a shows it: [{ key, label, cups }]. Design Round 10, 15.
 *   - Inside a group, cups follow the sort.
 *   - Month groups always follow the date (oldest month first only under
 *     "Oldest first"); "Highest rated" orders cups inside each month only.
 *   - Other groups come in the order their first cup has under the sort;
 *     then No roaster / No brewer, Packaged, Barista (TAIL). Under Group by
 *     Roaster, cafés stand among the roasters (by name under "Roaster
 *     A–Z"), then No roaster, No café, Packaged (ROASTER_TAIL).
 *   - "None" is one group with no label.
 */
export function arrangeCups(cups, sort, group, monthFormat) {
  const sorted = [...cups].sort(COMPARE[sort]);
  if (group === 'none') return sorted.length ? [{ key: 'all', label: null, cups: sorted }] : [];

  const keyOf = {
    month: (cup) => {
      const d = new Date(cup.logged_at);
      return { key: `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`, label: monthFormat.format(d) };
    },
    method: (cup) => (cup.brew_method ? { key: `m:${cup.brew_method}`, label: cup.brew_method } : tailGroup(cup, NO_BREWER)),
    roaster: (cup) => (cup.bean_roaster ? { key: `r:${cup.bean_roaster.toLowerCase()}`, label: cup.bean_roaster } : roasterTail(cup)),
  }[group];

  const groups = new Map();
  for (const cup of sorted) {
    const { key, label, rank = TAIL[key] ?? 0 } = keyOf(cup);
    if (!groups.has(key)) groups.set(key, { key, label, rank, cups: [] });
    groups.get(key).cups.push(cup);
  }
  const list = [...groups.values()];
  if (group === 'month') {
    list.sort((a, b) => (sort === 'oldest' ? compareText(a.key, b.key) : compareText(b.key, a.key)));
  } else {
    // Map order is already "first cup under the sort"; only the tail moves
    // (a stable sort keeps the rest as they are). Under "Roaster A–Z" the
    // sort puts café cups after Z, so roasters and cafés go by name here.
    const byName = group === 'roaster' && sort === 'roaster';
    list.sort((a, b) => a.rank - b.rank || (byName && a.rank === 0 ? compareText(a.label, b.label) : 0));
  }
  return list.map(({ rank, ...g }) => g);
}
