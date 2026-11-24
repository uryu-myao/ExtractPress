import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import BagTile, { CAPTION_HEIGHT } from './BagTile';
import GearTile from './GearTile';
import ShelfTabs, { SIDES } from './ShelfTabs';
import { useDatabase } from '../data/DatabaseProvider';
import { sortDrinkFirst } from '../constants/bagDates';
import { listGearWithUse, listShelfBags, onCupsChanged, onShelfChanged } from '../data/repository';
import { color, component, dashed, icon, layout, motion, shape, state } from '../theme/tokens';
import DotGround from './base/DotGround';
import Button from './base/Button';
import Glyph from './base/Glyph';
import Text from './base/Text';

/**
 * Home's My beans / My gear (Round 14, 17a / 17b; redrawn by Design Round 31
 * v2: beans 37a / 37b, gear the addendum's 37b, 2026-11-24). Beans first,
 * then gear (Uryu, 2026-11-17).
 *
 * Heading: ShelfTabs, with the live counts, and "See all" at its right end
 * (37a), which opens Beans & gear on the open side. The two sides are TABS,
 * not swiped pages (37a): each side's row scrolls sideways itself, so it
 * can't sit in a sideways pager. A tab's underline fades over motion.expand.
 *
 * Both sides are one shelf (37o): a row of tiles (144 × 192, space.12
 * apart) that scrolls sideways out to the screen's edges, the next tile
 * peeking, on the dot grid (DotGround), which runs edge to edge from the
 * tabs' divider (shape.borderWidth.divider, border.soft; the open tab's
 * underline sits centred on it) to below the captions. A tile opens its
 * page (3g, 3e). No buttons on Home: the shelf is for looking (37c).
 *   beans  BagTile, every bag on the shelf, drink-first (sortDrinkFirst)
 *   gear   GearTile, every piece, the defaults first, then the most used
 * Empty, the same section holds a dashed add tile (37l): beans with a few
 * words beside it; gear alone (TODO(Design): the empty gear shelf isn't
 * drawn; it has the beans' tile without the words).
 *
 * Props: onSeeAll(side), onAddBag, onAddGear, onOpenBag(bag), onOpenGear(gear)
 */
export default function ShelfBlock({ onSeeAll, onAddBag, onAddGear, onOpenBag, onOpenGear }) {
  const db = useDatabase();
  const [shelf, setShelf] = useState(null);
  const [side, setSide] = useState(SIDES[0]);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const load = () =>
      Promise.all([listShelfBags(db), listGearWithUse(db)]).then(
        ([bags, gear]) => setShelf({ bags, gear }),
        (error) => console.error('[home] could not read the shelf', error)
      );
    load();
    const offShelf = onShelfChanged(load);
    const offCups = onCupsChanged(load);
    return () => {
      offShelf();
      offCups();
    };
  }, [db]);

  const select = (next) => {
    setSide(next);
    Animated.timing(progress, { toValue: SIDES.indexOf(next), duration: motion.expand.duration, easing: tabEasing, useNativeDriver: true }).start();
  };

  if (!shelf) return null;
  const { w, h, gap } = component.bagTile.home;
  const beans = side === 'beans';
  const items = beans ? shelf.bags : shelf.gear;
  return (
    <View>
      <ShelfTabs
        active={side}
        progress={progress}
        counts={{ gear: shelf.gear.length, beans: shelf.bags.length }}
        onSelect={select}
        trailing={<Button variant="text" label="See all" trailingIcon="chevronRight" onPress={() => onSeeAll(side)} />}
      />
      <View style={styles.section}>
        <DotGround />
        {items.length ? (
          <ScrollView key={side} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, { gap }]}>
            {beans
              ? sortDrinkFirst(shelf.bags).map((b) => <BagTile key={b.id} bag={b} width={w} height={h} onPress={() => onOpenBag(b)} />)
              : homeGear(shelf.gear).map((g) => <GearTile key={g.id} gear={g} width={w} height={h} onPress={() => onOpenGear(g)} />)}
          </ScrollView>
        ) : beans ? (
          <EmptyShelf label="Add a bag" onAdd={onAddBag}>
            <Text variant="displayXs">Your shelf is empty</Text>
            <Text variant="sheetNote" color="secondary">
              Add the bag you're drinking from. Its photo stands here, and your next cup is logged against it.
            </Text>
          </EmptyShelf>
        ) : (
          <EmptyShelf label="Add gear" onAdd={onAddGear} />
        )}
      </View>
    </View>
  );
}

const tabEasing = Easing.bezier(...motion.expand.controlPoints);

/** Default first, then the most used (a stable sort keeps 3b's order in a tie). */
function homeGear(gear) {
  return [...gear].sort((a, b) => b.is_default - a.is_default || b.cups - a.cups);
}

/**
 * An empty side (Design Round 31 v2, 37l): the same dotted section as a
 * full one, with a dashed add tile the size of a tile (dashed.addTile: not
 * started) and room for a caption under it, so the shelf is as tall empty as
 * full and nothing jumps when the first one arrives. Beside it, the
 * children: the beans' "Your shelf is empty" (displayXs) and its line
 * (sheetNote, secondary).
 */
function EmptyShelf({ label, onAdd, children }) {
  const { w, h } = component.bagTile.home;
  const empty = component.bagTile.empty;
  return (
    <View style={[styles.row, styles.emptyShelf, { gap: empty.gap }]}>
      <View>
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={({ pressed }) => [styles.addTile, { width: w, height: h, gap: empty.markGap }, pressed && styles.pressed]}>
          <Glyph name="plus" token={icon.sm} color={color.icon.default} />
          <Text variant="tileStatus">{label}</Text>
        </Pressable>
        <View style={{ height: CAPTION_HEIGHT }} />
      </View>
      {children ? <View style={[styles.emptyWords, { width: empty.textWidth, paddingTop: empty.textTop, gap: empty.textGap }]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Out to the screen's edges, the dots edge to edge (37a), from the tabs'
  // divider to below the captions.
  section: {
    marginHorizontal: -layout.gutter,
    paddingTop: component.bagTile.home.top,
    paddingBottom: component.bagTile.home.bottom,
    borderTopWidth: shape.borderWidth.divider,
    borderTopColor: color.border.soft,
  },
  row: {
    paddingHorizontal: layout.gutter,
  },
  emptyShelf: {
    flexDirection: 'row',
  },
  addTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: dashed.addTile.width,
    borderStyle: dashed.addTile.style,
    borderColor: dashed.addTile.color,
  },
  emptyWords: {
    flexShrink: 1,
  },
  pressed: {
    backgroundColor: state.pressed.row,
  },
});
