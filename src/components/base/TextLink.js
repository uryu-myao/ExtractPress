import { useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { color, icon, motion, size, space, state } from '../../theme/tokens';
import Glyph from './Glyph';
import Text from './Text';

/**
 * A text action in sentence case (32e / 32f: a sheet's Clear, "Use “Atlantis”
 * as written", Choose origin first): textStyle.textLink (13 / 600), ink,
 * UNDERLINED (§1: a text-only action is underlined; colour alone never marks
 * pressable). A size.tapTarget (44) tall touch area; having no surface, it
 * presses by scale (state.pressed.scale over motion.press), as Button text.
 * Button `text` is its caps sibling (label.caps) for bars and rows.
 *
 * Props: label, onPress, accessibilityLabel
 *   glyph     a glyph after the label, icon.sm in ink, not underlined (28e's
 *             Support more ⌄ / Show less ⌃)
 *   centered  sits in the middle of its column instead of at the start
 */
const pressEasing = Easing.bezier(...motion.press.controlPoints);

export default function TextLink({ label, onPress, accessibilityLabel, glyph, centered = false }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (toValue) => Animated.timing(scale, { toValue, duration: motion.press.duration, easing: pressEasing, useNativeDriver: true }).start();
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => to(state.pressed.scale)}
      onPressOut={() => to(1)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.hit, centered && styles.centered]}>
      <Animated.View style={[styles.line, { transform: [{ scale }] }]}>
        <Text variant="textLink" color="primary" style={styles.underline}>
          {label}
        </Text>
        {glyph ? <Glyph name={glyph} token={icon.sm} color={color.text.primary} /> : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    minHeight: size.tapTarget,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  centered: {
    alignSelf: 'center',
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  underline: {
    textDecorationLine: 'underline',
  },
});
