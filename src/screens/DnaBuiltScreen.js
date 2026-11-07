import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import DashedRule from '../components/base/DashedRule';
import IconButton from '../components/base/IconButton';
import SectionLabel from '../components/base/SectionLabel';
import Text from '../components/base/Text';
import { TASTE_AXES } from '../constants/tasteAxes';
import { useDatabase } from '../data/DatabaseProvider';
import { loadDnaBuilt, onCupsChanged } from '../data/repository';
import { DNA_TUNING } from '../data/tasteDna';
import { color, dashed, layout, shape, size, space, spacing } from '../theme/tokens';
import ScreenFrame from './ScreenFrame';
import { cupsLabel } from './TasteDnaScreen';

/**
 * 8g — How my DNA is built, pushed over the tabs and the bar (ShellStack
 * 'dnaBuilt', 2026-10-30). Reached from 8f's footer, 6b's row on Profile and
 * 15b's way on (Home's and 8f's, not 5c's).
 *
 *   header    compact, Back, "How it is built" (8g), as 8f's.
 *   opening   8g's two lines as drawn (display.lg, then body): they hold in V1.
 *   My numbers  (Uryu, 2026-10-30; drawn in Design Round 17, 21a / 21c) a
 *            2px frame, one row per axis split by hairlines: the name, the
 *            count at the right (countTabular, ink; "Not noted yet" muted);
 *            "N more to lock in" on its own line under the count in accent,
 *            the one thing here that asks for something; "Tags are at their
 *            limit here." under the row, muted, only at the limit. The cups
 *            line closes the block under a 2px rule: it covers all rows.
 *            Numbers before the rules, never mixed into them.
 *   rules    8g's list look (21b): a 2px rule over rows split by dashed
 *            dividerSoft, each a square bullet, a bold line and one line
 *            under it. Seven, in Design's words (Round 17, B1): how a cup
 *            weighs (1–2), what it moves (3–5), when the profile changes
 *            (6–7). 8g's first four described rules V1 doesn't have.
 *
 * Not built: "Reset my taste DNA" with its line (V1.5). "Read my words" is
 * abolished (2026-10-31): My words never shape the profile, so it would
 * switch nothing.
 *
 * The bullet is SectionLabel's (size.dot.bullet, 6); 8g draws 9, which has
 * no token.
 */

/**
 * Design Round 17, B1. Each line holds against taste-dna.md and DNA_TUNING:
 * 5★ 3.0 / 3★ 1.0 is "three times"; a 90-day half-life halves every three
 * months, a quarter at six; wordShareCap 1/3; lockIn 10; the bag's roast
 * level never feeds Roast (taste-dna.md 9); time alone never moves the
 * profile (check:dna). Change the words with the numbers.
 */
const RULES = [
  {
    title: 'Higher-rated cups weigh more',
    line: 'A 5★ cup counts three times a 3★. Low ratings count too: they record what you tasted, not what you liked.',
  },
  {
    title: 'Recent cups weigh more',
    line: "A cup counts half as much every three months. Rated the same, today's cup pulls four times as hard as one from six months ago.",
  },
  {
    title: 'Each axis on its own',
    line: 'A cup that skips an axis is left out of it, never counted as the middle.',
  },
  {
    title: 'Roast is the roast you tasted',
    line: 'Only your Roast slider moves it. The roast level on the bag never does.',
  },
  // TODO(copy, PROVISIONAL): "don't count" reads as "not yet". My words never
  // count, by design: tags are picked to describe the taste, My words is a
  // memo to read back. Design rewrites it, here or as its own rule (Round 18).
  {
    title: 'Flavour tags nudge, sliders decide',
    line: "Peach leans brighter and sweeter. Tags make up at most a third of an axis. Your own words don't count.",
  },
  {
    title: 'Ten notes per axis to lock in',
    line: "Ten slider notes on each axis; tags don't count. Once locked in, it stays locked unless you delete cups.",
  },
  {
    title: 'It moves only when your cups do',
    line: 'Logging, editing or deleting a cup moves it. Time alone never does.',
  },
];

const notesLabel = (n) => (n === 1 ? '1 note' : `${n} notes`);

/**
 * "7 more to lock in" (Design Round 17, B2), only while the profile is Early
 * signs: after the lock, an axis first noted later shows its notes alone
 * (21c), so the page never contradicts the Locked in stamp. Null otherwise.
 */
function moreLine(n, state) {
  if (n === 0 || n >= DNA_TUNING.lockIn || state === 'locked') return null;
  return `${DNA_TUNING.lockIn - n} more to lock in`;
}

/** "From 47 cups. 2 had nothing noted, so they don't count." (Round 17, B2) */
function cupsLine(counted, idle) {
  const from = counted ? `From ${cupsLabel(counted)}.` : 'No cups count yet.';
  if (!idle) return from;
  return `${from} ${idle} had nothing noted, so ${idle === 1 ? "it doesn't" : "they don't"} count.`;
}

function MyNumbers({ dna, idle }) {
  return (
    <View style={styles.section}>
      <SectionLabel variant="plain" label="My numbers" />
      <View style={styles.card}>
        {TASTE_AXES.map((a, i) => {
          const axis = dna.axes[a.key];
          const count = axis.n ? notesLabel(axis.n) : 'Not noted yet';
          const more = moreLine(axis.n, dna.state);
          return (
            <View
              key={a.key}
              style={[styles.axis, i > 0 && styles.axisDivided]}
              accessible
              accessibilityLabel={[a.name, count, more, axis.capped ? 'Tags are at their limit here' : null].filter(Boolean).join(', ')}>
              <View style={styles.axisRow}>
                <Text variant="label" color="primary">
                  {a.name}
                </Text>
                <Text variant="countTabular" color={axis.n ? 'primary' : 'muted'} style={styles.axisCount}>
                  {count}
                </Text>
              </View>
              {more ? (
                <Text variant="meta" color="accent" style={styles.more}>
                  {more}
                </Text>
              ) : null}
              {axis.capped ? (
                <Text variant="bodySm" color="muted">
                  Tags are at their limit here.
                </Text>
              ) : null}
            </View>
          );
        })}
        <View style={styles.cups}>
          <Text variant="bodySm" color="secondary">
            {cupsLine(dna.cups, idle)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function DnaBuiltScreen({ onBack }) {
  const db = useDatabase();
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = () =>
      loadDnaBuilt(db).then(setData, (error) => {
        console.error('[dna] could not read', error);
        Alert.alert("Couldn't read your taste DNA", String(error?.message ?? error));
      });
    load();
    return onCupsChanged(load);
  }, [db]);

  return (
    <ScreenFrame scroll compact title="How it is built" leading={<IconButton icon="chevronLeft" accessibilityLabel="Back" onPress={onBack} />}>
      <View style={styles.body}>
        <View style={styles.head}>
          <Text variant="displayLg" color="primary">
            Nothing here is a guess about you.
          </Text>
          <Text variant="body" color="secondary">
            Your profile is arithmetic on cups you logged. No taste quiz, no crowd averages.
          </Text>
        </View>
        {data ? <MyNumbers dna={data.dna} idle={data.idle} /> : null}
        <View style={styles.rules}>
          {RULES.map((rule, i) => (
            <View key={rule.title}>
              {i > 0 ? <DashedRule token={dashed.dividerSoft} /> : null}
              <View style={styles.rule} accessible accessibilityLabel={`${rule.title}. ${rule.line}`}>
                <View style={styles.bullet} />
                <View style={styles.ruleText}>
                  <Text variant="label" color="primary">
                    {rule.title}
                  </Text>
                  <Text variant="body" color="secondary">
                    {rule.line}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.gap.axis,
    paddingBottom: layout.screen.bottom,
  },
  head: {
    gap: spacing.gap.row,
  },
  section: {
    gap: spacing.gap.row,
  },
  // 21a: 2px on raised (border.container since Design Round 22); the rows carry the padding (21a's 13 folds to
  // listRow's 12, as Round 9's 11 did).
  card: {
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.container,
    backgroundColor: color.surface.raised,
  },
  axis: {
    gap: spacing.gap.tight,
    paddingVertical: spacing.inset.listRow.v,
    paddingHorizontal: spacing.inset.listRow.h,
  },
  axisDivided: {
    borderTopWidth: shape.borderWidth.divider,
    borderTopColor: color.divider.hairline,
  },
  axisRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space[12],
  },
  axisCount: {
    flex: 1,
    textAlign: 'right',
  },
  // 21a draws it 12 / 700; meta (12 / 600) is the nearest style.
  more: {
    textAlign: 'right',
  },
  // 21a: the cups line covers every row, so a 2px rule sets it apart (quiet
  // as the frame it sits in, Design Round 22: width says what it is).
  cups: {
    paddingVertical: spacing.inset.listRow.v,
    paddingHorizontal: spacing.inset.listRow.h,
    borderTopWidth: shape.borderWidth.box,
    borderTopColor: color.border.container,
  },
  // 8g: a 2px rule over the list, no frame around it; quiet, a list block's
  // edge (Design Round 22).
  rules: {
    borderTopWidth: shape.borderWidth.box,
    borderTopColor: color.border.container,
  },
  rule: {
    flexDirection: 'row',
    gap: space[12],
    paddingVertical: space[14],
  },
  bullet: {
    width: size.dot.bullet,
    height: size.dot.bullet,
    // centred on the bold line's first line (label: 15, ~18 tall)
    marginTop: space[6],
    backgroundColor: color.marker.required,
  },
  ruleText: {
    flex: 1,
    gap: spacing.gap.tight,
  },
});
