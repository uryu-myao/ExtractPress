import { useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { color, icon, motion, size, state } from '../../theme/tokens';
import Glyph from './Glyph';

/**
 * Clear (2026-10-17, ours; no mock): the × at the right end of a one-line
 * text field while it holds text (BagForm's fields, SearchField). A press
 * empties the field.
 *
 *   glyph    close, icon.sm, icon.muted: a secondary action, quieter than
 *            the ink value beside it
 *   touch    a size.tapTarget (44) square, pulled back by the glyph's
 *            inset on the right, so the glyph's right edge sits on the
 *            field's own edge (BagForm: the underline's end; SearchField:
 *            its padding, mirroring the search glyph)
 *   pressed  surface-less, so the glyph scales (§1 Pressed)
 *
 * variant 'square' (Turn 29, 30b: 5b's axis rows): a size.axis.clear (24)
 * square on surface.sunken, no frame, with icon.clear (12) in
 * text.secondary. The fill says "this is a button" without an ink frame
 * shouting it. Its touch area is size.tapTarget (44) through hitSlop:
 * the caller says how far it may reach on each side (5b: into the row's
 * padding, never over the track).
 *
 * Props: onPress, accessibilityLabel (default "Clear"), variant, hitSlop
 */
const pressEasing = Easing.bezier(...motion.press.controlPoints);
const INSET = (size.tapTarget - icon.sm.size) / 2;

export default function ClearButton({ onPress, accessibilityLabel = 'Clear', variant = 'plain', hitSlop }) {
  const scale = useRef(new Animated.Value(1)).current;
  const scaleTo = (toValue) =>
    Animated.timing(scale, { toValue, duration: motion.press.duration, easing: pressEasing, useNativeDriver: true }).start();
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => scaleTo(state.pressed.scale)}
      onPressOut={() => scaleTo(1)}
      style={variant === 'square' ? null : styles.hit}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      {variant === 'square' ? (
        <Animated.View style={[styles.square, { transform: [{ scale }] }]}>
          <Glyph name="close" token={icon.clear} color={color.text.secondary} />
        </Animated.View>
      ) : (
        <Animated.View style={{ transform: [{ scale }] }}>
          <Glyph name="close" token={icon.sm} color={color.icon.muted} />
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: size.tapTarget,
    height: size.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -INSET,
  },
  square: {
    width: size.axis.clear,
    height: size.axis.clear,
    backgroundColor: color.surface.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
