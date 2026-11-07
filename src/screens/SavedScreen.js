import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import AxisReadout, { AxisPoles } from '../components/base/AxisReadout';
import Button from '../components/base/Button';
import Text from '../components/base/Text';
import { DnaChangeTags, changeSentence, changeTags } from '../components/DnaChange';
import DnaInfoSheet from '../components/DnaInfoSheet';
import { DnaStamp } from '../components/TasteDnaCard';
import { TASTE_AXES } from '../constants/tasteAxes';
import { useDatabase } from '../data/DatabaseProvider';
import { cupOrdinal, getCup, loadTasteDna } from '../data/repository';
import { bandOf } from '../data/tasteDna';
import { color, motion, shape, size, spacing } from '../theme/tokens';
import ScreenFrame from './ScreenFrame';

/**
 * 5c — Saved: what the cup changed. Shown in the Record sheet right after a
 * save (over the steps, fading in over motion.expand), until one of its two
 * buttons closes the sheet.
 *
 * From the mock (5c; Design Round 21, 23e / 23f): eyebrow "Cup N · logged
 * HH:MM", title "Noted.", then the Taste DNA card — "My taste DNA" with the
 * profile's state stamp (15a: it opens 15b's sheet, here inside the Record
 * sheet, over 5c), then, read from the cup's stored dna_change, never
 * recomputed (DnaChange):
 *   - the sentence: "This cup pushed you ‹phrases›." (the two largest
 *     moves), "My taste DNA has its first ‹Axis› reading." (first values
 *     only), or Design's "stays where it was" line (nothing moved)
 *   - the change tags, one per axis that moved (≥ 1 point) or got its first
 *     value, in the axes' order; none when nothing moved
 *   - "Where it sat before": the legend for the ghost, when an axis moved
 *   - all four axes in the fixed order (23e draws four; the moved-axes-only
 *     list, largest first, is gone with the per-axis lines), each an
 *     AxisReadout (computed: §9's ghost at the profile's value before, the
 *     value after in the axis's colour). As Home's card: an axis never
 *     noted is the empty track with "Not noted yet". A cup with no
 *     dna_change shows the profile as it stands.
 *   - Try next's progress ("4 of 5 cups", "One more cup and Try next opens
 *     up") is V2, and its count is undecided (D-47, todo.md T-14): not shown
 * Buttons: "Back to home" (primary) and "See this record" (secondary → 2c).
 */
const expandEasing = Easing.bezier(...motion.expand.controlPoints);
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export default function SavedScreen({ id, onHome, onSeeRecord }) {
  const db = useDatabase();
  const [data, setData] = useState(null);
  const [info, setInfo] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let alive = true;
    Promise.all([getCup(db, id), cupOrdinal(db, id), loadTasteDna(db)]).then(
      ([cup, n, dna]) => alive && setData({ cup, n, dna }),
      (error) => console.error('[5c] could not read the saved cup', error)
    );
    Animated.timing(fade, { toValue: 1, duration: motion.expand.duration, easing: expandEasing, useNativeDriver: true }).start();
    return () => {
      alive = false;
    };
  }, [db, id, fade]);

  const change = data?.cup?.dna_change ? JSON.parse(data.cup.dna_change) : null;
  const tags = changeTags(change);
  const anyBefore = tags.some((t) => t.size);

  return (
    <Animated.View style={[styles.fill, { opacity: fade }]}>
      {data ? (
        <ScreenFrame
          scroll
          eyebrow={`Cup ${data.n} · logged ${timeFormat.format(new Date(data.cup.logged_at))}`}
          title="Noted."
          footer={
            <>
              <Button label="Back to home" onPress={onHome} />
              <Button variant="secondary" label="See this record" onPress={onSeeRecord} />
            </>
          }>
          <View style={styles.card}>
            <View style={styles.head}>
              <Text variant="displaySm" color="accent" style={styles.title}>
                My taste DNA
              </Text>
              <DnaStamp state={data.dna.state} onPress={() => setInfo(true)} />
            </View>
            <Text variant="body" color="muted">
              {changeSentence(tags)}
            </Text>
            {tags.length ? <DnaChangeTags tags={tags} /> : null}
            {anyBefore ? (
              <View style={styles.legend}>
                <View style={styles.legendMark} />
                <Text variant="meta" color="muted">
                  Where it sat before
                </Text>
              </View>
            ) : null}
            <View style={styles.axes}>
              {TASTE_AXES.map((axis) => {
                // The stored profile after this cup; data.dna if the cup has none.
                const value = (change ? change.after[axis.key]?.value : data.dna.axes[axis.key].value) ?? null;
                const band = value == null ? null : axis.steps[bandOf(value)];
                // The ghost only where a tag says the axis moved: under 1 point it would thicken the marker.
                const moved = tags.some((t) => t.key === axis.key && t.size);
                return (
                  <View key={axis.key} style={styles.axis}>
                    <AxisPoles axis={axis} />
                    <AxisReadout
                      axis={axis.key}
                      value={value}
                      previous={moved ? change.before[axis.key].value : null}
                      accessibilityLabel={`${axis.from} to ${axis.to}, ${band ?? 'not noted'}`}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </ScreenFrame>
      ) : null}
      <DnaInfoSheet visible={info} dna={data?.dna} onClose={() => setInfo(false)} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  card: {
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.container,
    backgroundColor: color.surface.raised,
    paddingVertical: spacing.inset.container.v,
    paddingHorizontal: spacing.inset.container.h,
    gap: spacing.gap.section,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.gap.section,
  },
  title: {
    flex: 1,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap.row,
  },
  // The ghost marker itself (§9: 2 × 14, border.muted), as the legend's key.
  legendMark: {
    width: size.marker.line.w,
    height: size.marker.line.h,
    backgroundColor: color.border.muted,
  },
  axes: {
    gap: spacing.gap.axis,
  },
  axis: {
    gap: spacing.gap.row,
  },
});
