import { memo, useMemo } from 'react';
import { Animated, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { color, texture } from '../../theme/tokens';

const { grain } = texture;
const TILE = require('../../../assets/textures/grain.png');

/**
 * The page's ground (texture.grain, handoff-ground.md v1, 2026-11-17, 35b;
 * replaces DotTexture): surface.ground under a tiled paper-grain PNG.
 *
 * The tile is transparent warm-brown noise (alpha 0–9%), 160 × 160 pt; RN
 * picks grain@2x / @3x, so the grain is drawn at the phone's own density and
 * stays fine. Tiled by hand: one Image per 160pt cell over the window (about
 * 3 × 6 on a 430 × 932 phone), clipped to the parent. resizeMode "repeat"
 * drew a single tile at the top-left on iOS (RN 0.88, on device 2026-11-17).
 * Cells are laid from the window's size, so a block smaller than the screen
 * (a pinned heading) is covered too; the parent clips the rest.
 *
 * Fixed behind everything, as the dots were: it takes no props and is
 * memoised, so it never re-renders on scroll, and it is placed outside any
 * ScrollView, so it never moves. Touches pass through. Opaque surfaces
 * (cards, chips, sheets, the bar's pieces, thumbnails) cover it.
 */
function GrainTexture() {
  const { width, height } = useWindowDimensions();
  const cells = useMemo(() => {
    const cols = Math.ceil(width / grain.tile);
    // One row more: AlignedGrainTexture moves the grid up by up to a tile.
    const rows = Math.ceil(height / grain.tile) + 1;
    const list = [];
    for (let r = 0; r < rows; r += 1) for (let c = 0; c < cols; c += 1) list.push({ key: `${r}:${c}`, left: c * grain.tile, top: r * grain.tile });
    return list;
  }, [width, height]);
  return (
    <View style={styles.fill} pointerEvents="none">
      {cells.map(({ key, left, top }) => (
        <Image key={key} source={TILE} fadeDuration={0} style={[styles.tile, { left, top }]} />
      ))}
    </View>
  );
}

export default memo(GrainTexture);

/**
 * The same ground inside an opaque block that moves over the page (2a's
 * pinned headings, 2026-10-24), so the block hides what passes under it yet
 * reads as the page itself. `y` is the block's top in the page's
 * coordinates (an Animated value, from the screen's top); the tiles move
 * back by y mod one tile, so the grain lands on the page's. The block must
 * start at the page's left edge and clip (overflow hidden): the tiles
 * overhang it by one tile below.
 */
export function AlignedGrainTexture({ y }) {
  const back = useMemo(() => Animated.multiply(Animated.modulo(y, grain.tile), -1), [y]);
  return (
    <Animated.View pointerEvents="none" style={[styles.aligned, { transform: [{ translateY: back }] }]}>
      <GrainTexture />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: color.surface.ground,
    overflow: 'hidden',
  },
  tile: {
    position: 'absolute',
    width: grain.tile,
    height: grain.tile,
  },
  aligned: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -grain.tile,
  },
});
