import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { NOTICES } from '../constants/notices';
import { useDatabase } from '../data/DatabaseProvider';
import { asSqlDb } from '../data/migrate';
import { countUnreadNotices, onNoticesChanged } from '../data/notices';
import { requestPush } from '../navigation';
import { color, icon, motion, shape, size, space, state } from '../theme/tokens';
import Glyph from './base/Glyph';

/**
 * Home's bell, the way into 7a (4a, 23b; Design Round 26 C1, 28c).
 *
 *   glyph   the bell, icon.lg, ink. A bare glyph: pressed, it scales
 *           (§1 Pressed, surface-less); hitSlop pads it to size.tapTarget
 *   dot     while anything is unread: the 8 × 8 blue square (action.bg) at
 *           the glyph's top-right, with a 2px ground ring so it separates
 *           from the stroke. The same mark as 7a's unread rows. Never a
 *           count: a few notices shouldn't look like a backlog
 *   none    the glyph alone; still the way into 7a
 *   a11y    "Notifications, 1 unread" / "Notifications"
 */
const pressEasing = Easing.bezier(...motion.press.controlPoints);
const SLOP = (size.tapTarget - icon.lg.size) / 2;
const DOT = space[8];
const RING = shape.borderWidth.box;

export default function BellButton() {
  const db = useDatabase();
  const [unread, setUnread] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;
  const scaleTo = (toValue) => Animated.timing(scale, { toValue, duration: motion.press.duration, easing: pressEasing, useNativeDriver: true }).start();

  useEffect(() => {
    let alive = true;
    const load = () => countUnreadNotices(asSqlDb(db), NOTICES).then((n) => alive && setUnread(n));
    load();
    const off = onNoticesChanged(load);
    return () => {
      alive = false;
      off();
    };
  }, [db]);

  return (
    <Pressable
      onPress={() => requestPush({ name: 'notifications' })}
      onPressIn={() => scaleTo(state.pressed.scale)}
      onPressOut={() => scaleTo(1)}
      hitSlop={SLOP}
      accessibilityRole="button"
      accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Glyph name="bell" token={icon.lg} color={color.text.primary} />
        {unread ? <View style={styles.dot} /> : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    top: -RING,
    right: -RING,
    width: DOT + 2 * RING,
    height: DOT + 2 * RING,
    borderWidth: RING,
    borderColor: color.surface.ground,
    backgroundColor: color.action.bg,
  },
});
