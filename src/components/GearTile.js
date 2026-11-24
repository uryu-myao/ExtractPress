import { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ShelfTile, footprintOf } from './BagTile';
import GearIcon from './GearIcon';
import Text from './base/Text';
import { formatLastUsed } from '../constants/dates';
import { GEAR_CATEGORY } from '../constants/gear';
import { photoUri } from '../data/photos';
import { color, component } from '../theme/tokens';

const tile = component.bagTile;
const icon = component.gearTile.icon;

/**
 * A piece of gear as a tile (Design Round 31 addendum, 2026-11-24: 37b on
 * Home, 37n in the grid, 37o "one system", 37p the icon). The bag tile's
 * box and caption (ShelfTile), filled with one of two objects:
 *   a · photo     the print: the photo centre-cropped to the 5 : 7
 *                 footprint, in a white mat (tile.mat of its width), on the
 *                 baseline. Gear is never lifted: the print is the same
 *                 object the beans tab shows when a lift fails
 *   b · no photo  the ink block: the footprint in ink, the maker as its
 *                 eyebrow (paper at 72 %), the type's icon (GearIcon) in
 *                 paper, gearTile.icon.share of the block's width, centred
 *                 across, its centre at centreY of the block's height
 * Caption: the name; the type (Brewer / Grinder / Kettle / Scale); the
 * status (gearStatus).
 *
 * Props: gear (a listGearWithUse row), width, height, onPress
 */
export default function GearTile({ gear, width, height, onPress }) {
  const status = gearStatus(gear);
  const kind = GEAR_CATEGORY[gear.category];
  return (
    <ShelfTile
      width={width}
      height={height}
      onPress={onPress}
      accessibilityLabel={[gear.name, kind, status?.text].filter(Boolean).join(', ')}
      name={gear.name}
      meta={kind}
      status={status?.text}
      statusColor={status?.color}>
      <GearSubject gear={gear} width={width} height={height} />
    </ShelfTile>
  );
}

function GearSubject({ gear, width, height }) {
  const f = footprintOf(width, height);
  const photo = useMemo(() => photoUri(gear.photo_uri), [gear.photo_uri]);
  if (photo) {
    return (
      <View style={[styles.print, { left: f.x, top: f.top, width: f.w, height: f.h, padding: f.w * tile.mat }]}>
        <Image source={{ uri: photo }} style={styles.fill} resizeMode="cover" accessible={false} />
      </View>
    );
  }
  const size = f.w * icon.share;
  const inset = tile.letter.eyebrowInset;
  return (
    <View style={[styles.block, { left: f.x, top: f.top, width: f.w, height: f.h }]}>
      {gear.maker ? (
        <Text variant="tileEyebrow" color="onInverse" truncate="meta" style={{ position: 'absolute', top: inset, left: inset, right: inset, opacity: tile.letter.eyebrowOpacity }}>
          {gear.maker}
        </Text>
      ) : null}
      <View style={{ position: 'absolute', left: (f.w - size) / 2, top: f.h * icon.centreY - size / 2 }}>
        <GearIcon category={gear.category} size={size} color={color.text.onInverse} />
      </View>
    </View>
  );
}

/**
 * The gear tile's status line (Design Round 31 addendum): "Default · 14
 * cups" in text.accent for the default of its kind (17a's DEFAULT badge, as
 * words; "Default" alone before its first cup); "3 cups · 6 days ago" for
 * other gear that has been used (formatLastUsed: today, yesterday, N days
 * ago, then the date); none before its first cup.
 * Every kind counts, kettles and scales too: a cup records them since
 * migration 14 (Design's note that it doesn't predates that).
 */
export function gearStatus(g) {
  const cups = g.cups ? (g.cups === 1 ? '1 cup' : `${g.cups} cups`) : null;
  if (g.is_default) return { text: cups ? `Default · ${cups}` : 'Default', color: 'accent' };
  if (cups) return { text: g.last_used_at != null ? `${cups} · ${formatLastUsed(g.last_used_at)}` : cups, color: 'muted' };
  return null;
}

const styles = StyleSheet.create({
  print: {
    position: 'absolute',
    backgroundColor: color.surface.raised,
  },
  fill: {
    flex: 1,
  },
  block: {
    position: 'absolute',
    backgroundColor: color.surface.inverse,
    overflow: 'hidden',
  },
});
