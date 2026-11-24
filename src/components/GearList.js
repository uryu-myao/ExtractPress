import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { CAPTION_HEIGHT } from './BagTile';
import GearTile from './GearTile';
import DotGround from './base/DotGround';
import Glyph from './base/Glyph';
import Text from './base/Text';
import { GEAR_CATEGORY, GEAR_LIMIT } from '../constants/gear';
import { color, component, dashed, icon, layout, shape, space, state } from '../theme/tokens';

const grid = component.bagTile.grid;

/**
 * 3b's body — the gear side of Beans & gear, as a grid of gear tiles (Design
 * Round 31 addendum, 2026-11-24: 37n; was 17c's rows). The tab row's slot
 * count says "N / 8 On the shelf".
 *
 * The beans grid's layout (BeansList), gear in it: the dots edge to edge
 * from the tabs' divider, two columns of 3 : 4 tiles, grid.gap apart, rows
 * grid.rowGap apart, the same 66 caption, defaults first, then oldest added
 * (listGearWithUse). Each tile is GearTile (the print or the icon block).
 * No buttons: gear has nothing to do from the list. A tile opens 3e.
 * The last cell, with a slot free: a dashed Add gear tile (dashed.addTile)
 * with "N slots left" on its caption line → 3a; hidden at 8 / 8, as before.
 * No Finished row: gear isn't finished.
 *
 * Props: gear (listGearWithUse), onAddGear, onEditGear(gear)
 */
export function gearLine(g) {
  return `${GEAR_CATEGORY[g.category]} · ${g.cups ? `used in ${g.cups === 1 ? '1 cup' : `${g.cups} cups`}` : 'not used yet'}`;
}

export default function GearList({ gear, onAddGear, onEditGear }) {
  const { width } = useWindowDimensions();
  const w = (width - 2 * layout.gutter - grid.gap) / 2;
  const h = (w * 4) / 3;
  const left = GEAR_LIMIT - gear.length;
  return (
    <View style={styles.side}>
      <DotGround />
      <View style={[styles.grid, { columnGap: grid.gap, rowGap: grid.rowGap }]}>
        {gear.map((g) => (
          <GearTile key={g.id} gear={g} width={w} height={h} onPress={() => onEditGear(g)} />
        ))}
        {left > 0 ? (
          <View style={{ width: w }}>
            <Pressable
              onPress={onAddGear}
              accessibilityRole="button"
              accessibilityLabel={`Add gear, ${left === 1 ? '1 slot left' : `${left} slots left`}`}
              style={({ pressed }) => [styles.addCell, { height: h }, pressed && styles.pressed]}>
              <Glyph name="plus" token={icon.sm} color={color.icon.default} />
              <Text variant="tileStatus">Add gear</Text>
            </Pressable>
            <View style={[styles.slots, { height: CAPTION_HEIGHT }]}>
              <Text variant="tileMeta" color="muted">
                {left === 1 ? '1 slot left' : `${left} slots left`}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
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
  addCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[16],
    gap: component.bagTile.empty.markGap,
    borderWidth: dashed.addTile.width,
    borderStyle: dashed.addTile.style,
    borderColor: dashed.addTile.color,
  },
  // "N slots left" where a tile's caption would be.
  slots: {
    paddingTop: component.bagTile.caption.top,
  },
  pressed: {
    backgroundColor: state.pressed.row,
  },
});
