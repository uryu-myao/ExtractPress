import { Alert, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import BagTile, { CAPTION_HEIGHT } from './BagTile';
import Button from './base/Button';
import Chevron from './base/Chevron';
import DotGround from './base/DotGround';
import Glyph from './base/Glyph';
import Text from './base/Text';
import { sortDrinkFirst } from '../constants/bagDates';
import { useDatabase } from '../data/DatabaseProvider';
import { OPEN_BAG_LIMIT, finishBag, openBag } from '../data/repository';
import { color, component, dashed, icon, layout, shape, space, spacing, state } from '../theme/tokens';

const grid = component.bagTile.grid;

/**
 * 3d's body — the beans side of Beans & gear, as a grid of bag tiles (Design
 * Round 31 v2, 37c; was 17d's cards). The tab row's slot count says "N / 5
 * On the shelf", counting the bags you have, opened or not (Design Round 7, 18).
 *
 * The whole side stands on the dot grid (DotGround), edge to edge, from the
 * tabs' divider (shape.borderWidth.divider, border.soft; the open tab's
 * underline sits centred on it).
 *
 * Grid (37c): two columns of 3 : 4 tiles (171 × 228 at 402), grid.gap
 * apart, rows grid.rowGap apart, in the same drink-first order as Home.
 * Each tile is BagTile (the three states, the fixed 66 caption), and under
 * it, the tile's width, one button (Button size "tile", 36):
 *   Finish bag      an opened bag: secondary, as 17d's. No confirmation, no
 *                   undo at this stage (gaps.md 17: 3f's Reopen is not built)
 *   Open this bag   a sealed bag: primary, raised (4 / 4), since opening
 *                   starts its clock and is the one thing to do with it
 * Never both. Only here: Home's shelf is for looking (37a).
 * A tile opens 3g, the bag page.
 *
 * The last cell: with a slot free, a dashed Add a bag tile (dashed.addTile,
 * as Home's empty shelf, 37l) with "N slots left" under it → 3c; full, a
 * dashed cell (dashed.ghost: not a thing to press) reading "Shelf full" /
 * "Finish a bag to add another."
 *
 * Under the grid: 17d's note on the freshness windows (sheetNote,
 * secondary), shown when a tile shows a roast-date or best-before status
 * (Design Round 7, 40; Round 27, 29c), then "Finished bags" (3d's foot,
 * 2026-10-14) → 3f: a 1.5 border.soft rule, the name in display.xs, "N
 * archived — still counted in my taste DNA" and a chevron. Shown once a bag
 * is finished (no entry to an empty 3f). Pressed, its row fills the
 * screen's width (state.pressed.row).
 *
 * Props: bags (listShelfBags), finished (countFinishedBags), onAddBag,
 * onFinished, onEditBag(bag)
 */
export default function BeansList({ bags, finished, onAddBag, onFinished, onEditBag }) {
  const db = useDatabase();
  const { width } = useWindowDimensions();
  const w = (width - 2 * layout.gutter - grid.gap) / 2;
  const h = (w * 4) / 3;

  const open = async (bag) => {
    try {
      await openBag(db, bag.id);
    } catch (error) {
      console.error('[3d] could not open', error);
      Alert.alert("Couldn't open this bag", String(error?.message ?? error));
    }
  };

  const finish = async (bag) => {
    try {
      await finishBag(db, bag.id);
    } catch (error) {
      console.error('[3d] could not finish', error);
      Alert.alert("Couldn't finish this bag", String(error?.message ?? error));
    }
  };

  const left = OPEN_BAG_LIMIT - bags.length;
  const windows = bags.some((b) => b.opened_at && b.roasted_at != null);
  const bestBefore = bags.some((b) => b.roasted_at == null && b.best_before != null);
  return (
    <View style={styles.side}>
      <DotGround />
      <View style={[styles.grid, { columnGap: grid.gap, rowGap: grid.rowGap }]}>
        {sortDrinkFirst(bags).map((bag) => (
          <BagTile
            key={bag.id}
            bag={bag}
            width={w}
            height={h}
            onPress={() => onEditBag(bag)}
            action={
              bag.opened_at ? (
                <Button variant="secondary" size="tile" label="Finish bag" onPress={() => finish(bag)} />
              ) : (
                <Button size="tile" raised label="Open this bag" onPress={() => open(bag)} />
              )
            }
          />
        ))}
        {left > 0 ? (
          <View style={{ width: w }}>
            <Pressable
              onPress={onAddBag}
              accessibilityRole="button"
              accessibilityLabel={`Add a bag, ${left === 1 ? '1 slot left' : `${left} slots left`}`}
              style={({ pressed }) => [styles.cell, styles.addCell, { height: h }, pressed && styles.pressed]}>
              <Glyph name="plus" token={icon.sm} color={color.icon.default} />
              <Text variant="tileStatus">Add a bag</Text>
            </Pressable>
            <View style={[styles.slots, { height: CAPTION_HEIGHT }]}>
              <Text variant="tileMeta" color="muted">
                {left === 1 ? '1 slot left' : `${left} slots left`}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.cell, styles.fullCell, { width: w, height: h }]}>
            <Text variant="tileStatus" color="muted">
              Shelf full
            </Text>
            <Text variant="bodySm" color="secondary" style={styles.centred}>
              Finish a bag to add another.
            </Text>
          </View>
        )}
      </View>
      {windows || bestBefore ? (
        <Text variant="sheetNote" color="secondary" style={styles.note}>
          {[windows ? 'The windows are a rough guide. Your own taste is the better judge.' : null, bestBefore ? 'Bags with only a best-before date show how long is left until it.' : null]
            .filter(Boolean)
            .join(' ')}
        </Text>
      ) : null}
      {finished > 0 ? (
        <Pressable
          onPress={onFinished}
          accessibilityRole="button"
          accessibilityLabel={`Finished bags, ${finished} archived`}
          style={({ pressed }) => [styles.finishedTouch, pressed && styles.pressedRow]}>
          <View style={styles.finished}>
            <View style={styles.finishedText}>
              <Text variant="displayXs">Finished bags</Text>
              <Text variant="bodySm" color="secondary">
                {`${finished} archived — still counted in my taste DNA`}
              </Text>
            </View>
            <Chevron />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Edge to edge on the dots, from the tabs' divider; room under the last
  // block so the bottom bar never covers it (as 2a).
  side: {
    borderTopWidth: shape.borderWidth.divider,
    borderTopColor: color.border.soft,
    paddingTop: grid.top,
    paddingBottom: layout.empty.block,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: layout.gutter,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[16],
  },
  addCell: {
    gap: component.bagTile.empty.markGap,
    borderWidth: dashed.addTile.width,
    borderStyle: dashed.addTile.style,
    borderColor: dashed.addTile.color,
  },
  fullCell: {
    gap: space[8],
    borderWidth: dashed.ghost.width,
    borderStyle: dashed.ghost.style,
    borderColor: dashed.ghost.color,
  },
  // "N slots left" where a tile's caption would be.
  slots: {
    paddingTop: component.bagTile.caption.top,
  },
  centred: {
    textAlign: 'center',
  },
  pressed: {
    backgroundColor: state.pressed.row,
  },
  note: {
    paddingHorizontal: layout.gutter,
    paddingTop: space[20],
  },
  // 3d's foot: the entry to 3f, under a 1.5 rule. The touch area spans the
  // screen; the rule keeps the content width.
  finishedTouch: {
    marginTop: space[20],
    paddingHorizontal: layout.gutter,
  },
  finished: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[12],
    paddingVertical: space[16],
    borderTopWidth: shape.borderWidth.weak,
    borderTopColor: color.border.soft,
  },
  finishedText: {
    flex: 1,
    gap: spacing.gap.tight,
  },
  pressedRow: {
    backgroundColor: state.pressed.row,
  },
});
