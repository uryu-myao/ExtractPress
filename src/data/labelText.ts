/**
 * Add a bag's label text candidates (Uryu's brief, 2026-11-26; decided the
 * same day on Code's measurements of 8 real bags). Vision reads the text on
 * the bag's photo (modules/photo-style readText, PhotoText.swift); this keeps
 * the lines that could be a bean name or a roaster, by fixed rules only.
 * Nothing here judges meaning, and nothing decides which is the roaster: the
 * user taps a candidate into the field they're in (a keyboard bar, shared by
 * Bean name and Roaster; its look is Design's, still to come). Never filled
 * in automatically.
 *
 * Separable by design (cut to 1.1 if not done by 2026-12-03): its own native
 * function, run beside the lift, never inside it. Removing it is this file,
 * PhotoText.swift, the module's `text` function and AddBagScreen's one hook.
 *
 * Measured (2026-11-26, macOS Vision on the app's 1200 originals):
 *   the original photo, not the cutout (the cut garbles letters at its edge:
 *   KALDI → KAIDI); language correction on (プラジル → ブラジル, and higher
 *   confidence); confidence comes back as 0.3 / 0.5 / 1.0, so 0.5 is the
 *   threshold. On those bags the user's two values were the first two
 *   candidates, in either order (Ogawa roaster first, Kaldi bean first).
 *
 * The rules, in order:
 *   confidence   below MIN_CONFIDENCE goes
 *   too short    2 characters or fewer goes, except a word in capitals only
 *                (2 or more: "OK", the supermarket's brand); "Ok" / "ok" don't
 *                count, fragments would come through
 *   a measure    once numbers with units and the words that frame them (NET
 *                WT, 内容量, 粉, 豆…) are taken out, too little is left
 *   a percentage any line with % (有機エチオピア 中煎 50%: never a name)
 *   fixed text   a line starting ※ / ＊ / *, EST. 1952, the label-law block
 *                (原材料, 賞味期限, 写真はイメージ…)
 *   a sentence   。！？ in the line
 *   the copy     more than COPY.share hiragana AND longer than COPY.length:
 *                names are short, the bag's copy is long (やなか珈琲店, 50 %
 *                but 6 characters, stays; みのあるマイルドな味わい goes)
 *   then by text height, tallest first, the same text once, LIMIT of them.
 */

/** One line as Vision read it: its text, confidence, and height as a share of the photo's. */
export type LabelLine = { text: string; confidence: number; height: number };

export const MIN_CONFIDENCE = 0.5;
export const LIMIT = 6;
const COPY = { share: 0.4, length: 8 };

const MEASURE = /\d[\d.,]*\s*(kg|ml|mL|g|ｇ|ℓ|l|円|杯|袋|本|個|kcal|cal)?/gi;
const FRAME = /(NET\s*WT\.?|内容量|税込|税抜|粉|豆|約)/gi;
const FIXED = [/^[※＊*]/, /\bEST\.?\s*\d{4}/i, /^EST\.?$/i, /品質表示|原材料|賞味期限|保存方法|製造者|販売者|名称|生産国名|焙煎度|内容量|写真はイメージ|開封後/];
const PERCENT = /[%％]/;
const SENTENCE = /[。！？]/;
const CAPITALS = /^[A-Z][A-Z\s]*[A-Z]$/;

const clean = (s: string) => s.replace(/[®™©]/g, '').replace(/\s+/g, ' ').trim();
/** Characters that count: no spaces, punctuation or symbols. */
const letters = (s: string) => Array.from(s.replace(/[\s\p{P}\p{S}]/gu, ''));
const hiraganaShare = (s: string) => {
  const cs = letters(s.replace(/\d/g, ''));
  return cs.length ? cs.filter((c) => /\p{Script=Hiragana}/u.test(c)).length / cs.length : 0;
};

export function labelCandidates(lines: LabelLine[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const kept = lines
    .map((l) => ({ ...l, text: clean(l.text) }))
    .filter((l) => {
      if (l.confidence < MIN_CONFIDENCE) return false;
      const min = CAPITALS.test(l.text) ? 2 : 3;
      if (letters(l.text).length < min) return false;
      if (letters(l.text.replace(MEASURE, '').replace(FRAME, '')).length < min) return false;
      if (PERCENT.test(l.text) || SENTENCE.test(l.text)) return false;
      if (FIXED.some((r) => r.test(l.text))) return false;
      const n = letters(l.text).length;
      if (hiraganaShare(l.text) > COPY.share && n > COPY.length) return false;
      return true;
    })
    .sort((a, b) => b.height - a.height);
  for (const l of kept) {
    const key = l.text.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(l.text);
    if (out.length === LIMIT) break;
  }
  return out;
}
