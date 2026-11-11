import { useEffect, useRef } from 'react';
import { Animated, Easing, Linking, StyleSheet, View } from 'react-native';
import { flavourFilter } from '../constants/search';
import { requestPush, requestShell } from '../navigation';
import { color, icon, motion, shape, size, space, spacing } from '../theme/tokens';
import Button from './base/Button';
import Glyph from './base/Glyph';
import Text from './base/Text';

/**
 * Try next on Home (Design Round 23, 25c / 25d; design/try-next-v1.md), under
 * the Taste DNA card. Home renders it only when there is a suggestion
 * (repository.ts loadTryNext): no placeholder, no teaser.
 *
 * A note, not a record: ground inside a quiet frame (surface.ground, 2px
 * border.container), inset.container (14 / 16) with 6 at the foot, the 44
 * actions carrying their own room. The card itself isn't pressable.
 *   eyebrow  spark glyph + "TRY NEXT", labelEyebrow, text.accent
 *   title    display.sm ("Guji in the AeroPress?")
 *   reason   one line of facts, text.secondary
 *   actions  the kind's secondary button (44, row size) + "Not for me" (text)
 * Actions by kind:
 *   brewer  Log a cup     the Record sheet with that bag and brewer preselected
 *   bag     Add it to my beans   3c with name and roaster filled in
 *   cafe    Open in Maps  Apple Maps on the café (leaves the app)
 *   tag     See the ‹n› cups     search on those cups (that flavour, 5★)
 *
 * "Not for me": the card becomes, in the same frame, the 52 line "Hidden. It
 * won't come back." with Undo; crossfaded over motion.expand. The dismissal
 * is written at once and Undo deletes it (25d commits it when Home is left;
 * the result is the same). Home shows the next suggestion, or none, the next
 * time it is shown.
 *
 * Token gaps, reported to Design: 25c sets the reason and the hidden line at
 * 13 / 1.45, a size with no text style; they take `body` (14 / 21). The spark
 * is icon.sm (16; the handoff's table) where 25c's text says 14.
 *
 * Props: suggestion, hidden, onDismiss, onUndo
 */
const expandEasing = Easing.bezier(...motion.expand.controlPoints);

function act(suggestion) {
  switch (suggestion.kind) {
    case 'brewer':
      return { label: 'Log a cup', onPress: () => requestShell({ record: { bag: suggestion.bag, brewer: suggestion.brewer } }) };
    case 'bag':
      return { label: 'Add it to my beans', onPress: () => requestPush({ name: 'addBag', prefill: { name: suggestion.name, roaster: suggestion.roaster ?? '' } }) };
    case 'cafe': {
      const { name, lat, lng } = suggestion.place;
      // TODO: 25d hands Maps "the stored MapKit id". A place-id link isn't
      // verified on iOS 17, so this opens the café by name at its coordinates.
      const url = `https://maps.apple.com/?q=${encodeURIComponent(name)}${lat != null && lng != null ? `&ll=${lat},${lng}` : ''}`;
      return { label: 'Open in Maps', onPress: () => Linking.openURL(url) };
    }
    case 'tag':
      return { label: `See the ${suggestion.count} cups`, onPress: () => requestPush({ name: 'search', filter: flavourFilter(suggestion.tag, 5) }) };
    default:
      return null;
  }
}

export default function TryNextCard({ suggestion, hidden, onDismiss, onUndo }) {
  const fade = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: motion.expand.duration, easing: expandEasing, useNativeDriver: true }).start();
  }, [hidden, fade]);

  const action = act(suggestion);
  return (
    <View style={styles.card}>
      <Animated.View style={{ opacity: fade }}>
        {hidden ? (
          <View style={styles.hiddenLine}>
            <Text variant="body" color="secondary" style={styles.hiddenText}>
              Hidden. It won't come back.
            </Text>
            <Button variant="text" label="Undo" onPress={onUndo} />
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.eyebrow}>
              <Glyph name="spark" token={icon.sm} color={color.text.accent} />
              <Text variant="labelEyebrow" color="accent">
                Try next
              </Text>
            </View>
            <Text variant="displaySm" color="primary" style={styles.after6}>
              {suggestion.title}
            </Text>
            <Text variant="body" color="secondary" style={styles.after6}>
              {suggestion.reason}
            </Text>
            <View style={styles.actions}>
              {action ? (
                <View style={styles.button}>
                  <Button variant="secondary" size="row" label={action.label} onPress={action.onPress} />
                </View>
              ) : null}
              <Button variant="text" label="Not for me" onPress={onDismiss} />
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.container,
    backgroundColor: color.surface.ground,
    paddingHorizontal: spacing.inset.container.h,
  },
  content: {
    paddingTop: spacing.inset.container.v,
    paddingBottom: space[6],
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[6],
  },
  after6: {
    marginTop: space[6],
  },
  actions: {
    marginTop: space[12],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[16],
  },
  button: {
    flexShrink: 1,
  },
  // 25d: a 52 line in the same frame (size.control.row).
  hiddenLine: {
    height: size.control.row,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[16],
  },
  hiddenText: {
    flex: 1,
  },
});
