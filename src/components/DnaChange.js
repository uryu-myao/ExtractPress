import { StyleSheet, View } from 'react-native';
import { TASTE_AXES } from '../constants/tasteAxes';
import { bandOf } from '../data/tasteDna';
import { space, spacing } from '../theme/tokens';
import Badge from './base/Badge';
import Text from './base/Text';

/**
 * What one cup changed in Taste DNA, from its stored `dna_change` (never
 * recomputed): a sentence, then one tag per axis (Design Round 21, 23e /
 * 23f). Shared by 5c and 2c's "Feeds my taste DNA". The per-axis lines
 * ("Moved N points toward ‹pole›") are gone: the tags replace them.
 *
 * Tags, in the axes' fixed order (the readouts' order), wrapping space.6
 * both ways; Badge neutral, inline, with the axis's key:
 *   moved        "‹pole label› +N": N points toward that pole, always
 *                positive (the pole carries the direction), rounded to whole
 *                points. A move that rounds to 0 gets no tag.
 *   first value  "Starts at ‹step name›", no number: a position, not a
 *                movement. A one-cup profile is that cup's value, so a step
 *                always exists.
 * Sentence:
 *   moved        "This cup pushed you ‹phrases›." — the two axes that moved
 *                most (never a first value), joined with "and" (Design Round
 *                12; Uryu kept the phrases below). Ties keep the axes' order.
 *   first only   "My taste DNA has its first ‹Axis› reading." (two or more:
 *                "…its first Roast and Sweetness readings.")
 *   nothing      "Your Taste DNA stays where it was — nothing on this cup
 *                moves it." No tags.
 */
const PHRASE = {
  acidity: { low: 'brighter', high: 'more bitter' },
  // Body and Roast both start "light": each takes its noun, or it reads
  // "lighter and lighter".
  body: { low: 'lighter-bodied', high: 'fuller-bodied' },
  roast: { low: 'toward lighter roasts', high: 'toward darker roasts' },
  sweetness: { low: 'less sweet', high: 'sweeter' },
};

const SUMMARY_AXES = 2;

export const NOTHING_MOVED = 'Your Taste DNA stays where it was — nothing on this cup moves it.';

/** "A", "A and B", "A, B and C". */
const joinAnd = (words) => (words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`);

/** [{ key, name, label, a11y, size, phrase }] in the axes' order; first values have no size. */
export function changeTags(change) {
  if (!change) return [];
  const tags = [];
  for (const axis of TASTE_AXES) {
    const before = change.before[axis.key]?.value ?? null;
    const after = change.after[axis.key]?.value ?? null;
    if (after == null) continue;
    if (before == null) {
      const label = `Starts at ${axis.steps[bandOf(after)]}`;
      tags.push({ key: axis.key, name: axis.name, label, a11y: label });
      continue;
    }
    const points = Math.round(Math.abs(after - before));
    if (points < 1) continue;
    const up = after > before;
    const pole = up ? axis.to : axis.from;
    tags.push({
      key: axis.key,
      name: axis.name,
      label: `${pole} +${points}`,
      a11y: `${points} ${points === 1 ? 'point' : 'points'} toward ${pole}`,
      size: points,
      phrase: PHRASE[axis.key][up ? 'high' : 'low'],
    });
  }
  return tags;
}

/** The sentence over the tags: what moved most, or the first readings, or nothing. */
export function changeSentence(tags) {
  const moved = tags.filter((t) => t.size).sort((a, b) => b.size - a.size);
  if (moved.length) return `This cup pushed you ${moved.slice(0, SUMMARY_AXES).map((t) => t.phrase).join(' and ')}.`;
  if (tags.length) return `My taste DNA has its first ${joinAnd(tags.map((t) => t.name))} ${tags.length === 1 ? 'reading' : 'readings'}.`;
  return NOTHING_MOVED;
}

/** The tags alone, wrapping (5c places them itself; 2c through DnaChange). */
export function DnaChangeTags({ tags }) {
  return (
    <View style={styles.tags}>
      {tags.map((t) => (
        <Badge key={t.key} axis={t.key} label={t.label} accessibilityLabel={t.a11y} />
      ))}
    </View>
  );
}

/** 2c: the sentence, then the tags (none when nothing moved). */
export default function DnaChange({ change }) {
  const tags = changeTags(change);
  return (
    <View style={styles.block}>
      <Text variant="body" color={tags.length ? 'primary' : 'secondary'}>
        {changeSentence(tags)}
      </Text>
      {tags.length ? <DnaChangeTags tags={tags} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.gap.row,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[6],
  },
});
