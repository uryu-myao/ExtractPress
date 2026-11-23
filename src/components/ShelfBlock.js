import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import BagTile, { CAPTION_HEIGHT } from './BagTile';
import ShelfTabs, { SIDES } from './ShelfTabs';
import { useDatabase } from '../data/DatabaseProvider';
import { drinkFirstRank } from '../constants/bagDates';
import { listGearWithUse, listShelfBags, onCupsChanged, onShelfChanged } from '../data/repository';
import { formatLastUsed } from '../constants/dates';
import { GEAR_CATEGORY } from '../constants/gear';
import { color, component, dashed, icon, layout, motion, shape, size, space, spacing, state } from '../theme/tokens';
import Glyph from './base/Glyph';
import DotGround from './base/DotGround';
import AddButton from './base/AddButton';
import Badge from './base/Badge';
import Button from './base/Button';
import PhotoPlaceholder from './base/PhotoPlaceholder';
import Text from './base/Text';

/**
 * Home's My beans / My gear (Round 14, 17a / 17b; beans redrawn by Design
 * Round 31 v2, 37a / 37b, 2026-11-23). Beans first, then gear (Uryu,
 * 2026-11-17; 37a draws gear first, kept as Uryu decided).
 *
 * Heading: ShelfTabs, with the live counts, and "See all" at its right end
 * (37a), which opens Beans & gear on the open side. The two sides are TABS,
 * not swiped pages (37a): the beans row scrolls sideways itself, so it can't
 * sit in a sideways pager. A tab's underline fades over motion.expand.
 *
 * Beans (37a): every bag on the shelf as a tile (BagTile, 144 × 192,
 * space.12 apart), in drink-first order, in one row that scrolls sideways
 * out to the screen's edges, the next tile peeking. The row stands on the
 * dot grid (DotGround), which runs edge to edge from the tabs' divider
 * (shape.borderWidth.divider, border.soft; the open tab's underline sits
 * centred on it) to below the captions. Empty, the same section holds a
 * dashed Add a bag tile and a few words (37l, EmptyShelf).
 *
 * Gear: unchanged for now (Uryu, 2026-11-23: gear waits until beans are
 * settled). Three rows alike (68: the 44 thumbnail and space.12 above and
 * below): thumbnail, name (label, one line) over one line (bodySm, muted),
 * and a status column at the right. No rule over the first row (Uryu,
 * 2026-11-15). Pressable, opening the gear's page (3e, 19c); the row darkens
 * while pressed (state.pressed.row).
 *   status "2 cups" / "Last · today", or "Not used" / "Add to a cup". Used
 *          with no date: the count alone. Default first, then the most used.
 * The status column is at least size.statusColumn wide and grows with its text.
 *
 * Props: onSeeAll(side), onAddBag, onAddGear, onOpenBag(bag), onOpenGear(gear)
 */
const ROWS = 3;

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
  return (
    <View>
      <ShelfTabs
        active={side}
        progress={progress}
        counts={{ gear: shelf.gear.length, beans: shelf.bags.length }}
        onSelect={select}
        trailing={<Button variant="text" label="See all" trailingIcon="chevronRight" onPress={() => onSeeAll(side)} />}
      />
      {side === 'beans' ? (
        <View style={styles.beans}>
          <DotGround />
          {shelf.bags.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, { gap }]}>
              {homeBeans(shelf.bags).map((b) => (
                <BagTile key={b.id} bag={b} width={w} height={h} onPress={() => onOpenBag(b)} />
              ))}
            </ScrollView>
          ) : (
            <EmptyShelf onAdd={onAddBag} />
          )}
        </View>
      ) : shelf.gear.length ? (
        homeGear(shelf.gear).map((g, i) => <GearRow key={g.id} gear={g} first={i === 0} onPress={() => onOpenGear(g)} />)
      ) : (
        <EmptySide>
          <AddButton icon="plus" iconToken={icon.sm} label="Add gear" onPress={onAddGear} />
        </EmptySide>
      )}
    </View>
  );
}

const tabEasing = Easing.bezier(...motion.expand.controlPoints);

/** Default first, then the most used (a stable sort keeps 3b's order in a tie). */
function homeGear(gear) {
  return [...gear].sort((a, b) => b.is_default - a.is_default || b.cups - a.cups).slice(0, ROWS);
}

/**
 * What to drink first (Round 14; Round 15, B2; Design Round 27, B3): date
 * passed and past peak (longest past first), drink now, best-before by
 * nearest date, resting, neither date, sealed (constants/bagDates.js).
 * Every bag on the shelf (37a: the row scrolls; was three rows).
 */
function homeBeans(bags) {
  const now = Date.now();
  const ranked = bags.map((b) => [drinkFirstRank(b, now), b]);
  return ranked
    .sort(([x, a], [y, b]) => x[0] - y[0] || x[1] - y[1] || a.id - b.id)
    .map(([, b]) => b);
}

function GearRow({ gear: g, first, onPress }) {
  const status = g.cups ? (
    <Status word={g.cups === 1 ? '1 cup' : `${g.cups} cups`} wordColor="primary" line={g.last_used_at != null ? `Last · ${formatLastUsed(g.last_used_at)}` : null} />
  ) : (
    <Status word="Not used" wordColor="muted" line="Add to a cup" />
  );
  return <Row first={first} name={g.name} badge={g.is_default ? 'Default' : null} meta={GEAR_CATEGORY[g.category]} status={status} photo={g.photo_uri} onPress={onPress} />;
}

function Row({ first, name, badge, meta, status, photo, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.gearRow, first && styles.rowFirst, pressed && styles.rowPressed]}>
      <PhotoPlaceholder size={size.thumbnail.compact} photo={photo} />
      <View style={styles.text}>
        <View style={styles.nameRow}>
          <Text variant="label" truncate="shelf" style={styles.name}>
            {name}
          </Text>
          {badge ? <Badge label={badge} tone="selected" /> : null}
        </View>
        <Text variant="bodySm" color="muted" truncate="meta">
          {meta}
        </Text>
      </View>
      {status}
    </Pressable>
  );
}

/**
 * The empty beans shelf (Design Round 31 v2, 37l): the same dotted section
 * as a full one, with a dashed Add a bag tile the size of a bag tile
 * (dashed.addTile: not started) and room for a caption under it, so the
 * shelf is as tall empty as full and nothing jumps when the first bag
 * arrives. Beside it "Your shelf is empty" (displayXs) and a line
 * (sheetNote, secondary).
 */
function EmptyShelf({ onAdd }) {
  const { w, h } = component.bagTile.home;
  const empty = component.bagTile.empty;
  return (
    <View style={[styles.row, styles.emptyShelf, { gap: empty.gap }]}>
      <View>
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel="Add a bag"
          style={({ pressed }) => [styles.addTile, { width: w, height: h, gap: empty.markGap }, pressed && styles.rowPressed]}>
          <Glyph name="plus" token={icon.sm} color={color.icon.default} />
          <Text variant="tileStatus">Add a bag</Text>
        </Pressable>
        <View style={{ height: CAPTION_HEIGHT }} />
      </View>
      <View style={[styles.emptyWords, { width: empty.textWidth, paddingTop: empty.textTop, gap: empty.textGap }]}>
        <Text variant="displayXs">Your shelf is empty</Text>
        <Text variant="sheetNote" color="secondary">
          Add the bag you're drinking from. Its photo stands here, and your next cup is logged against it.
        </Text>
      </View>
    </View>
  );
}

/**
 * An empty side's add button, in the same room as a first row (on device,
 * 2026-10-30): without it the button's frame sat right under the tabs and
 * the open tab's underline ran into it.
 */
function EmptySide({ children }) {
  return <View style={[styles.empty, styles.rowFirst]}>{children}</View>;
}

/**
 * A gear row's status column: a word (meterLabel) over a line (bodySm,
 * muted). Without a line the word sits alone, centred.
 */
function Status({ word, wordColor, line }) {
  return (
    <View style={styles.status}>
      <Text variant="meterLabel" color={wordColor}>
        {word}
      </Text>
      {line ? (
        <Text variant="bodySm" color="muted">
          {line}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Out to the screen's edges, the dots edge to edge (37a), from the tabs'
  // divider to below the captions.
  beans: {
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
  gearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    paddingVertical: spacing.inset.listRow.v,
  },
  // No rule over the first row (Uryu, 2026-11-15: Home's blocks set apart by
  // room alone). space.6 between the open tab's underline and the first
  // row, then the row's own 12: its content about 18 under the underline,
  // and a pressed row's fill clear of the underline (Uryu, 2026-11-17, on
  // device: the list further from the underline; was 6 in all).
  rowFirst: {
    marginTop: space[6],
  },
  rowPressed: {
    backgroundColor: state.pressed.row,
  },
  empty: {
    paddingVertical: spacing.inset.listRow.v,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: spacing.gap.tight,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap.row,
  },
  name: {
    flexShrink: 1,
  },
  status: {
    flexShrink: 0,
    minWidth: size.statusColumn,
    alignItems: 'flex-end',
    gap: space[6],
  },
});
