// Bundled origins and regions (src/constants/origins.json, regions.json):
// the flat data Origin and Region's sheets and Try Next read. Run: npm run check:origins
import { readFileSync } from 'node:fs';

type Origin = { name: string; iso2: string; aliases: string[] };
type Region = { name: string; country: string; verify?: boolean };

const read = <T,>(file: string) => JSON.parse(readFileSync(new URL(`../src/constants/${file}`, import.meta.url), 'utf8')) as T;
const origins = read<Origin[]>('origins.json');
const regions = read<Region[]>('regions.json');

const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);
const fold = (s: string) => s.trim().toLocaleLowerCase('en');
const clean = (s: unknown) => typeof s === 'string' && s.length > 0 && s === s.trim() && !/\s{2}/.test(s);

// Origins: a clean name and code each, no two the same, aliases never another's name.
if (origins.length < 60 || origins.length > 80) fail(`origins: ${origins.length} entries, expected 60–80`);
const names = new Map<string, string>();
const codes = new Set<string>();
origins.forEach((o, i) => {
  const keys = Object.keys(o).sort().join();
  if (keys !== 'aliases,iso2,name') fail(`origins[${i}]: keys ${keys}`);
  if (!clean(o.name)) fail(`origins[${i}]: name ${JSON.stringify(o.name)}`);
  if (!/^[A-Z]{2}$/.test(o.iso2)) fail(`${o.name}: iso2 ${JSON.stringify(o.iso2)}`);
  if (codes.has(o.iso2)) fail(`${o.name}: iso2 ${o.iso2} twice`);
  codes.add(o.iso2);
  if (!Array.isArray(o.aliases)) fail(`${o.name}: aliases is not a list`);
  for (const n of [o.name, ...(o.aliases ?? [])]) {
    if (!clean(n)) fail(`${o.name}: alias ${JSON.stringify(n)}`);
    const owner = names.get(fold(n));
    if (owner) fail(`"${n}" names both ${owner} and ${o.name}`);
    names.set(fold(n), o.name);
  }
});
const sorted = [...origins].sort((a, b) => a.name.localeCompare(b.name, 'en'));
if (sorted.some((o, i) => o !== origins[i])) fail('origins: not A–Z by name (keep the file reviewable)');

// Regions: each under a listed country, a clean name, none twice in a country, at most 15 a country.
const countries = new Set(origins.map((o) => o.name));
const perCountry = new Map<string, Set<string>>();
regions.forEach((r, i) => {
  const extra = Object.keys(r).filter((k) => !['name', 'country', 'verify'].includes(k));
  if (extra.length) fail(`regions[${i}]: unknown keys ${extra}`);
  if (!clean(r.name)) fail(`regions[${i}]: name ${JSON.stringify(r.name)}`);
  if (!countries.has(r.country)) fail(`${r.name}: country ${JSON.stringify(r.country)} is not in origins.json`);
  if ('verify' in r && r.verify !== true) fail(`${r.name}: verify is true or absent`);
  const seen = perCountry.get(r.country) ?? new Set<string>();
  if (seen.has(fold(r.name))) fail(`${r.name}: twice under ${r.country}`);
  seen.add(fold(r.name));
  perCountry.set(r.country, seen);
});
for (const [country, set] of perCountry) if (set.size > 15) fail(`${country}: ${set.size} regions, the cap is 15`);

if (problems.length) {
  console.error(`check:origins FAILED (${problems.length})\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
const toVerify = regions.filter((r) => r.verify).length;
console.log(`check:origins OK — ${origins.length} origins (A–Z, unique names, codes and aliases); ${regions.length} regions under ${perCountry.size} of them, none twice, at most 15 a country; ${toVerify} marked verify.`);
