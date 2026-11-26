import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, Text as RNText, StyleSheet, View } from 'react-native';
import { bestBeforeStatus } from '../constants/bagDates';
import { FRESHNESS_WORDS, freshnessOf } from '../data/freshness';
import { cutoutEdges, cutoutUri, photoUri } from '../data/photos';
import { color, component, motion, state, textStyle } from '../theme/tokens';
import DotGround from './base/DotGround';
import Text from './base/Text';

const tile = component.bagTile;

/**
 * A bag as a tile (Design Round 31 v2: 37a Home's shelf, 37c the Beans grid,
 * 37i the cut hand). No frame and no fill: the bag stands on the section's
 * dots (DotGround), with its caption under it. Three states, by what the
 * bag's photo gave (data/photos.ts, schema.ts bags.photo_cutout):
 *
 *   a · lifted     the cutout, placed by the rule below
 *   b · not lifted the original photo as a print: centre-cropped to the
 *                  footprint, in a white mat (tile.mat of its width), on the
 *                  baseline. No subject was found, or the cutout ran into
 *                  three or four sides of the photo (a close-up)
 *   c · no photo   a letter block: the footprint filled in ink, the name's
 *                  first character in paper, the roaster as an eyebrow
 *
 * The rule (37i, "For Code"). The footprint is the largest 5 : 7 box inside
 * maxW × maxH of the tile, standing `lift` of its height above its foot (the
 * baseline); its top is the top line: every subject starts there, so the
 * bag tops in a row are level and only the hands below them vary.
 *   no edge        fit into the footprint, centred, on the baseline
 *   right only     fit into top line → baseline, snapWidth wide, flush right
 *   bottom only    fit into top line → the tile's foot, snapWidth wide,
 *                  flush bottom, centred
 *   bottom + right the bottom box, flush to the bottom-right corner
 * A side the cutout runs into is where the photo cut it (a held bag's
 * wrist): snapped to the tile's edge it reads as reaching in. Only the
 * bottom and right sides place it (Uryu, 2026-11-23); a cut on the top or
 * left is faded with the others but moves nothing.
 *
 * Caption (37a; fixed at 66 since 37c): name (tileName, ink), roaster
 * (tileMeta, muted), the status (tileStatus: text.success when it's time to
 * drink, else muted), each one line, each keeping its height when empty.
 * `action` (the Beans grid's Finish bag / Open this bag, 37c) sits
 * caption.action under it, outside the tile's own press.
 *
 * Presses by scale (state.pressed.scale over motion.press), having no surface,
 * as the shelf's tabs.
 *
 * Props: bag (a listShelfBags row), width, height (the tile's, a
 * component.bagTile size), onPress, action (optional node under the caption)
 */
export default function BagTile({ bag, width, height, onPress, action }) {
  const status = bagStatus(bag);
  return (
    <ShelfTile
      width={width}
      height={height}
      onPress={onPress}
      action={action}
      accessibilityLabel={[bag.name, bag.roaster, status?.text].filter(Boolean).join(', ')}
      name={bag.name}
      meta={bag.roaster}
      status={status?.text}
      statusColor={status?.drink ? 'success' : 'muted'}>
      <Subject bag={bag} width={width} height={height} />
    </ShelfTile>
  );
}

/**
 * The tile every shelf object stands in (Design Round 31 v2: 37a–37c beans,
 * 37b / 37n gear, 37o "one system"): no frame, the subject (children) in a
 * width × height box clipped to it, then the fixed 66 caption (name, meta,
 * status, each one line, each keeping its height when empty) and an
 * optional action caption.action under it, outside the tile's press.
 * Presses by scale, having no surface.
 */
export function ShelfTile({ width, height, onPress, action, accessibilityLabel, name, meta, status, statusColor = 'muted', children }) {
  const scale = useRef(new Animated.Value(1)).current;
  const scaleTo = (toValue) =>
    Animated.timing(scale, { toValue, duration: motion.press.duration, easing: pressEasing, useNativeDriver: true }).start();
  return (
    <View style={{ width }}>
      <Pressable onPress={onPress} onPressIn={() => scaleTo(state.pressed.scale)} onPressOut={() => scaleTo(1)} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <View style={{ width, height, overflow: 'hidden' }}>{children}</View>
          <View style={styles.caption}>
            <Text variant="tileName" truncate="shelf">
              {name}
            </Text>
            <Text variant="tileMeta" color="muted" truncate="meta" style={styles.meta}>
              {meta || ' '}
            </Text>
            <Text variant="tileStatus" color={statusColor} truncate="meta" style={styles.status}>
              {status || ' '}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const pressEasing = Easing.bezier(...motion.press.controlPoints);

/** The footprint and the top line, for a tile of this size (the rule above). */
export function footprintOf(width, height) {
  const { aspect, maxW, maxH, lift } = tile.footprint;
  const w = Math.min(width * maxW, height * maxH * aspect);
  const h = w / aspect;
  const baseline = height * (1 - lift);
  return { w, h, x: (width - w) / 2, top: baseline - h, baseline };
}

/** Where a cutout of this aspect (width ÷ height) goes, from the sides it runs into. */
export function placeCutout(aspect, edges, width, height) {
  const f = footprintOf(width, height);
  const fit = (boxW, boxH) => {
    const h = Math.min(boxH, boxW / aspect);
    return { w: h * aspect, h };
  };
  const snapW = width * tile.snapWidth;
  if (edges.bottom) {
    const s = fit(snapW, height - f.top);
    return { ...s, x: edges.right ? width - s.w : (width - s.w) / 2, y: height - s.h };
  }
  if (edges.right) {
    const s = fit(snapW, f.baseline - f.top);
    return { ...s, x: width - s.w, y: f.baseline - s.h };
  }
  const s = fit(f.w, f.h);
  return { ...s, x: (width - s.w) / 2, y: f.baseline - s.h };
}

function Subject({ bag, width, height }) {
  const f = footprintOf(width, height);
  return <Drawn bag={bag} which="small" footprint={f} place={(aspect, edges) => placeCutout(aspect, edges, width, height)} mat={f.w * tile.mat} eyebrowInset={tile.letter.eyebrowInset} />;
}

/**
 * The bag in one of its three states (see the top of this file), in a
 * footprint: the cutout (`which` file) where `place` puts it, else the print
 * with a `mat`, else the letter block.
 */
export function Drawn({ bag, which, footprint: f, place, mat, eyebrowInset }) {
  const edges = cutoutEdges(bag.photo_cutout);
  const cut = useMemo(() => (edges ? cutoutUri(bag.photo_uri, which) : null), [bag.photo_uri, bag.photo_cutout, which]); // eslint-disable-line react-hooks/exhaustive-deps
  const photo = useMemo(() => (cut ? null : photoUri(bag.photo_uri)), [cut, bag.photo_uri]);
  const aspect = useAspect(cut);

  if (cut) {
    if (!aspect) return null;
    const at = place(aspect, edges);
    return <Image source={{ uri: cut }} style={{ position: 'absolute', left: at.x, top: at.y, width: at.w, height: at.h }} accessible={false} />;
  }
  if (photo) {
    return (
      <View style={[styles.print, { left: f.x, top: f.top, width: f.w, height: f.h, padding: mat }]}>
        <Image source={{ uri: photo }} style={styles.fill} resizeMode="cover" accessible={false} />
      </View>
    );
  }
  return <LetterBlock bag={bag} footprint={f} eyebrowInset={eyebrowInset} />;
}

/**
 * The bag page's visual (Design Round 31 v2, 37f–37h; component.bagPage):
 * the bag on the dots, full bleed, visualHeight tall, as ScreenFrame's hero.
 * The footprint is measured in the area under the bar's line (barLine); the
 * three states are the tile's, at this size, and the print takes
 * bagPage.mat. Only the bottom snaps (fit from the top line to the foot,
 * centred): at full width a corner snap would leave half the visual empty,
 * and the fade carries a cut on the right on its own.
 *
 * Pulled down (scrollY below 0), the dots reach up with it, anchored to the
 * visual's foot, and the subject scales from its baseline by (area + pull)
 * ÷ area, up to bagPage.pull.max.
 *
 * Props: bag, width, barLine (the floating buttons' foot), scrollY (the
 * page's, Animated)
 */
export function BagVisual({ bag, width, barLine, scrollY }) {
  const page = component.bagPage;
  const height = page.visualHeight;
  const area = height - barLine;
  const { f, place } = pageGeometry(width, barLine);
  const baseline = f.baseline;
  const { max, dots } = page.pull;
  const scale = scrollY.interpolate({ inputRange: [-max, 0], outputRange: [(area + max) / area, 1], extrapolate: 'clamp' });
  return (
    <View style={{ width, height }}>
      <View style={[styles.reach, { top: -dots }]}>
        <DotGround />
      </View>
      <View style={[styles.reach, styles.clip, { top: -dots }]}>
        <Animated.View style={{ position: 'absolute', left: 0, top: dots, width, height, transformOrigin: [width / 2, baseline, 0], transform: [{ scale }] }}>
          <Drawn bag={bag} which="large" footprint={f} place={place} mat={page.mat} eyebrowInset={page.eyebrowInset} />
        </Animated.View>
      </View>
    </View>
  );
}

/**
 * The bag page's visual, measured (see BagVisual): the footprint `f` and
 * `place` (a cutout's aspect and edges → its box). Add a bag uses the same,
 * so a bag lifted there stands where its page will show it (38b).
 */
export function pageGeometry(width, barLine) {
  const height = component.bagPage.visualHeight;
  const area = height - barLine;
  const { aspect, maxH, lift } = tile.footprint;
  const fh = area * maxH;
  const fw = fh * aspect;
  const baseline = height * (1 - lift);
  const f = { w: fw, h: fh, x: (width - fw) / 2, top: baseline - fh, baseline };
  const place = (a, edges) => {
    const box = edges.bottom ? { w: width * tile.snapWidth, h: height - f.top } : { w: f.w, h: f.h };
    const h = Math.min(box.h, box.w / a);
    const w = h * a;
    return { w, h, x: (width - w) / 2, y: (edges.bottom ? height : baseline) - h };
  };
  return { f, place };
}

/** A cutout's width ÷ height, read from its file once per URI. */
const aspects = new Map();
function useAspect(uri) {
  const [aspect, setAspect] = useState(() => (uri ? aspects.get(uri) ?? null : null));
  useEffect(() => {
    if (!uri) return undefined;
    if (aspects.has(uri)) {
      setAspect(aspects.get(uri));
      return undefined;
    }
    let alive = true;
    Image.getSize(
      uri,
      (w, h) => {
        aspects.set(uri, w / h);
        if (alive) setAspect(w / h);
      },
      (error) => console.warn('[tile] could not read the cutout', uri, error)
    );
    return () => {
      alive = false;
    };
  }, [uri]);
  return aspect;
}

const CJK = /[぀-ヿ㐀-鿿豈-﫿가-힯ｦ-ﾟ]/;
const LEADING = /^(?:\s|["'“”‘’「」『』（）()]|the\s+)+/i;

/**
 * The letter on a no-photo block (Design Round 31 v2): skip leading spaces,
 * quotes and "the "; uppercase a Latin letter; keep a digit as it is.
 * 「森彦の時間」→ 森, キリマンジャロブレンド → キ.
 */
export function firstCharacter(name) {
  const rest = String(name ?? '').replace(LEADING, '');
  const [first = '?'] = Array.from(rest || String(name ?? '?'));
  return first.toLocaleUpperCase();
}

function LetterBlock({ bag, footprint: f, eyebrowInset }) {
  const letter = firstCharacter(bag.name);
  const cjk = CJK.test(letter);
  const { latin, cjk: cjkShare, lineHeight, insetX, insetY, eyebrowOpacity } = tile.letter;
  const size = f.w * (cjk ? cjkShare : latin);
  return (
    <View style={[styles.block, { left: f.x, top: f.top, width: f.w, height: f.h }]}>
      {bag.roaster ? (
        <Text variant="tileEyebrow" color="onInverse" truncate="meta" style={{ position: 'absolute', top: eyebrowInset, left: eyebrowInset, right: eyebrowInset, opacity: eyebrowOpacity }}>
          {bag.roaster}
        </Text>
      ) : null}
      <RNText
        allowFontScaling={false}
        style={{
          position: 'absolute',
          left: f.w * insetX,
          bottom: f.w * insetY,
          fontFamily: cjk ? CJK_FONT : textStyle.displayLg.fontFamily,
          fontSize: size,
          lineHeight: size * lineHeight,
          color: color.text.onInverse,
        }}>
        {letter}
      </RNText>
    </View>
  );
}

/** Hiragino Mincho ProN W6, the CJK letter (Design Round 31 v2). An iOS system font. */
const CJK_FONT = 'HiraMinProN-W6';

/**
 * The tile's status line (Design Round 31 v2, 37l), the full set: "Day 7 ·
 * drink now" / "Day 26 · past peak" (and "Day 3 · resting") from the roast
 * date; "Best by Feb 12" / "Past best by" from a best-before date ("Best
 * before · Feb 12" measures 146 in tileStatus and clips at 144); "Sealed".
 * None for an opened bag with neither date. drink: time to drink it
 * (text.success). The grid and the bag page are to use the same words.
 */
export function bagStatus(bag) {
  if (!bag.opened_at) return { text: 'Sealed', drink: false };
  const f = freshnessOf(bag.roasted_at);
  if (f) return { text: `Day ${f.day} · ${FRESHNESS_WORDS[f.state]}`, drink: f.state === 'drinkNow' };
  const dated = bestBeforeStatus(bag);
  if (dated) return { text: dated.passed ? 'Past best by' : `Best by ${dated.line}`, drink: false };
  return null;
}

/** A caption's height, fixed (37c: 66): the empty shelf's room under its tile (37l). */
export const CAPTION_HEIGHT =
  tile.caption.top + textStyle.tileName.lineHeight + tile.caption.nameGap + textStyle.tileMeta.lineHeight + tile.caption.statusGap + textStyle.tileStatus.lineHeight;

const styles = StyleSheet.create({
  caption: {
    paddingTop: tile.caption.top,
  },
  meta: {
    marginTop: tile.caption.nameGap,
  },
  status: {
    marginTop: tile.caption.statusGap,
  },
  action: {
    marginTop: tile.caption.action,
  },
  print: {
    position: 'absolute',
    backgroundColor: color.surface.raised,
  },
  fill: {
    flex: 1,
  },
  // The visual's dots and subject reach above it by bagPage.pull.dots, for the pull.
  reach: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  clip: {
    overflow: 'hidden',
  },
  block: {
    position: 'absolute',
    backgroundColor: color.surface.inverse,
    overflow: 'hidden',
  },
});
