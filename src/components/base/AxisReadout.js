import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AXIS_SCALE, axisById, stepWordOf } from '../../constants/tasteAxes';
import { axisColor } from '../../theme/axisColor';
import { color, size, space, textStyle } from '../../theme/tokens';
import Text from './Text';

/**
 * AxisReadout (design-system.md §9 Taste axis readout; Turn 30, 31b / 31d):
 * one read-only line per axis, 17 tall.
 *
 *   title   size.axisColumn.title (88): the axis's name, textStyle
 *           axisLabel (10 / 700 caps .06em), ink. NO COLOUR KEY: the name
 *           says which axis, the fill shows its colour.
 *   track   size.meter.track (4) on border.subtle, filling the rest of the
 *           line (gap space[8] from the title)
 *   fill    from the left edge to (value − 1) / 4, in the axis's colour
 *   marker  size.marker.line (2 × 14) at the value, kept inside the track:
 *           flush left at 1, flush right at 5, centred on the value between.
 *           LOAD-BEARING AT 1: the fill is zero wide there, and the marker
 *           flush left IS the reading.
 *   step    optional (8f, `step`): a size.axisColumn.step (56) column at
 *           the right with the step word (Faint … Strong, nearest whole
 *           number), axisLabel in text.secondary, right-aligned. No numbers:
 *           a profile is an estimate, not a reading.
 *
 * Marker colour carries the role (§1, §23a; tone):
 *   computed  a value worked out from records (Home, 5c, 8f): text.muted
 *   entered   one cup's own value (2c, 11a): border.accent
 *
 * Not noted (value null): no marker anywhere, no fill; "Not noted yet"
 * (computed: a later cup can still note it) or "Not noted" (entered: that
 * cup's axes can't change) centred over the track on a surface.raised
 * patch padded space.8 each side, textStyle axisEmpty in text.placeholder.
 * That is 3.08:1, under the text floor ON PURPOSE: it marks an absence, not
 * information. Do not "fix" the contrast. Value 1 and Not noted can't be
 * read as each other: one is a tick at the left end of an empty track, the
 * other is words and no tick, in colour and in greyscale alike.
 *
 * previous (5c): the earlier value under the current one, in border.muted —
 * its fill from the left edge and its own marker (§9).
 *
 * Shown on raised cards (Home's card, 2c, 5c, 11a, 8f), which the patch
 * matches. Rows stack spacing.gap.section (12) apart; the caller sets that.
 *
 * Props: axis (a TASTE_AXES id), value 1–5 or null, tone, previous, step,
 * accessibilityLabel (default: "‹Axis›, ‹step word›" or "not noted").
 */
const MARKER = {
  computed: color.text.muted,
  entered: color.border.accent,
};
const GHOST = color.border.muted;
const MARKER_W = size.marker.line.w;

/** A 1–5 reading as a share of the track, 1 at the left edge. */
const share = (v) => (v - AXIS_SCALE.min) / (AXIS_SCALE.max - AXIS_SCALE.min);

/** The marker's left edge for a share of a track `w` wide: centred on it, never past either end. */
const markerLeft = (w, s) => Math.min(Math.max(w * s - MARKER_W / 2, 0), Math.max(w - MARKER_W, 0));

/** The axis's 12 × 4 colour key (Round 21): the change tags only since 31b. Decorative, so never read out. */
export function AxisKey({ axis, style }) {
  return <View style={[styles.key, { backgroundColor: axisColor(axis) }, style]} importantForAccessibility="no" accessibilityElementsHidden />;
}

export default function AxisReadout({ axis, value, tone = 'computed', previous = null, step = false, accessibilityLabel }) {
  const [width, setWidth] = useState(0);
  const entry = axisById(axis);
  const has = value != null;
  const word = stepWordOf(value);
  const emptyWords = tone === 'entered' ? 'Not noted' : 'Not noted yet';
  const label = accessibilityLabel ?? `${entry?.label}, ${word ? word.toLowerCase() : 'not noted'}`;

  return (
    <View style={styles.row} accessible accessibilityLabel={label}>
      <Text variant="axisLabel" color="primary" numberOfLines={1} style={styles.title}>
        {entry?.label}
      </Text>
      <View style={styles.bar} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <View style={styles.track}>
          {previous != null ? <View style={[styles.fill, { width: `${share(previous) * 100}%`, backgroundColor: GHOST }]} /> : null}
          {has ? <View style={[styles.fill, { width: `${share(value) * 100}%`, backgroundColor: axisColor(axis) }]} /> : null}
        </View>
        {previous != null && width ? <View style={[styles.marker, { left: markerLeft(width, share(previous)), backgroundColor: GHOST }]} /> : null}
        {has && width ? <View style={[styles.marker, { left: markerLeft(width, share(value)), backgroundColor: MARKER[tone] }]} /> : null}
        {has ? null : (
          <View style={styles.emptyLabel} pointerEvents="none">
            <Text variant="axisEmpty" color="placeholder" style={styles.patch}>
              {emptyWords}
            </Text>
          </View>
        )}
      </View>
      {step ? (
        <Text variant="axisLabel" color="secondary" numberOfLines={1} style={styles.step}>
          {word ?? ''}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  title: {
    width: size.axisColumn.title,
  },
  step: {
    width: size.axisColumn.step,
    textAlign: 'right',
  },
  key: {
    width: size.axis.key.w,
    height: size.axis.key.h,
  },
  bar: {
    flex: 1,
    // the row's slot: meta's line height, so an empty row is as tall as a filled one
    height: textStyle.meta.lineHeight,
    justifyContent: 'center',
  },
  track: {
    height: size.meter.track,
    backgroundColor: color.border.subtle,
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  marker: {
    position: 'absolute',
    top: (textStyle.meta.lineHeight - size.marker.line.h) / 2,
    width: size.marker.line.w,
    height: size.marker.line.h,
  },
  emptyLabel: {
    // RN 0.86 has no absoluteFillObject (see AddCoffeeOverlay).
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patch: {
    backgroundColor: color.surface.raised,
    paddingHorizontal: space[8],
  },
});
