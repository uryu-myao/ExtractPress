// Add a bag's label text candidates (src/data/labelText.ts): the fixed rules
// on Vision's lines from real bags (scripts/fixtures/label-text.json, read
// 2026-11-26 from the app's 1200 originals, language correction on), and the
// rule cases decided with Uryu the same day. Run: npm run check:labeltext
import { readFileSync } from 'node:fs';
import { LIMIT, labelCandidates, type LabelLine } from '../src/data/labelText.ts';

const fixtures = JSON.parse(readFileSync(new URL('./fixtures/label-text.json', import.meta.url), 'utf8')) as Record<string, LabelLine[]>;

const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);
const same = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b);

// What the measured bags give. The first two are the user's two values on every bag (2026-11-26).
const EXPECTED: Record<string, string[]> = {
  ogawa: ['小川珈琲店', 'フェアトレードモカブレンド', 'OGAWA', 'FAIRTRADE', 'JONA', 'ORGANIC FAIRTRADE MOCHA BLEND'],
  kaldi: ['BRAZIL', 'MONTE ALTO', 'KALDI', 'ブラジルモンテ・アルト回', 'CEFEE FARIA-', 'ライトに'],
  ok: ['OK', 'オーケー特選', 'モカブレンド', 'マイルドプレ', 'AMOCHA BLEND', 'ーオリジナル'],
  morihiko: ['AGF', '北海道珈琲店森彦', 'MORRIHIICO.', 'SSCAFE', 'AGF プレ', 'since 1996'],
};
for (const [bag, want] of Object.entries(EXPECTED)) {
  const got = labelCandidates(fixtures[bag] ?? []);
  if (!same(got, want)) fail(`${bag}: ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
}

// One line at a time: kept (true) or not.
const line = (text: string, confidence = 1, height = 0.05): LabelLine => ({ text, confidence, height });
const cases: [string, boolean, string][] = [
  ['OK', true, 'capitals only, 2 letters'],
  ['Ok', false, 'not capitals only'],
  ['ok', false, 'not capitals only'],
  ['AB', true, 'capitals only'],
  ['豆', false, 'too short'],
  ['粉140g', false, 'a measure'],
  ['NET WT. 200g', false, 'a measure'],
  ['内容量 200g', false, 'a measure'],
  ['有機エチオピア 中煎 50%', false, 'a percentage'],
  ['カカオ70％', false, 'a percentage (full-width)'],
  ['※写真はイメージです', false, 'fixed text'],
  ['EST. 1952', false, 'fixed text'],
  ['原材料名：コーヒー豆', false, 'fixed text'],
  ['まろやかな味わいです。', false, 'a sentence'],
  ['やなか珈琲店', true, 'hiragana 50 % but short'],
  ['森彦の時間', true, 'one hiragana'],
  ['みのあるマイルドな味わい', false, 'the copy: hiragana and long'],
  ['フルーティーな香りと爽やかな味わい', false, 'the copy: hiragana and long'],
  ['キリマンジャロブレンド', true, 'katakana, long'],
  ['AGF®', true, 'the mark taken off'],
];
for (const [text, keep, why] of cases) {
  const got = labelCandidates([line(text)]).length === 1;
  if (got !== keep) fail(`"${text}" ${got ? 'kept' : 'dropped'}, expected ${keep ? 'kept' : 'dropped'} (${why})`);
}
if (labelCandidates([line('AGF®')])[0] !== 'AGF') fail('"AGF®" should come back as "AGF"');

// Confidence: 0.5 stays, 0.3 goes (Vision's .accurate steps).
if (labelCandidates([line('KALDI', 0.5)]).length !== 1) fail('confidence 0.5 should stay');
if (labelCandidates([line('KALDI', 0.3)]).length !== 0) fail('confidence 0.3 should go');

// Order and count: tallest first, the same text once, at most LIMIT.
const many = Array.from({ length: 9 }, (_, i) => line(`NAME ${String.fromCharCode(65 + i)}`, 1, i / 100));
const top = labelCandidates([...many, line('name i', 1, 0.5)]);
if (top.length !== LIMIT) fail(`${top.length} candidates, expected ${LIMIT}`);
if (top[0] !== 'name i') fail(`tallest first: got ${top[0]}`);
if (top.filter((t) => t.toLowerCase() === 'name i').length !== 1) fail('the same text twice');
if (labelCandidates([]).length !== 0) fail('no lines should give no candidates');

if (problems.length) {
  console.error(`check:labeltext FAILED (${problems.length})\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
console.log(`check:labeltext OK — ${Object.keys(EXPECTED).length} measured bags give their candidates; ${cases.length} rule cases; confidence, height order, once each, at most ${LIMIT}.`);
