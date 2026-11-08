import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TABS } from '../constants/navigation';
import { color, component, layout, motion, shadow, shape, size, space, spacing, state } from '../theme/tokens';
import HardShadow from './base/HardShadow';
import Text from './base/Text';
import { AddCoffeeIcon, HomeIcon, ProfileIcon, RecordsIcon } from './icons/TabBarIcons';

const ICONS = { home: HomeIcon, records: RecordsIcon, profile: ProfileIcon };
const { slot, glyph, icon: iconColor } = component.tabBar;

/**
 * Bottom bar (design-system.md §9; Design Round 23, 25a / 25b, 2026-11-08):
 * two pieces, floating.
 *   body  the three tabs, Home · Records · Profile. Chrome: surface.raised, a
 *         2px border.container frame, no shadow (2026-10-05: elevation over a
 *         full list read as noise). Its three slots share its width; each is
 *         the whole touch area.
 *   +     the screen's primary action, to the body's right, space.12 apart:
 *         a size.tabBar.height square in color.action.bg, a 2px border.strong
 *         frame and shadow.floating. No name ("Log a cup" to VoiceOver).
 * Both are size.tabBar.height (56) tall, square-cornered, inset by
 * layout.gutter at the sides, the home-indicator inset less space.8 above the
 * bottom edge.
 *
 * The band: from space.12 above the bar to the screen's bottom edge, content
 * doesn't show. AppShell ends the tab pager that far above the edge
 * (useFooterHeight), so the fixed DotTexture shows through: plain ground, no
 * rule, no fade.
 *
 * Each tab names itself under its glyph (2026-10-18): tabLabel, gap.tight
 * below the glyph, in the glyph's colour, so the active blue covers both.
 *
 * Pressed (§1): the tab icons are bare glyphs, so they scale to
 * state.pressed.scale over motion.press (the name with them). The + is a blue
 * fill, which has a darker tier, so it darkens to state.pressed.action and
 * doesn't scale (it scaled as an ink square, 2026-10-18 to 2026-11-08). Its
 * frame and shadow don't change. Both give a light impact haptic.
 *
 * Was (2026-10-05 to 2026-11-08): one full-width bar on the bottom edge with
 * a 2px top rule; five, then four equal slots with the ink + among them.
 */

/**
 * Under the bar: the home-indicator inset less space.8 (26 on notched
 * iPhones, 2026-10-15). TODO: an iPhone without a home indicator (SE) has no
 * inset, and the floating bar would sit on the edge; space.12 there is ours,
 * not drawn (Design to confirm).
 */
const bottomGap = (insets) => Math.max(insets.bottom - space[8], space[12]);

/**
 * The band's height, from space.12 above the bar to the screen's bottom edge
 * (94 on notched iPhones). The tab pager ends here; 13b's notice sits
 * space.12 above it.
 */
export function useFooterHeight() {
  const insets = useSafeAreaInsets();
  return space[12] + size.tabBar.height + bottomGap(insets);
}

export default function FooterNav({ activeTab, position, hidden, onTabPress, onAddPress }) {
  const insets = useSafeAreaInsets();
  // hidden: 0 → in place, 1 → its whole height below the screen edge.
  const bandHeight = useFooterHeight();
  const slide = hidden ? { transform: [{ translateY: hidden.interpolate({ inputRange: [0, 1], outputRange: [0, bandHeight] }) }] } : null;

  return (
    <Animated.View style={[styles.wrapper, { paddingBottom: bottomGap(insets) }, slide]} pointerEvents="box-none">
      <View style={styles.body}>
        {TABS.map(({ key, label }) => {
          const Icon = ICONS[key];
          const page = TABS.findIndex((t) => t.key === key);
          return (
            <Tab key={key} label={label} selected={key === activeTab} onPress={() => onTabPress(key)}>
              {position ? (
                <PagerTab Icon={Icon} label={label} page={page} position={position} />
              ) : (
                <TabContent Icon={Icon} label={label} isActive={key === activeTab} />
              )}
            </Tab>
          );
        })}
      </View>
      <AddButton onPress={onAddPress} />
    </Animated.View>
  );
}

const pressEasing = Easing.bezier(...motion.press.controlPoints);

const lightImpact = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/** A tab's glyph, centred in its 20 box, and its name under it, in one colour. */
function TabContent({ Icon, label, isActive = false }) {
  return (
    <View style={styles.tab}>
      <View style={styles.glyph}>
        <Icon isActive={isActive} />
      </View>
      <Text variant="tabLabel" color={isActive ? iconColor.active : iconColor.inactive}>
        {label}
      </Text>
    </View>
  );
}

/**
 * The active state follows the pager continuously, not only on settle: the
 * active glyph and name are laid over the inactive ones and their opacity
 * tracks the pager position (1 on its page, 0 one page away). Native driver,
 * so it moves on the UI thread with the drag. Opacity here is a crossfade
 * between two states, not press feedback, so the §1 no-opacity rule for
 * pressed does not apply.
 */
function PagerTab({ Icon, label, page, position }) {
  const opacity = position.interpolate({
    inputRange: [page - 1, page, page + 1],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });
  return (
    <View>
      <TabContent Icon={Icon} label={label} />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <TabContent Icon={Icon} label={label} isActive />
      </Animated.View>
    </View>
  );
}

/** A tab slot: the whole slot is the touch area; only the glyph and name scale. */
function Tab({ label, selected, onPress, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  const scaleTo = (toValue) =>
    Animated.timing(scale, { toValue, duration: motion.press.duration, easing: pressEasing, useNativeDriver: true }).start();
  return (
    <Pressable
      onPress={() => {
        lightImpact();
        onPress();
      }}
      onPressIn={() => scaleTo(state.pressed.scale)}
      onPressOut={() => scaleTo(1)}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={styles.slotTouch}>
      <Animated.View style={[styles.slotBox, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** The +: blue, framed, with the floating hard shadow; it darkens when pressed. */
function AddButton({ onPress }) {
  return (
    <HardShadow shadow={shadow.floating} style={styles.add}>
      <Pressable
        onPress={() => {
          lightImpact();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel="Log a cup"
        style={({ pressed }) => [styles.addFace, pressed && styles.addPressed]}>
        <AddCoffeeIcon />
      </Pressable>
    </HardShadow>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: space[12],
    paddingHorizontal: layout.gutter,
  },
  body: {
    flex: 1,
    height: size.tabBar.height,
    flexDirection: 'row',
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.container,
    backgroundColor: color.surface.raised,
  },
  slotTouch: {
    flexBasis: 0,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBox: {
    width: slot.w,
    height: slot.h,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    alignItems: 'center',
    gap: spacing.gap.tight,
  },
  glyph: {
    height: glyph,
    justifyContent: 'center',
  },
  add: {
    width: size.tabBar.height,
    height: size.tabBar.height,
  },
  addFace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.strong,
    backgroundColor: color.action.bg,
  },
  addPressed: {
    backgroundColor: state.pressed.action,
  },
});
