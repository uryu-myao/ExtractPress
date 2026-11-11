// The Licences page's list (6c): every open-source package in the shipped
// app, with its licence text, written to src/constants/licences.json.
//   - npm: the packages whose modules are in the production iOS bundle, read
//     from its source map (not package.json: dev tools and web-only packages
//     never ship, and transitive ones do).
//   - fonts: an @expo-google-fonts package's font files are OFL-1.1
//     (LICENSE_FONT), its code MIT (LICENSE): both texts.
//   - native: scripts/licences/native.json, kept by hand (React Native's
//     prebuilt C++ libraries carry no licence files). Review on RN upgrades.
// MIT, BSD and Apache ask for the copyright notice to be kept, so a name is
// not enough: the script fails if an entry's text has no "Copyright" line,
// unless native.json marks it noticeRequired: false.
// Run: npm run gen:licences (re-run after adding, removing or upgrading a
// dependency). Pass --map <file.map> to read an existing source map instead of
// exporting.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

type Entry = { name: string; version: string; licence: string; text: string };

const root = join(dirname(new URL(import.meta.url).pathname), '..');
const out = join(root, 'src/constants/licences.json');

function sourceMap(): { sources: string[] } {
  const given = process.argv.indexOf('--map');
  let file = given > 0 ? process.argv[given + 1] : null;
  if (!file) {
    const dir = mkdtempSync(join(tmpdir(), 'licences-'));
    execFileSync('npx', ['expo', 'export', '--platform', 'ios', '--source-maps', '--output-dir', dir], { cwd: root, stdio: 'inherit' });
    const js = join(dir, '_expo/static/js/ios');
    file = join(js, readdirSync(js).find((f) => f.endsWith('.map'))!);
  }
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** "/node_modules/expo/node_modules/expo-modules-core/build/x.js" → "node_modules/expo/node_modules/expo-modules-core" */
function packageDir(source: string): string | null {
  const at = source.lastIndexOf('node_modules/');
  if (at < 0) return null;
  const parts = source.slice(at + 'node_modules/'.length).split('/');
  const name = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
  return join(source.slice(0, at).replace(/^\//, ''), 'node_modules', name);
}

const LICENCE_FILE = /^licen[cs]e(\.md|\.txt)?$/i;

/**
 * Packages published from a monorepo without their own file take the repo's.
 * metro's repo LICENSE (github.com/facebook/metro) is the same MIT text, same
 * copyright line, as react-native's, and no metro package here ships it.
 */
const FALLBACK: [RegExp, string][] = [
  [/^@react-native\//, 'node_modules/react-native/LICENSE'],
  [/^metro(-|$)/, 'node_modules/react-native/LICENSE'],
];

function npmEntry(dir: string): Entry {
  const pkg = JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf8'));
  const own = readdirSync(join(root, dir)).find((f) => LICENCE_FILE.test(f));
  const fallback = FALLBACK.find(([re]) => re.test(pkg.name))?.[1];
  const file = own ? join(dir, own) : fallback;
  if (!file || !existsSync(join(root, file))) throw new Error(`${pkg.name}: no licence file`);
  let text = readFileSync(join(root, file), 'utf8').trim();
  const font = join(root, dir, 'LICENSE_FONT');
  if (existsSync(font)) text += `\n\n— The fonts —\n\n${readFileSync(font, 'utf8').trim()}`;
  return { name: pkg.name, version: pkg.version, licence: pkg.license ?? '', text };
}

const problems: string[] = [];
const entries = new Map<string, Entry>();

const dirs = new Set(sourceMap().sources.map(packageDir).filter((d): d is string => d != null));
for (const dir of dirs) {
  const entry = npmEntry(dir);
  entries.set(`${entry.name}@${entry.version}`, entry);
}
const npmCount = entries.size;

const native = JSON.parse(readFileSync(join(root, 'scripts/licences/native.json'), 'utf8'));
const exempt = new Set<string>();
for (const lib of native.libraries) {
  const text = lib.text ?? readFileSync(join(root, 'scripts/licences', lib.file), 'utf8').trim();
  entries.set(`${lib.name}@${lib.version}`, { name: lib.name, version: lib.version, licence: lib.licence, text });
  if (lib.noticeRequired === false) exempt.add(lib.name);
}

for (const e of entries.values()) {
  if (!/copyright/i.test(e.text) && !exempt.has(e.name)) problems.push(`${e.name}@${e.version}: no copyright notice in its text`);
  if (!e.licence) problems.push(`${e.name}@${e.version}: no licence name`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

const list = [...entries.values()].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
writeFileSync(out, `${JSON.stringify(list, null, 1)}\n`);
console.log(`${list.length} entries (${npmCount} npm, ${list.length - npmCount} native) → src/constants/licences.json`);
