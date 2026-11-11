import { useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { formatDay } from '../constants/dates';
import { TASTE_AXES } from '../constants/tasteAxes';
import { bandOf } from '../data/tasteDna';
import { color, motion, shape, size, space, spacing, state as pressState } from '../theme/tokens';
import AxisReadout, { AxisPoles } from './base/AxisReadout';
import Badge from './base/Badge';
import Chevron from './base/Chevron';
import Text from './base/Text';

/**
 * Taste DNA card (1b / 4a / 4b: Home, the same card on all three; the card
 * itself is not pressable: Design Round 11, C's framed block that is not
 * pressable, since its stamp is a button). From the mock: "My taste DNA" (display.sm,
 * accent) with the state's stamp beside it, the header row centred, then the
 * four axes — pole labels (AxisPoles, the axis's key first) over an
 * AxisReadout in the axis's colour (§9; Design Round 21, 23b), in the fixed
 * axis order, here and on 8f.
 *
 * State, one for the whole profile (taste-dna.md item 4, option B):
 *   early   "Early signs" — Badge accent (the mock's #F1E3D6 / #8A4602; its
 *           1.5px border is left out: a Badge has none, §9)
 *   locked  "Locked in" — Badge selected (6a / 8f)
 *   none    no stamp: nothing noted yet, and one line right under the title
 *           (8 under it, 20 over the axes; Design 27a), 8f's (dnaNoneLine): "Rate a cup and note one taste to start." (Design
 *           Round 12), or after a reset "Starting again from Nov 10. Rate a
 *           cup and note one taste." (Design Round 25, A1)
 * The stamp is a button (DnaStamp, 15a): it opens 15b's info sheet.
 * No line under the title (Design Round 8, 2026-10-17): what it said moved
 * into the sheet's progress box (DnaInfoSheet).
 * The mock's footer "3 of 5 cups" is Try next's progress (V2; its count is
 * undecided, D-47): not shown.
 * With onOpen, the card's foot is a row, "Open my taste DNA ›" → 8f (Design
 * Round 11, B): label.caps and the shared chevron, its pressed fill out to
 * the card's frame (sides and bottom), as the shelf's Manage rows. A row,
 * not the card, so the stamp stays the card's only other button.
 *
 * All four axes always show (Design 10b, option A, decided 2026-10-12): an
 * axis with nothing noted is AxisReadout's empty track with "Not noted yet"
 * on it, never a value of 50. The card's height never depends on what has
 * been noted (design-system.md §9 Taste axis readout).
 */
const pressEasing = Easing.bezier(...motion.press.controlPoints);

/**
 * The profile's state as a stamp that explains itself (15a, Design Round 8):
 * the Badge with an ⓘ, upright (no rotation.sticker: a tilt reads as
 * decoration, a straight shape as a control). Shared with 5c; none: nothing.
 *
 * Hit area: a transparent wrapper size.tapTarget (44) tall, 6 either side,
 * pulled back by -6 on the top, right and bottom so the stamp stays where it
 * was. Pressed: the stamp scales (§1: its visible box is under 44).
 * Not for a status chip inside a card that is itself a link (Profile, 6):
 * that one stays a plain Badge, so there is no button in a button.
 */
export function DnaStamp({ state, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  if (state === 'none') return null;
  const label = state === 'locked' ? 'Locked in' : 'Early signs';
  const scaleTo = (toValue) =>
    Animated.timing(scale, { toValue, duration: motion.press.duration, easing: pressEasing, useNativeDriver: true }).start();
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => scaleTo(pressState.pressed.scale)}
      onPressOut={() => scaleTo(1)}
      style={styles.stampHit}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Explains your taste DNA">
      <Animated.View style={{ transform: [{ scale }] }}>
        <Badge label={label} tone={state === 'locked' ? 'selected' : 'accent'} placement="standalone" icon="info" />
      </Animated.View>
    </Pressable>
  );
}

/**
 * The four axes as the card draws them: pole labels over an AxisReadout.
 * Shared with 8f, which adds each axis's band name under its readout
 * (`bands`; meta, muted, as 8f): the step names of tasteAxes.js, from the
 * same value, so a name can't disagree with its bar. An axis with nothing
 * noted has no band line: its readout already says "Not noted yet".
 */
export function DnaAxes({ dna, bands = false, style }) {
  return (
    <View style={[styles.axisList, style]}>
      {TASTE_AXES.map((axis) => {
        const value = dna.axes[axis.key].value;
        const band = value == null ? null : axis.steps[bandOf(value)];
        return (
          <View key={axis.key} style={styles.axis}>
            <AxisPoles axis={axis} />
            <AxisReadout axis={axis.key} value={value} accessibilityLabel={`${axis.from} to ${axis.to}, ${band ?? 'not noted'}`} />
            {bands && band ? (
              <Text variant="meta" color="muted" importantForAccessibility="no" accessibilityElementsHidden>
                {band}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/**
 * Props
 *   dna            the profile (loadTasteDna)
 *   onStampPress   the stamp: open 15b's sheet
 *   onOpen         the foot row: open 8f
 */
/**
 * The 'none' line, Home's card and 8f. After Reset my taste DNA the profile is
 * empty by choice, not new: it says when it started again (reset_at, the
 * app's short date), then the same instruction (Design Round 25, A1).
 */
export function dnaNoneLine(dna) {
  return dna.resetAt != null ? `Starting again from ${formatDay(dna.resetAt)}. Rate a cup and note one taste.` : 'Rate a cup and note one taste to start.';
}

export default function TasteDnaCard({ dna, onStampPress, onOpen }) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text variant="displaySm" color="accent" style={styles.title}>
          My taste DNA
        </Text>
        <DnaStamp state={dna.state} onPress={onStampPress} />
      </View>
      {dna.state === 'none' ? (
        <Text variant="bodySm" color="secondary">
          {dnaNoneLine(dna)}
        </Text>
      ) : null}
      <DnaAxes dna={dna} style={styles.axes} />
      {onOpen ? (
        <Pressable onPress={onOpen} accessibilityRole="button" style={({ pressed }) => [styles.open, pressed && styles.openPressed]}>
          <Text variant="labelCaps" color="primary">
            Open my taste DNA
          </Text>
          <Chevron />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.container,
    backgroundColor: color.surface.raised,
    paddingVertical: spacing.inset.container.v,
    paddingHorizontal: spacing.inset.container.h,
    gap: spacing.gap.row,
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
  stampHit: {
    height: size.tapTarget,
    justifyContent: 'center',
    paddingHorizontal: space[6],
    marginTop: -space[6],
    marginRight: -space[6],
    marginBottom: -space[6],
  },
  axes: {
    marginTop: spacing.gap.section,
  },
  open: {
    marginTop: spacing.gap.section,
    minHeight: size.tapTarget + spacing.inset.container.v,
    marginHorizontal: -spacing.inset.container.h,
    paddingHorizontal: spacing.inset.container.h,
    // Down to the frame, with no padding of its own: the label sits in the
    // middle of the fill, as much room over it as under it.
    marginBottom: -spacing.inset.container.v,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  openPressed: {
    backgroundColor: pressState.pressed.row,
  },
  axisList: {
    gap: spacing.gap.axis,
  },
  axis: {
    gap: spacing.gap.row,
  },
});
