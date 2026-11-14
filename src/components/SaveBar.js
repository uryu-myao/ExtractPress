import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, layout, motion, shape, space, spacing } from '../theme/tokens';
import Button from './base/Button';
import Text from './base/Text';

/**
 * The Save bar of every page that edits in place (19a the bag, 3e the gear,
 * 11a the cup): absent until the first edit, then pinned at the foot,
 * outside the scroll. Drawn as 32a (Turn 31, 2026-11-14): ONE ROW, the
 * count of changes on the left, "Save changes" on the right.
 *
 *   count    "1 change" / "3 changes": textStyle.saveCount (13 / 600,
 *            tabular), text.secondary. One per field that differs from what
 *            is stored, counted by the page (a bag's name and roaster are 2).
 *   button   Button primary, size 'bar': 44 tall, sized to its label
 *            (buttonCapsBar), shadow.floating
 *   note     optional, under the row: bodySmTabular, text.secondary (19a /
 *            3e: "Applies to the N cups already logged …"). 32a draws no
 *            note; kept because it says the save rewrites past cups.
 *   panel    raised, a box-wide border.container rule on top, space.14 over
 *            its content (32a; was space.20), the screen gutter at the sides,
 *            the home indicator's inset under it
 *
 * It rises over motion.expand: the height leads (0 → its own), the fade
 * follows (from halfway); reverting every edit takes it back the same way,
 * showing the last count while it goes (never "0 changes"). It sits under
 * the page in one column, so as it grows the page above shrinks by the same
 * height: nothing is covered (the end actions stay reachable).
 *
 * Props: changes (a count; 0 hides the bar), onSave, note
 */
const easing = Easing.bezier(...motion.expand.controlPoints);

export const changesLabel = (n) => `${n} ${n === 1 ? 'change' : 'changes'}`;

export default function SaveBar({ changes, onSave, note }) {
  const visible = changes > 0;
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);
  // The count shown: the last non-zero one, so the bar never reads "0 changes" on its way out.
  const [shownCount, setShownCount] = useState(changes);
  useEffect(() => {
    if (changes > 0) setShownCount(changes);
  }, [changes]);
  const shown = useRef(new Animated.Value(visible ? 1 : 0)).current;
  useEffect(() => {
    // Height is a layout property: the JS driver.
    Animated.timing(shown, { toValue: visible ? 1 : 0, duration: motion.expand.duration, easing, useNativeDriver: false }).start();
  }, [shown, visible]);
  return (
    <Animated.View
      style={[styles.clip, { height: shown.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) }]}
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}>
      <Animated.View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          setHeight((prev) => (prev === h ? prev : h));
        }}
        style={[styles.panel, { paddingBottom: Math.max(insets.bottom, layout.screen.bottom), opacity: shown.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] }) }]}>
        <View style={styles.row}>
          <Text variant="saveCount" color="secondary" accessibilityLiveRegion="polite">
            {changesLabel(shownCount)}
          </Text>
          <Button label="Save changes" size="bar" onPress={onSave} />
        </View>
        {note ? (
          <Text variant="bodySmTabular" color="secondary">
            {note}
          </Text>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  // Measured at its own height, whatever the clip's. Anchored to the foot,
  // so as the clip grows the panel rises from the bottom edge.
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: space[14],
    paddingHorizontal: layout.gutter,
    gap: spacing.gap.row,
    backgroundColor: color.surface.raised,
    borderTopWidth: shape.borderWidth.box,
    borderTopColor: color.border.container,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[12],
  },
});
