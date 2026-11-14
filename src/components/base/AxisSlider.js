import * as Haptics from 'expo-haptics';
import { memo, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { AXIS_SCALE, axisById, STEP_WORDS, stepWordOf } from '../../constants/tasteAxes';
import { component, motion, size, space, state } from '../../theme/tokens';
import ClearButton from './ClearButton';
import { GESTURE_LOG, logGesture } from './gestureLog';
import Text from './Text';

/**
 * Taste axis input (design-system.md §9 Taste axis slider; Turn 29, boards
 * 30a–30d): ONE ROW per axis, title · track · reading, 44 tall.
 *
 *   title    size.axisColumn.title (88), the axis's name, textStyle
 *            axisLabel, ink. No colour key (30d: the title names the axis).
 *            A longer title wraps to two lines; the column never widens.
 *   track    fills the row between the columns (space[8] each side): 28
 *            tall, 2px text.secondary frame on surface.raised, a dot at each
 *            whole number, NINE STOPS (1–5 in halves, AXIS_SCALE).
 *   handle   a 20 square, inset 2, with a white centre grip:
 *              not assessed  border.subtle fill, border.muted frame, WAITING
 *                            AT 1 — a placeholder, never a value. Nothing is
 *                            pre-set to a midpoint.
 *              assessed      text.accent fill, border.strong frame
 *   reading  size.axisColumn.reading (56), right-aligned: the value
 *            ALWAYS TO ONE DECIMAL, "1.0" … "5.0" (Uryu, 2026-11-14; 30b
 *            draws "1" and "3.5"), so with tabular figures the number keeps
 *            one width and the ✕ never shifts as the value changes
 *            (axisReading) and the ✕ (ClearButton square), or "Not
 *            noted" (axisUnset, text.muted). The reading appearing is the
 *            "set" signal; by eye 3 and 3.5 are one stop apart, so it is
 *            always shown. While dragging it shows the stop under the finger.
 *
 * Gestures (Reanimated + gesture-handler, on the UI thread):
 *   - The whole 44-tall band left of the reading column (title and track)
 *     is the drag area: the finger never has to land on the 20 handle.
 *   - Every stop gives a selection haptic: stops are 17.25 apart at 402 and
 *     13.9 at 375, so the finger feels steps the eye can't resolve.
 *   - A tap on the track sets the nearest stop, with a light impact. So a
 *     tap on the waiting handle CONFIRMS 1 without dragging away and back:
 *     1 is a common reading for acidity and bitterness. A tap on the title
 *     does nothing.
 *   - Nothing commits while the finger is down; release commits (onChange).
 *     A gesture taken away (the scroll view wins) restores the committed stop.
 *   - Vertical travel hands the touch to the scroll view (vertical wins ties).
 *   - ✕ clears back to not assessed: onChange(null), so no cup_axes row is
 *     written (cupAxes.ts). Its touch area is 44 through hitSlop, reaching
 *     into the row's padding and the 8 gap, never over the track.
 *
 * Screen reader: one adjustable element per row; increment / decrement by a
 * half, the first increment of a waiting axis sets 1; a Clear action.
 *
 * Props: axis (a TASTE_AXES id), value (1–5 in halves, or null), onChange
 */

// ── Device-tuning constants (design-system.md §9: check on device) ──────────
/** Horizontal travel (pt) before the touch becomes an axis drag. */
const ACTIVE_OFFSET_X = 10;
/** Vertical travel (pt) that hands the touch to the scroll view instead. */
const FAIL_OFFSET_Y = 10;
/** A tap may wander this far (pt) and still count as a tap. */
const TAP_MAX_DISTANCE = 8;
// ────────────────────────────────────────────────────────────────────────────

const STATE = component.axis.state;
const RAIL_H = component.axis.rail.height;
const INSET = component.axis.rail.inset;
const DOT = component.axis.rail.dot;
const GRIP = component.axis.grip;
const BORDER = STATE.entered.rail.width;
const HANDLE = STATE.entered.needle.w;
const INNER_H = RAIL_H - 2 * BORDER;
/** From the track's outer edge to the handle's left edge at stop 0, and the same at the right end. */
const END = BORDER + INSET;

const { min: MIN, max: MAX, step: STEP } = AXIS_SCALE;
const LAST = Math.round((MAX - MIN) / STEP);
const stepToValue = (i) => MIN + i * STEP;
const valueToStep = (v) => Math.min(LAST, Math.max(0, Math.round((v - MIN) / STEP)));
/** The stops that get a dot: the whole numbers. */
const DOT_STOPS = Array.from({ length: MAX - MIN + 1 }, (_, i) => valueToStep(MIN + i));

const PRESS_MS = motion.press.duration;
const pressEasing = Easing.bezier(...motion.press.controlPoints);

/** The ✕'s 44 target: up and down to the row's 44, left into the 8 gap only, right into the card's padding. */
const CLEAR_SLOP = (() => {
  const v = (size.tapTarget - size.axis.clear) / 2;
  return { top: v, bottom: v, left: space[8], right: size.tapTarget - size.axis.clear - space[8] };
})();

const selectionHaptic = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};
const tapHaptic = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

function Handle({ part, style }) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.handle,
        { backgroundColor: part.background, borderWidth: part.borderWidth, borderColor: part.borderColor },
        style,
      ]}>
      <View style={[styles.grip, { backgroundColor: part.grip }]} />
    </Animated.View>
  );
}

function AxisSlider({ axis, value = null, onChange }) {
  const entry = axisById(axis);
  const label = entry?.label ?? axis;
  const isEntered = value != null;
  const committedStep = isEntered ? valueToStep(value) : 0;
  /** The stop under the finger while dragging (null otherwise), for the reading. */
  const [live, setLive] = useState(null);

  const trackX = useSharedValue(0);
  const trackW = useSharedValue(0);
  const step = useSharedValue(committedStep);
  const dragging = useSharedValue(0);
  const enteredOn = useSharedValue(isEntered ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    step.value = committedStep;
    enteredOn.value = isEntered ? 1 : 0;
  }, [committedStep, enteredOn, isEntered, step]);

  const commit = (s) => {
    setLive(null);
    onChange?.(stepToValue(s));
  };
  const log = (st, extra) => logGesture(`axis:${axis}`, st, extra);

  /** The stop under x (pt from the band's left edge). */
  const stopAt = (x) => {
    'worklet';
    const travel = trackW.value - 2 * END - HANDLE;
    if (travel <= 0) return step.value;
    const along = x - trackX.value - END - HANDLE / 2;
    return Math.min(LAST, Math.max(0, Math.round((along / travel) * LAST)));
  };
  /** Move to the stop under x; a selection haptic per stop. */
  const moveTo = (x) => {
    'worklet';
    const next = stopAt(x);
    if (next !== step.value) {
      step.value = next;
      scheduleOnRN(selectionHaptic);
      scheduleOnRN(setLive, next);
    }
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-ACTIVE_OFFSET_X, ACTIVE_OFFSET_X])
    .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
    .onBegin(() => {
      press.value = withTiming(state.pressed.scale, { duration: PRESS_MS, easing: pressEasing });
    })
    .onStart((e) => {
      dragging.value = 1;
      enteredOn.value = 1;
      scheduleOnRN(setLive, step.value);
      moveTo(e.x);
      if (GESTURE_LOG) scheduleOnRN(log, 'pan ACTIVE', `x=${e.x.toFixed(1)} step=${step.value}`);
    })
    .onUpdate((e) => {
      moveTo(e.x);
    })
    .onEnd((e, success) => {
      if (success) {
        scheduleOnRN(commit, step.value);
      } else {
        step.value = committedStep;
        enteredOn.value = isEntered ? 1 : 0;
        scheduleOnRN(setLive, null);
      }
      if (GESTURE_LOG) scheduleOnRN(log, success ? 'pan END' : 'pan CANCELLED', `step=${step.value}`);
    })
    .onFinalize(() => {
      dragging.value = 0;
      press.value = withTiming(1, { duration: PRESS_MS, easing: pressEasing });
    });

  const tap = Gesture.Tap()
    .maxDistance(TAP_MAX_DISTANCE)
    .onEnd((e, success) => {
      if (!success) return;
      // On the track only: a tap on the title is not a reading.
      if (e.x < trackX.value || e.x > trackX.value + trackW.value) return;
      step.value = stopAt(e.x);
      enteredOn.value = 1;
      scheduleOnRN(tapHaptic);
      scheduleOnRN(commit, step.value);
      if (GESTURE_LOG) scheduleOnRN(log, 'tap END', `step=${step.value}`);
    });

  const gesture = Gesture.Exclusive(pan, tap);

  const move = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming((step.value / LAST) * Math.max(0, trackW.value - 2 * END - HANDLE), { duration: PRESS_MS, easing: pressEasing }) },
      { scale: press.value },
    ],
  }));
  const enteredStyle = useAnimatedStyle(() => ({ opacity: enteredOn.value }));

  const shown = live != null ? stepToValue(live) : value;
  const a11y = {
    accessible: true,
    accessibilityRole: 'adjustable',
    accessibilityLabel: label,
    accessibilityValue: { text: value == null ? 'Not noted' : `${value}, ${stepWordOf(value)}` },
    accessibilityActions: [{ name: 'increment' }, { name: 'decrement' }, ...(isEntered ? [{ name: 'clear', label: 'Clear' }] : [])],
    onAccessibilityAction: (e) => {
      const name = e.nativeEvent.actionName;
      if (name === 'increment') onChange?.(stepToValue(isEntered ? Math.min(LAST, committedStep + 1) : 0));
      if (name === 'decrement' && isEntered) onChange?.(stepToValue(Math.max(0, committedStep - 1)));
      if (name === 'clear') onChange?.(null);
    },
  };

  return (
    <View style={styles.row} {...a11y}>
      <GestureDetector gesture={gesture}>
        <View style={styles.band}>
          <Text variant="axisLabel" color="primary" style={styles.title}>
            {label}
          </Text>
          <View
            style={styles.track}
            onLayout={(e) => {
              trackX.value = e.nativeEvent.layout.x;
              trackW.value = e.nativeEvent.layout.width;
            }}>
            <View style={styles.dots} pointerEvents="none">
              {DOT_STOPS.map((i) => (
                <View key={i} style={[styles.dot, { left: `${(i / LAST) * 100}%` }]} />
              ))}
            </View>
            <Handle part={STATE.empty.needle} style={move} />
            <Animated.View style={[StyleSheet.absoluteFill, enteredStyle]} pointerEvents="none">
              <Handle part={STATE.entered.needle} style={move} />
            </Animated.View>
          </View>
        </View>
      </GestureDetector>
      <View style={styles.reading}>
        {shown != null ? (
          <>
            <Text variant="axisReading" color="primary">
              {shown.toFixed(1)}
            </Text>
            {live == null ? <ClearButton variant="square" hitSlop={CLEAR_SLOP} accessibilityLabel={`Clear ${label}`} onPress={() => onChange?.(null)} /> : <View style={styles.clearSpace} />}
          </>
        ) : (
          <Text variant="axisUnset" color="muted" numberOfLines={1}>
            Not noted
          </Text>
        )}
      </View>
    </View>
  );
}

export default memo(AxisSlider);

/**
 * The scale key under the last track, once for all the axes (30a): "1 ·
 * Faint" at the track's left end, "Strong · 5" at its right, label.eyebrow
 * in text.muted, on the rows' column grid so it sits exactly under the
 * tracks. Words about how much, not how good.
 */
export function AxisScaleKey({ style }) {
  return (
    <View style={[styles.keyRow, style]} importantForAccessibility="no-hide-descendants">
      <View style={styles.title} />
      <View style={styles.keyWords}>
        <Text variant="labelEyebrow" color="muted">{`${MIN} · ${STEP_WORDS[0]}`}</Text>
        <Text variant="labelEyebrow" color="muted">{`${STEP_WORDS[STEP_WORDS.length - 1]} · ${MAX}`}</Text>
      </View>
      <View style={styles.readingSpace} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: size.tapTarget,
    gap: space[8],
  },
  /** The drag area: title and track, the row's full 44 height. */
  band: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: space[8],
  },
  title: {
    width: size.axisColumn.title,
  },
  track: {
    flex: 1,
    height: RAIL_H,
    borderWidth: BORDER,
    borderColor: STATE.empty.rail.color,
    backgroundColor: STATE.empty.rail.background,
  },
  dots: {
    position: 'absolute',
    left: INSET + HANDLE / 2,
    right: INSET + HANDLE / 2,
    top: 0,
    bottom: 0,
  },
  dot: {
    position: 'absolute',
    top: (INNER_H - DOT) / 2,
    marginLeft: -DOT / 2,
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: STATE.empty.rail.dot,
  },
  handle: {
    position: 'absolute',
    left: INSET,
    top: (INNER_H - HANDLE) / 2,
    width: HANDLE,
    height: HANDLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grip: {
    width: GRIP.w,
    height: GRIP.h,
  },
  reading: {
    width: size.axisColumn.reading,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: space[6],
  },
  clearSpace: {
    width: size.axis.clear,
    height: size.axis.clear,
  },
  keyRow: {
    flexDirection: 'row',
    gap: space[8],
  },
  keyWords: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  readingSpace: {
    width: size.axisColumn.reading,
  },
});
