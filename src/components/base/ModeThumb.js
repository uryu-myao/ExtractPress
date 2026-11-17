import { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { photoUri } from '../../data/photos';
import { color, component, dashed, icon } from '../../theme/tokens';
import Glyph from './Glyph';

const archive = component.archive;

/** Each mode's glyph (handoff-records §0). */
export const MODE_GLYPH = { made_it: 'dripperCone', barista: 'cupSaucer', packaged: 'canTall' };

/**
 * Records' thumb (handoff-records §3, 34c): the mode is shown, not read.
 * A 48 square in a 1.5 border.muted frame.
 *   No photo:   the mode's tint, its glyph at 22 / 2 in the mode's ink.
 *   With photo: the photo fills it; the mode becomes a 20 corner mark at the
 *               bottom-left (tint, the same frame, the glyph at 12 / 2.4),
 *               laid over the thumb's own frame.
 *   ghost:      the empty archive's example (34b): dashed frame, no fill,
 *               the dripper in text.placeholder. Not a thing to press.
 * Replaces 10a's generic cup on a beige tile in Records (PhotoPlaceholder
 * keeps it everywhere else).
 *
 * Props: mode ('made_it' | 'barista' | 'packaged'), photo (a photo's id,
 * cups.photo_uri; optional), ghost
 */
export default function ModeThumb({ mode, photo, ghost = false }) {
  const uri = useMemo(() => (ghost ? null : photoUri(photo)), [photo, ghost]);
  if (ghost) {
    return (
      <View style={[styles.box, styles.ghost]} accessible={false}>
        <Glyph name={MODE_GLYPH.made_it} token={icon.mode} color={color.text.placeholder} />
      </View>
    );
  }
  const pair = archive.mode[mode] ?? archive.mode.made_it;
  const glyph = MODE_GLYPH[mode] ?? MODE_GLYPH.made_it;
  if (uri) {
    return (
      <View style={styles.box} accessible={false}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={[styles.corner, { backgroundColor: pair.tint }]}>
          <Glyph name={glyph} token={icon.mark} color={pair.ink} />
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.box, { backgroundColor: pair.tint }]} accessible={false}>
      <Glyph name={glyph} token={icon.mode} color={pair.ink} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: archive.thumb,
    height: archive.thumb,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: archive.frame.width,
    borderColor: archive.frame.color,
    overflow: 'hidden',
  },
  ghost: {
    borderStyle: dashed.ghost.style,
    borderWidth: dashed.ghost.width,
    borderColor: dashed.ghost.color,
  },
  // Absolute children sit inside the border: pulled out by its width, the
  // mark's frame lies on the thumb's at the corner.
  corner: {
    position: 'absolute',
    left: -archive.frame.width,
    bottom: -archive.frame.width,
    width: archive.corner,
    height: archive.corner,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: archive.frame.width,
    borderColor: archive.frame.color,
  },
});
