import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { component, motion, state } from '../../theme/tokens';
import { GESTURE_LOG, logGesture } from './gestureLog';

/**
 * The gesture and motion of a slider with fixed stops, shared by the taste
 * axis input (AxisSlider, 30a–30d) and the roast level row (RoastSlider,
 * 32a–32d): one feel for every stop slider in the app.
 *
 *   - Pan anywhere in the gesture's view; the handle follows the stop under
 *     the finger, a selection haptic at every stop (stops can be closer than
 *     the eye resolves under a finger). Nothing commits while the finger is
 *     down; release commits. A gesture taken away (the scroll view wins)
 *     restores the committed stop.
 *   - A tap on the track sets the nearest stop, with a light impact.
 *   - Vertical travel hands the touch to the scroll view (vertical wins ties).
 *
 * Geometry (component.axis): the handle (20) sits inside the track's frame
 * by the inset, so stop 0's handle centre is END + HANDLE / 2 from the
 * track's outer left edge, and the last stop's the same from its right.
 *
 * Args: last (the last stop's index), committed (the committed stop, or
 * null for no value), onCommit (stop) => void, logName.
 * Returns: gesture (for a GestureDetector), onTrackLayout (the track's
 * onLayout; x is its offset inside the gesture's view), live (the stop under
 * the finger while dragging, else null), move (the handle's animated style),
 * shown (an animated opacity: 1 while there is a value or a drag).
 */

// ── Device-tuning constants (design-system.md §9: check on device) ──────────
/** Horizontal travel (pt) before the touch becomes a drag. */
const ACTIVE_OFFSET_X = 10;
/** Vertical travel (pt) that hands the touch to the scroll view instead. */
const FAIL_OFFSET_Y = 10;
/** A tap may wander this far (pt) and still count as a tap. */
const TAP_MAX_DISTANCE = 8;
// ────────────────────────────────────────────────────────────────────────────

const STATE = component.axis.state;
const BORDER = STATE.entered.rail.width;
const HANDLE = STATE.entered.needle.w;
export const STOP_END = BORDER + component.axis.rail.inset;
const PRESS_MS = motion.press.duration;
const pressEasing = Easing.bezier(...motion.press.controlPoints);

const selectionHaptic = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};
const tapHaptic = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function useStopSlider({ last, committed, onCommit, logName }) {
  const has = committed != null;
  const committedStep = has ? committed : 0;
  const [live, setLive] = useState(null);

  const trackX = useSharedValue(0);
  const trackW = useSharedValue(0);
  const step = useSharedValue(committedStep);
  const shownOn = useSharedValue(has ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    step.value = committedStep;
    shownOn.value = has ? 1 : 0;
  }, [committedStep, has, shownOn, step]);

  const commit = (s) => {
    setLive(null);
    onCommit?.(s);
  };
  const log = (st, extra) => logGesture(logName, st, extra);

  /** The stop under x (pt from the gesture view's left edge). */
  const stopAt = (x) => {
    'worklet';
    const travel = trackW.value - 2 * STOP_END - HANDLE;
    if (travel <= 0) return step.value;
    const along = x - trackX.value - STOP_END - HANDLE / 2;
    return Math.min(last, Math.max(0, Math.round((along / travel) * last)));
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
      shownOn.value = 1;
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
        shownOn.value = has ? 1 : 0;
        scheduleOnRN(setLive, null);
      }
      if (GESTURE_LOG) scheduleOnRN(log, success ? 'pan END' : 'pan CANCELLED', `step=${step.value}`);
    })
    .onFinalize(() => {
      press.value = withTiming(1, { duration: PRESS_MS, easing: pressEasing });
    });

  const tap = Gesture.Tap()
    .maxDistance(TAP_MAX_DISTANCE)
    .onEnd((e, success) => {
      if (!success) return;
      // On the track only (AxisSlider's band also holds the title).
      if (e.x < trackX.value || e.x > trackX.value + trackW.value) return;
      step.value = stopAt(e.x);
      shownOn.value = 1;
      scheduleOnRN(tapHaptic);
      scheduleOnRN(commit, step.value);
      if (GESTURE_LOG) scheduleOnRN(log, 'tap END', `step=${step.value}`);
    });

  const gesture = Gesture.Exclusive(pan, tap);

  const move = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming((step.value / last) * Math.max(0, trackW.value - 2 * STOP_END - HANDLE), { duration: PRESS_MS, easing: pressEasing }) },
      { scale: press.value },
    ],
  }));
  const shown = useAnimatedStyle(() => ({ opacity: shownOn.value }));

  const onTrackLayout = (e) => {
    trackX.value = e.nativeEvent.layout.x;
    trackW.value = e.nativeEvent.layout.width;
  };

  return { gesture, onTrackLayout, live, move, shown };
}
