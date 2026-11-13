import { StyleSheet, View } from 'react-native';
import { axisById, STEP_WORDS } from '../constants/tasteAxes';
import { changeDeltas } from '../data/tasteDna';
import { space, spacing } from '../theme/tokens';
import Badge from './base/Badge';
import Text from './base/Text';

/**
 * What one cup changed in Taste DNA, from its stored `dna_change` (never
 * recomputed): a sentence, then one tag per axis (Turn 30, 31e). Shared by
 * 5c and 2c's "Feeds my taste DNA". Which axes moved and by how much is
 * tasteDna.ts changeDeltas(); this file only words it.
 *
 * Tags, in the registry's order, wrapping space.6 both ways; Badge neutral,
 * inline, with the axis's key:
 *   moved        "‹Axis› +0.2" / "‹Axis› −0.1": the change on the 1–5 scale,
 *                one decimal, signed with a true minus. The sign carries the
 *                direction the pole used to. Under 0.05: no tag.
 *   first value  "‹Axis› starts at ‹step word›", no number: a position, not
 *                a movement.
 * Sentence:
 *   first        "My taste DNA has its first ‹Axis› reading." (two or more:
 *                "…its first Body and Aftertaste readings."). 31e draws this
 *                sentence over a cup that also moved an axis by 0.1, so a
 *                first reading leads.
 *   moved        "This cup raised ‹a› [and lowered ‹b›]." — the two largest
 *                changes, largest first; one verb when both go the same way
 *                ("raised acidity and sweetness"). Ties keep registry order.
 *   barely       something moved, all under 0.05: "My taste DNA stays where
 *                it was — this cup barely moves it." No tags.
 *   nothing      nothing on the cup moved anything: NOTHING_MOVED. No tags.
 */
const SUMMARY_AXES = 2;
const MINUS = '\u2212';

export const NOTHING_MOVED = 'Your Taste DNA stays where it was — nothing on this cup moves it.';
export const BARELY_MOVED = 'My taste DNA stays where it was — this cup barely moves it.';

/** "A", "A and B", "A, B and C". */
const joinAnd = (words) => (words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`);

const signed = (d) => `${d > 0 ? '+' : MINUS}${Math.abs(d).toFixed(1)}`;

/** [{ key, name, label, a11y, size?, up? }] in registry order, plus `still` (moved under 0.05) for the sentence. */
export function changeTags(change) {
  const tags = [];
  let still = false;
  for (const d of changeDeltas(change)) {
    const axis = axisById(d.axis);
    if (d.kind === 'still') {
      still = true;
      continue;
    }
    if (d.kind === 'first') {
      const label = `${axis.label} starts at ${STEP_WORDS[d.step]}`;
      tags.push({ key: d.axis, name: axis.label, label, a11y: label, first: true });
      continue;
    }
    const label = `${axis.label} ${signed(d.delta)}`;
    tags.push({
      key: d.axis,
      name: axis.label,
      label,
      a11y: `${axis.label} ${d.delta > 0 ? 'up' : 'down'} ${Math.abs(d.delta).toFixed(1)}`,
      size: Math.abs(d.delta),
      up: d.delta > 0,
    });
  }
  tags.still = still;
  return tags;
}

/** The sentence over the tags: first readings, what moved most, barely, or nothing. */
export function changeSentence(tags) {
  const firsts = tags.filter((t) => t.first);
  if (firsts.length) return `My taste DNA has its first ${joinAnd(firsts.map((t) => t.name))} ${firsts.length === 1 ? 'reading' : 'readings'}.`;
  const moved = tags.filter((t) => t.size).sort((a, b) => b.size - a.size).slice(0, SUMMARY_AXES);
  if (moved.length) {
    const [a, b] = moved;
    const verb = (t) => (t.up ? 'raised' : 'lowered');
    const name = (t) => t.name.toLowerCase();
    if (!b) return `This cup ${verb(a)} ${name(a)}.`;
    if (a.up === b.up) return `This cup ${verb(a)} ${name(a)} and ${name(b)}.`;
    return `This cup ${verb(a)} ${name(a)} and ${verb(b)} ${name(b)}.`;
  }
  return tags.still ? BARELY_MOVED : NOTHING_MOVED;
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
