import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { color, component, size, space } from '../../theme/tokens';
import ClearButton from './ClearButton';
import Text from './Text';
import useStopSlider from './useStopSlider';

/**
 * A slider over a few named options, set in place (Turn 31, 32a–32d; the
 * roast level on 19a and 3c). Two lines and a legend, as 32a draws them:
 *
 *   title    label.eyebrow, text.muted, on its own line: the same as the
 *            bag form's field labels (Bean name, Roaster), so the row reads
 *            as one of the bag's fields (Uryu, 2026-11-14; 32a: 14 / 600)
 *   track    fills the line: 28 tall (size.axis.rail), a 2px border.muted
 *            frame on raised, one 2 × 10 tick per option in
 *            divider.hairlineStrong. At 402 it is 200 (stops 57 apart), at
 *            375 173 (48). The touch band is 44 (size.tapTarget).
 *   word     size.option.word (84), LEFT-ALIGNED space[8] after the track,
 *            so the gap to the track is the same for every word (Uryu,
 *            2026-11-14; 32a right-aligns it), textStyle.axisLabel (10 / 700
 *            caps .06em), ink: the option's word, following the handle
 *            while dragging. The ✕ stays at the line's end.
 *   ✕        ClearButton square (24), its column kept when empty so the
 *            track never jumps; space[6] after the word
 *   legend   optional `ends` [left, right]: nodes under the track's two ends
 *            (32a: the flame pair), the track's width
 *
 * Not recorded (value null): NO HANDLE AT ALL, and "Not recorded" on a
 * raised patch over the track in textStyle.axisEmpty, text.placeholder (as
 * "Not noted yet"); the word column is empty. Nothing waits at the first
 * option, so nothing can be read as it. A tap on any stop or a drag from
 * anywhere sets an option; ✕ clears back to not recorded (onChange(null)).
 *
 * Every visual signal differs from the tasting slider (AxisSlider), so it
 * never reads as a taste axis: an ink handle (§1: chosen from options), ticks
 * not dots, the quiet frame, a word not a number, no axis colour
 * (component.option). The feel is the same: useStopSlider, a selection
 * haptic at every stop.
 *
 * Props: label, options ([{ value, label }] in order), value (an option's
 * value, or null), onChange, ends ([node, node], optional)
 */
const PART = component.option;
const RAIL_H = component.axis.rail.height;
const INSET = component.axis.rail.inset;
const HANDLE = PART.needle.w;
const BORDER = PART.rail.width;
const INNER_H = RAIL_H - 2 * BORDER;
const BAND_PAD = (size.tapTarget - RAIL_H) / 2;

/** The ✕'s 44 target: up and down to 44, left into the gap, right into the padding. */
const CLEAR_SLOP = (() => {
  const v = (size.tapTarget - size.axis.clear) / 2;
  return { top: v, bottom: v, left: space[6], right: size.tapTarget - size.axis.clear - space[6] };
})();

function OptionSlider({ label, options, value = null, onChange, ends }) {
  const last = options.length - 1;
  const index = value == null ? null : options.findIndex((o) => o.value === value);
  const committed = index != null && index >= 0 ? index : null;
  const { gesture, onTrackLayout, live, move, shown } = useStopSlider({
    last,
    committed,
    onCommit: (i) => onChange?.(options[i].value),
    logName: `option:${label}`,
  });
  const at = live ?? committed;
  const word = at != null ? options[at].label : null;

  const a11y = {
    accessible: true,
    accessibilityRole: 'adjustable',
    accessibilityLabel: label,
    accessibilityValue: { text: committed == null ? 'Not recorded' : options[committed].label },
    accessibilityActions: [{ name: 'increment' }, { name: 'decrement' }, ...(committed != null ? [{ name: 'clear', label: 'Clear' }] : [])],
    onAccessibilityAction: (e) => {
      const name = e.nativeEvent.actionName;
      if (name === 'increment') onChange?.(options[committed == null ? 0 : Math.min(last, committed + 1)].value);
      if (name === 'decrement' && committed != null) onChange?.(options[Math.max(0, committed - 1)].value);
      if (name === 'clear') onChange?.(null);
    },
  };

  return (
    <View style={styles.block}>
      <Text variant="labelEyebrow" color="muted">
        {label}
      </Text>
      <View style={styles.line} {...a11y}>
        <GestureDetector gesture={gesture}>
          {/* The 44 touch band: a real view BAND_PAD over and under the track (layout unchanged). */}
          <View style={styles.band}>
            <View style={styles.track} onLayout={onTrackLayout}>
              <View style={styles.ticks} pointerEvents="none">
                {options.map((o, i) => (
                  <View key={o.value} style={[styles.tick, { left: `${(i / last) * 100}%` }]} />
                ))}
              </View>
              <Animated.View pointerEvents="none" style={[styles.handle, move, shown]}>
                <View style={styles.grip} />
              </Animated.View>
              {at == null ? (
                <View style={styles.emptyLabel} pointerEvents="none">
                  <Text variant="axisEmpty" color="placeholder" style={styles.patch}>
                    Not recorded
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </GestureDetector>
        <Text variant="axisLabel" color="primary" numberOfLines={1} style={styles.word}>
          {word ?? ''}
        </Text>
        <View style={styles.clear}>
          {committed != null && live == null ? <ClearButton variant="square" hitSlop={CLEAR_SLOP} accessibilityLabel={`Clear ${label}`} onPress={() => onChange?.(null)} /> : null}
        </View>
      </View>
      {ends ? (
        <View style={styles.legendLine} importantForAccessibility="no-hide-descendants">
          <View style={styles.legend}>
            {ends[0]}
            {ends[1]}
          </View>
          {/* Width only: the legend line is as tall as its flames (a 24-tall ✕ spacer made it 10 taller). */}
          <View style={styles.wordSpace} />
          <View style={styles.clearSpace} />
        </View>
      ) : null}
    </View>
  );
}

export default memo(OptionSlider);

const styles = StyleSheet.create({
  block: {
    gap: space[8],
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  band: {
    flex: 1,
    marginVertical: -BAND_PAD,
    paddingVertical: BAND_PAD,
  },
  track: {
    height: RAIL_H,
    borderWidth: BORDER,
    borderColor: PART.rail.color,
    backgroundColor: PART.rail.background,
  },
  ticks: {
    position: 'absolute',
    left: INSET + HANDLE / 2,
    right: INSET + HANDLE / 2,
    top: 0,
    bottom: 0,
  },
  tick: {
    position: 'absolute',
    top: (INNER_H - PART.tick.h) / 2,
    marginLeft: -PART.tick.w / 2,
    width: PART.tick.w,
    height: PART.tick.h,
    backgroundColor: PART.rail.tick,
  },
  handle: {
    position: 'absolute',
    left: INSET,
    top: (INNER_H - HANDLE) / 2,
    width: HANDLE,
    height: HANDLE,
    backgroundColor: PART.needle.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grip: {
    width: component.axis.grip.w,
    height: component.axis.grip.h,
    backgroundColor: PART.needle.grip,
  },
  emptyLabel: {
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
  word: {
    width: size.option.word,
    marginLeft: space[8],
  },
  clear: {
    width: size.axis.clear,
    height: size.axis.clear,
    marginLeft: space[6],
  },
  wordSpace: {
    width: size.option.word,
    marginLeft: space[8],
  },
  clearSpace: {
    width: size.axis.clear,
    marginLeft: space[6],
  },
  legendLine: {
    flexDirection: 'row',
  },
  legend: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
