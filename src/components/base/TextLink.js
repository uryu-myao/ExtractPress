import { useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { motion, size, state } from '../../theme/tokens';
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
 */
const pressEasing = Easing.bezier(...motion.press.controlPoints);

export default function TextLink({ label, onPress, accessibilityLabel }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (toValue) => Animated.timing(scale, { toValue, duration: motion.press.duration, easing: pressEasing, useNativeDriver: true }).start();
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => to(state.pressed.scale)}
      onPressOut={() => to(1)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={styles.hit}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Text variant="textLink" color="primary" style={styles.underline}>
          {label}
        </Text>
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
  underline: {
    textDecorationLine: 'underline',
  },
});
