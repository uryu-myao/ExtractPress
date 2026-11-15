import { useState } from 'react';
import { View } from 'react-native';
import { PROCESS_OPTIONS, ROAST_LEVELS } from '../constants/cups';
import { flagOf } from '../constants/flags';
import { ORIGINS, originFlag, originOf, REGIONS, regionsOf } from '../constants/origins';
import { useDatabase } from '../data/DatabaseProvider';
import { listBagFacts } from '../data/repository';
import ChoiceSheet from './ChoiceSheet';
import DetailRow from './base/DetailRow';

/**
 * A bag's facts as printed on it — Roast level, Origin, Region, Process —
 * as rows in the bag form's Details, under Roaster (Uryu, 2026-11-15: one
 * Details, no separate "About the coffee" block). On 19a and 3c alike: each
 * a DetailRow (flush, no divider between: selection rows, as Profile's)
 * opening a ChoiceSheet. Origin's row shows its flag before the name.
 *
 * NONE OF THEM IS A TASTE AXIS (data-model.md "Roast is not a taste axis"):
 * a word in a list row, never in the Taste DNA card.
 *
 *   Roast level  31g's sheet: the four levels light → dark, no legend (Uryu,
 *            2026-11-15: the list's order says it), no search, no free text;
 *            Clear empties it. (32a's slider was dropped the same week.)
 *   Origin   From my bags (the origins on my bags, with counts, most first)
 *            and All origins (origins.json, A–Z); search; free text when
 *            nothing matches
 *   Region   scoped by Origin:
 *              origin set  "In ‹origin›": From my bags (regions I've used
 *                          with that origin) and Regions of ‹origin›
 *                          (regions.json, A–Z); free text always
 *              no origin   "No origin yet", a line and Choose origin first
 *                          (it swaps to the Origin sheet and comes back);
 *                          typing searches every country's regions, each
 *                          row naming its country. PICKING ONE ALSO SETS
 *                          ORIGIN: both rows change, and both count in 19a's
 *                          Save bar, so the pair never disagrees silently.
 *            Changing Origin later KEEPS the region, with no warning: a
 *            written region can be right under any country; Clear empties
 *            it. So origin and region can disagree after an edit
 *            (data-model.md: Try Next trusts origin, region is a label).
 *   Process  the five values, no search, no free text
 *
 * "From my bags" groups on trimmed, case-folded text ("Guji" and "guji" are
 * one row) and shows the spelling most bags use.
 *
 * useBagFacts({ value, onChange }) → { rows, sheets }: `rows` for the form
 * (BagForm's `facts`, under Roaster), `sheets` for the screen's root (a
 * sheet covers the screen).
 *   value     { roastLevel, origin, region, process }
 *   onChange  (patch) => void: the fields that change, e.g. { region,
 *             origin } (the screen decides when it is saved: 19a's Save bar,
 *             3c's add)
 */
const fold = (s) => s.trim().toLocaleLowerCase('en');
const PROCESS_LABEL = Object.fromEntries(PROCESS_OPTIONS.map((p) => [p.value, p.label]));
const ROAST_LABEL = Object.fromEntries(ROAST_LEVELS.map((r) => [r.value, r.label]));
const byName = (a, b) => a.label.localeCompare(b.label, 'en');
const ALL_ORIGINS = ORIGINS.map((o) => ({ key: o.name, label: o.name, aliases: o.aliases, flag: flagOf(o.iso2) }));
/** A region picked with no origin set carries its country in its key. */
const SEP = '\u0000';
const ALL_REGIONS = REGIONS.map((r) => ({ key: `${r.country}${SEP}${r.name}`, label: r.name, meta: r.country })).sort(byName);

/** The values on my bags, one row per spelling-folded value, most used first. */
function mine(values) {
  const groups = new Map();
  for (const v of values) {
    if (!v || !v.trim()) continue;
    const k = fold(v);
    const g = groups.get(k) ?? { n: 0, spellings: new Map() };
    g.n += 1;
    g.spellings.set(v, (g.spellings.get(v) ?? 0) + 1);
    groups.set(k, g);
  }
  return [...groups.values()]
    .map((g) => {
      const label = [...g.spellings].sort((a, b) => b[1] - a[1])[0][0];
      return { key: label, label, meta: `${g.n} ${g.n === 1 ? 'bag' : 'bags'}`, n: g.n };
    })
    .sort((a, b) => b.n - a.n || byName(a, b));
}

export function useBagFacts({ value, onChange }) {
  const db = useDatabase();
  const [open, setOpen] = useState(null);
  // Choose origin first: the Origin sheet, then back to Region.
  const [returnTo, setReturnTo] = useState(null);
  const [facts, setFacts] = useState([]);

  const show = (field) => {
    setOpen(field);
    listBagFacts(db).then(setFacts, (error) => console.error('[about] could not read the bags', error));
  };
  const close = () => {
    setOpen(returnTo);
    setReturnTo(null);
  };

  const origin = value.origin ?? null;
  const country = origin ? (originOf(origin)?.name ?? origin) : null;

  const originSheet = {
    title: 'Origin',
    // Flags in the sheet's lists only (the row on 19a shows the name alone).
    flags: true,
    search: { placeholder: 'Search countries' },
    sections: [
      { label: 'From my bags', items: mine(facts.map((f) => f.origin)).map((i) => ({ ...i, flag: originFlag(i.label) })) },
      { label: 'All origins', items: ALL_ORIGINS },
    ],
    selected: origin,
    free: { mode: 'noMatch', noMatch: (t) => `No country called “${t}”.` },
    onPick: (next) => onChange({ origin: next }),
    onClear: () => onChange({ origin: null }),
  };

  const regionSheet = origin
    ? {
        title: 'Region',
        scope: `In ${origin}`,
        search: { placeholder: `Search regions in ${origin}` },
        sections: [
          { label: 'From my bags', items: mine(facts.filter((f) => f.origin && fold(f.origin) === fold(origin)).map((f) => f.region)) },
          { label: `Regions of ${origin}`, items: regionsOf(country).map((r) => ({ key: r.name, label: r.name })).sort(byName) },
        ],
        selected: value.region ?? null,
        free: { mode: 'always' },
        onPick: (next) => onChange({ region: next }),
        onClear: () => onChange({ region: null }),
      }
    : {
        title: 'Region',
        scope: 'No origin yet',
        search: { placeholder: 'Search every region' },
        note: {
          text: 'Regions are listed by origin. Set one first, or search every region and the origin fills itself in.',
          action: {
            label: 'Choose origin first',
            onPress: () => {
              setReturnTo('region');
              setOpen('origin');
            },
          },
        },
        sections: [],
        pool: ALL_REGIONS,
        selected: null,
        free: { mode: 'always' },
        onPick: (key) => {
          // A listed region names its country: it sets origin too (32f).
          const [c, name] = key.includes(SEP) ? key.split(SEP) : [null, key];
          onChange(c ? { region: name, origin: c } : { region: name });
        },
        onClear: () => onChange({ region: null }),
      };

  const roastSheet = {
    title: 'Roast level',
    sections: [{ items: ROAST_LEVELS.map((r) => ({ key: r.value, label: r.label })) }],
    selected: value.roastLevel ?? null,
    onPick: (next) => onChange({ roastLevel: next }),
    onClear: () => onChange({ roastLevel: null }),
  };

  const processSheet = {
    title: 'Process',
    sections: [{ items: PROCESS_OPTIONS.map((p) => ({ key: p.value, label: p.label })) }],
    selected: value.process ?? null,
    onPick: (next) => onChange({ process: next }),
    onClear: () => onChange({ process: null }),
  };

  const factRows = [
    { field: 'roastLevel', label: 'Roast level', shown: value.roastLevel ? ROAST_LABEL[value.roastLevel] : null },
    { field: 'origin', label: 'Origin', shown: origin, flag: originFlag(origin) },
    { field: 'region', label: 'Region', shown: value.region ?? null },
    { field: 'process', label: 'Process', shown: value.process ? PROCESS_LABEL[value.process] : null },
  ];

  const rows = (
    <View>
      {factRows.map((r) => (
        <DetailRow key={r.field} label={r.label} value={r.shown} flag={r.flag} flush onPress={() => show(r.field)} />
      ))}
    </View>
  );

  const sheets = (
    <>
      <ChoiceSheet visible={open === 'roastLevel'} onClose={close} {...roastSheet} />
      <ChoiceSheet visible={open === 'origin'} onClose={close} {...originSheet} />
      <ChoiceSheet visible={open === 'region'} onClose={close} {...regionSheet} />
      <ChoiceSheet visible={open === 'process'} onClose={close} {...processSheet} />
    </>
  );

  return { rows, sheets };
}
