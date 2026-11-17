// The bundled gear catalogue (src/constants/gear.json): the flat data 3a's
// tabs list and a pick copies onto a gear row. Run: npm run check:gear
import { readFileSync } from 'node:fs';
import { matchWordStart } from '../src/constants/match.js';

type Entry = { category: string; name: string; maker: string; meta: string; verify?: boolean };

const catalogue = JSON.parse(readFileSync(new URL('../src/constants/gear.json', import.meta.url), 'utf8')) as Entry[];

const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);
const fold = (s: string) => s.trim().toLocaleLowerCase('en');
const clean = (s: unknown) => typeof s === 'string' && s.length > 0 && s === s.trim() && !/\s{2}/.test(s);

// gear.js's GEAR_CATEGORIES and the schema's CHECK list, in 3a's tab order.
const CATEGORIES = ['brewer', 'grinder', 'kettle', 'scale'];
const PER_CATEGORY = 5;

// 3a draws these, so they are copied, not proposed.
const BOARD_3A = [
  ['Hario V60 02', 'Ceramic · Cone dripper'],
  ['AeroPress', 'Immersion · Pressure'],
  ['Kalita Wave 185', 'Stainless · Flat bed'],
  ['Chemex 6-cup', 'Glass · Thick filter'],
  ['Origami Dripper S', 'Ceramic · Ribbed'],
];

if (catalogue.length !== CATEGORIES.length * PER_CATEGORY) fail(`${catalogue.length} entries, expected ${CATEGORIES.length * PER_CATEGORY}`);

const names = new Set<string>();
catalogue.forEach((g, i) => {
  const at = `gear[${i}] ${JSON.stringify(g.name)}`;
  const extra = Object.keys(g).filter((k) => !['category', 'name', 'maker', 'meta', 'verify'].includes(k));
  if (extra.length) fail(`${at}: unknown keys ${extra}`);
  if (!CATEGORIES.includes(g.category)) fail(`${at}: category ${JSON.stringify(g.category)}`);
  for (const k of ['name', 'maker', 'meta'] as const) if (!clean(g[k])) fail(`${at}: ${k} ${JSON.stringify(g[k])}`);
  // The maker is the name's first word(s): what 3e's Maker field shows next to it.
  if (clean(g.name) && clean(g.maker) && !fold(g.name).startsWith(fold(g.maker))) fail(`${at}: name doesn't start with its maker ${JSON.stringify(g.maker)}`);
  // 3a's meta line: exactly two facts.
  if (typeof g.meta === 'string' && (g.meta.split(' · ').length !== 2 || g.meta.split(' · ').some((f) => !clean(f)))) fail(`${at}: meta isn't "A · B": ${JSON.stringify(g.meta)}`);
  if ('verify' in g && g.verify !== true) fail(`${at}: verify is true or absent`);
  if (names.has(fold(g.name))) fail(`${at}: twice`);
  names.add(fold(g.name));
});

// Grouped, in tab order, five each.
const order = catalogue.map((g) => CATEGORIES.indexOf(g.category));
if (order.some((c, i) => i > 0 && c < order[i - 1])) fail(`not grouped in tab order (${CATEGORIES.join(', ')})`);
for (const c of CATEGORIES) {
  const n = catalogue.filter((g) => g.category === c).length;
  if (n !== PER_CATEGORY) fail(`${c}: ${n} entries, expected ${PER_CATEGORY}`);
}

// The brewer five are 3a's, verbatim and in its order, never marked verify.
const brewers = catalogue.filter((g) => g.category === 'brewer');
BOARD_3A.forEach(([name, meta], i) => {
  const g = brewers[i];
  if (!g || g.name !== name || g.meta !== meta) fail(`brewer ${i + 1}: expected 3a's "${name}" / "${meta}", got ${JSON.stringify(g && [g.name, g.meta])}`);
  if (g?.verify) fail(`${name}: drawn on 3a, so not "verify"`);
});

// 3a's search runs the Origin sheet's matcher over these names.
{
  const cases: [string, string, [number, number] | null][] = [
    ['Hario V60 02', 'v60', [6, 3]],
    ['Hario V60 02', 'har', [0, 3]],
    ['Kalita Wave 185', 'wave', [7, 4]],
    ['Chemex 6-cup', 'cup', [9, 3]],
    ['Comandante C40', 'c4', [11, 2]],
    ['1Zpresso JX-Pro', 'pro', [12, 3]],
    ['AeroPress', 'press', null],
  ];
  for (const [name, q, want] of cases) {
    const got = matchWordStart(name, q);
    const g = got ? [got.start, got.length] : null;
    if (JSON.stringify(g) !== JSON.stringify(want)) fail(`match: "${q}" in "${name}" → ${JSON.stringify(g)}, expected ${JSON.stringify(want)}`);
  }
}

if (problems.length) {
  console.error(`check:gear FAILED (${problems.length})\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
const toVerify = catalogue.filter((g) => g.verify).length;
console.log(`check:gear OK — ${catalogue.length} entries, ${PER_CATEGORY} under each of ${CATEGORIES.join(' · ')}; brewers are 3a's; ${toVerify} marked verify.`);
