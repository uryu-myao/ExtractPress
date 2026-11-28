import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { color, motion, shape, size, space, spacing, state } from '../theme/tokens';
import Text from './base/Text';

/**
 * The My beans / My gear tabs (Round 14; beans first since 2026-11-17): the
 * heading of Home's shelf (17a / 17b) and of Beans & gear (17c / 17d). No box, no folder tabs: two
 * labels, each with its count, set as a section heading.
 *
 * A tab: label.caps label, then its count in label.caps (Round 14 §0,
 * 2026-10-27: the mock's 13 / .06em and 12 / .04em fold to it), gap.tight
 * apart. Open: ink label, accent count, a box-wide (2) ink underline.
 * Closed: muted label and count, no underline. size.tapTarget tall, the text
 * at its foot, space.8 over the underline (LABEL_FOOT; Uryu, 2026-11-25: a
 * little more air over the divider than 11-17's space.6; 11-17 brought it
 * down from space.12). One underline slides between the tabs (TabIndicator,
 * Uryu 2026-11-27: was one fading out as the other faded in), its position
 * and width following the pages' scroll (`progress`) under the finger; the
 * labels switch at the midpoint.
 *
 * The row sits on the first row's divider (shape.borderWidth.divider) below
 * it: it overlaps the content under it by the divider plus half of what the
 * underline is wider, so the underline lands centred on the divider and the
 * two read as one line (the mock's −1.75).
 *
 * Tabs space.20 apart (the mock's 22 is layout.gutter, the screen's edge, not
 * a gap; 20 is the nearest step). Having no surface, a tab presses by scale
 * (state.pressed.scale over motion.press), as a text button.
 *
 * Props
 *   active    'beans' | 'gear'
 *   progress  Animated 0 (beans) … 1 (gear), from useShelfPager
 *   counts    { gear, beans }
 *   onSelect  (side) => void
 *   trailing  optional node at the row's right end, its text on the
 *             tabs' baseline (Home's "See all", 17c's slot count). The row
 *             aligns by baseline, not by a matching padding (Uryu,
 *             2026-11-25: the padding kept 11-17's old space.12 and sat 6
 *             higher; and "See all" centres its label on a 16 chevron, a
 *             line taller than the label, so even a matching padding left
 *             it ~1.5 high)
 */
export const TAB_OVERLAP = shape.borderWidth.divider + (shape.borderWidth.box - shape.borderWidth.divider) / 2;

/**
 * The shelf's two sides, in order: beans first, then gear (Uryu,
 * 2026-11-17: everywhere the two stand side by side; was gear first). The
 * first is the pager's left page (progress 0) and where it opens.
 */
export const SIDES = ['beans', 'gear'];
const [FIRST, SECOND] = SIDES;

/** From a tab label's foot to the tab's foot: the gap, then the underline. */
const LABEL_FOOT = space[8] + shape.borderWidth.box;

const TABS = [
  { side: 'beans', label: 'My beans' },
  { side: 'gear', label: 'My gear' },
];

export default function ShelfTabs({ active, progress, counts, onSelect, trailing }) {
  const [layouts, onTabLayout] = useTabLayouts(TABS.length);
  return (
    <View style={styles.row} accessibilityRole="tablist">
      <View style={styles.tabs}>
        {TABS.map((t, i) => (
          <Tab key={t.side} label={t.label} count={counts[t.side]} on={active === t.side} onLayout={onTabLayout(i)} onPress={() => onSelect(t.side)} />
        ))}
        <TabIndicator layouts={layouts} position={progress} />
      </View>
      {trailing}
    </View>
  );
}

const pressEasing = Easing.bezier(...motion.press.controlPoints);

/**
 * Each tab's place in its row ({ x, width }, from onLayout), for
 * TabIndicator. Returns [layouts, onTabLayout(i)]; layouts is null until
 * every tab has been laid out.
 */
export function useTabLayouts(count) {
  const [layouts, setLayouts] = useState(() => Array(count).fill(null));
  const onTabLayout = (i) => (e) => {
    const { x, width } = e.nativeEvent.layout;
    setLayouts((prev) => {
      if (prev[i] && prev[i].x === x && prev[i].width === width) return prev;
      const next = prev.length === count ? [...prev] : Array(count).fill(null);
      next[i] = { x, width };
      return next;
    });
  };
  return [layouts.every(Boolean) && layouts.length === count ? layouts : null, onTabLayout];
}

/** The indicator's own width: scaled to each tab's (native driver: no width animation). */
const BAR = 100;

/**
 * The open tab's underline as one bar that slides between the tabs (Uryu,
 * 2026-11-27: every tab row, instead of one underline fading into the
 * next): a box-wide (2) ink line at the row's foot, moved and stretched to
 * the tab at `position` (Animated, in tab indexes: 0 … n − 1; between two,
 * between their places). Drawn in the tabs' row, after them, absolute.
 * Nothing until every tab is laid out.
 */
export function TabIndicator({ layouts, position }) {
  if (!layouts) return null;
  const inputRange = layouts.map((_, i) => i);
  const single = layouts.length === 1;
  const translateX = single ? layouts[0].x : position.interpolate({ inputRange, outputRange: layouts.map((l) => l.x), extrapolate: 'clamp' });
  const scaleX = single ? layouts[0].width / BAR : position.interpolate({ inputRange, outputRange: layouts.map((l) => l.width / BAR), extrapolate: 'clamp' });
  return <Animated.View pointerEvents="none" style={[styles.indicator, { transform: [{ translateX }, { scaleX }] }]} />;
}

/**
 * One tab, also search's (Design Round 15, 18d: "Home's tab component").
 * Its underline is the row's TabIndicator; `underline` (an opacity) is only
 * for a row that has none. count is optional (search's ALL has none).
 */
export function Tab({ label, count, on, underline, onPress, onLayout }) {
  const scale = useRef(new Animated.Value(1)).current;
  const scaleTo = (toValue) =>
    Animated.timing(scale, { toValue, duration: motion.press.duration, easing: pressEasing, useNativeDriver: true }).start();
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => scaleTo(state.pressed.scale)}
      onPressOut={() => scaleTo(1)}
      accessibilityRole="tab"
      accessibilityLabel={count == null ? label : `${label}, ${count}`}
      accessibilityState={{ selected: on }}
      onLayout={onLayout}
      style={styles.tab}>
      {underline == null ? null : <Animated.View style={[styles.underline, { opacity: underline }]} />}
      <Animated.View style={[styles.text, { transform: [{ scale }] }]}>
        <Text variant="labelCaps" color={on ? 'primary' : 'muted'}>
          {label}
        </Text>
        {count == null ? null : (
          <Text variant="labelCaps" color={on ? 'accent' : 'muted'}>
            {count}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

/**
 * The two sides as pages in a horizontal Animated.ScrollView (Home's shelf,
 * Beans & gear), in SIDES' order. `span` is how far the pages scroll from
 * the first to the second. Returns the open side, the scroll's progress (0
 * beans … 1 gear) for
 * ShelfTabs, select(side) for a tab, and the props for the ScrollView.
 *
 * The open side follows the scroll past the midpoint, except while a tab's
 * own scroll runs: it passes through the old side's half, and following it
 * there flipped the tab and the slot count back and forth (Uryu, on device,
 * 2026-10-27). A drag, or the scroll's end, hands it back to the scroll.
 */
export function useShelfPager(span, openOn = FIRST) {
  const [side, setSide] = useState(openOn);
  const ref = useRef(null);
  const current = useRef(openOn);
  const tapped = useRef(false);
  const scrollX = useRef(new Animated.Value(openOn === SECOND ? span : 0)).current;
  const show = (next) => {
    if (current.current === next) return;
    current.current = next;
    setSide(next);
  };
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
        listener: (e) => {
          if (!tapped.current) show(e.nativeEvent.contentOffset.x > span / 2 ? SECOND : FIRST);
        },
      }),
    [scrollX, span]
  );
  const release = () => {
    tapped.current = false;
  };
  const select = (next) => {
    tapped.current = true;
    show(next);
    ref.current?.scrollTo({ x: next === SECOND ? span : 0, animated: true });
  };
  const progress = scrollX.interpolate({ inputRange: [0, span], outputRange: [0, 1], extrapolate: 'clamp' });
  return { side, progress, select, scrollProps: { ref, onScroll, scrollEventThrottle: 16, onScrollBeginDrag: release, onMomentumScrollEnd: release } };
}

const fadeEasing = Easing.bezier(...motion.expand.controlPoints);
const FADE = motion.expand.duration / 2;

/**
 * 17c's slot count at the tab row's right end: "7 / 8" (label.caps, accent)
 * then "In my kit" (meterLabel, muted), space.6 apart, on one baseline.
 * When the side changes it crossfades, out then in, over one motion.expand,
 * rather than swapping in a frame.
 */
export function SlotCount({ value, label }) {
  const [shown, setShown] = useState({ value, label });
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (shown.value === value && shown.label === label) {
      // Back to what is shown before the fade finished: bring it back up.
      Animated.timing(opacity, { toValue: 1, duration: FADE, easing: fadeEasing, useNativeDriver: true }).start();
      return;
    }
    if (shown.label === label) {
      // Same side, a new count (a bag added): no fade.
      setShown({ value, label });
      return;
    }
    Animated.timing(opacity, { toValue: 0, duration: FADE, easing: fadeEasing, useNativeDriver: true }).start(({ finished }) => {
      if (!finished) return;
      setShown({ value, label });
      Animated.timing(opacity, { toValue: 1, duration: FADE, easing: fadeEasing, useNativeDriver: true }).start();
    });
  }, [value, label]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View style={[styles.slot, { opacity }]} accessible accessibilityLabel={`${value} ${label}`}>
      <Text variant="labelCaps" color="accent">
        {shown.value}
      </Text>
      <Text variant="meterLabel" color="muted">
        {shown.label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Baseline: a tab's is its label's, the trailing's its first text's.
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.gap.section,
    marginBottom: -TAB_OVERLAP,
    zIndex: 1,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space[20],
  },
  tab: {
    minHeight: size.tapTarget,
    justifyContent: 'flex-end',
    paddingBottom: LABEL_FOOT,
  },
  underline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: shape.borderWidth.box,
    backgroundColor: color.border.strong,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: BAR,
    height: shape.borderWidth.box,
    backgroundColor: color.border.strong,
    transformOrigin: 'left',
  },
  text: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.gap.tight,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space[6],
  },
});
