import { Image, InputAccessoryView, Pressable, Text as RNText, ScrollView, StyleSheet, View } from 'react-native';
import { color, component, icon, shape, textStyle } from '../theme/tokens';
import Glyph from './base/Glyph';
import Text from './base/Text';

const bar = component.labelBar;
const CJK = /[぀-ヿ㐀-鿿豈-﫿ｦ-ﾟ]/;

/**
 * Add a bag's label candidates (Design Turn 38, 39a–39d; decided
 * 2026-11-27): the keyboard's accessory view while Bean name or Roaster has
 * focus, the same set in the same order for both (src/data/labelText.ts,
 * largest print first, up to six). Nothing says which line is which: no
 * chip is highlighted, there's no "Name?" (Ogawa's bean name is second,
 * Kaldi's first).
 *
 *   source  the bag itself at the left (its cutout, or the photo when the
 *           lift failed), 36 tall in a 46 slot, a divider after it; it
 *           doesn't scroll. It says these lines come from this photo
 *   chips   1–2 lead (ink frame, 15 / 600, up to 156), 3–6 step back
 *           (border.muted, 14 / 500, up to 112), by position only. One line,
 *           cut at the end with "…"; a tap puts the whole string in
 *   used    a chip whose text is in either field: a check, the quiet frame,
 *           text.muted. It stays where it is and can still be tapped
 *   pressed ink fill, paper text, for the touch
 *   scroll  horizontal, free, clipped hard at the edge
 * The screen renders one per field only when there are candidates (no
 * empty bar), each with its own nativeID: RN's new architecture attaches an
 * InputAccessoryView to the first TextInput carrying its id, never to two.
 *
 * InputAccessoryView is deprecated in RN 0.88 (still shipped; a dev
 * warning). TODO: move to its replacement when RN removes it.
 *
 * Props: nativeID, candidates, source (an image URI or null), isUsed(text), onPick(text)
 */
export default function LabelBar({ nativeID, candidates, source, isUsed, onPick }) {
  return (
    <InputAccessoryView nativeID={nativeID} backgroundColor={color.surface.raised}>
      <View style={styles.bar}>
        <View style={styles.source}>
          {source ? <Image source={{ uri: source }} style={styles.sourceImage} resizeMode="contain" accessible={false} /> : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={styles.chips}>
          {candidates.map((text, i) => (
            <Chip key={`${i}:${text}`} text={text} lead={i < 2} used={isUsed(text)} onPress={() => onPick(text)} />
          ))}
        </ScrollView>
      </View>
    </InputAccessoryView>
  );
}

function Chip({ text, lead, used, onPress }) {
  const cjk = CJK.test(text);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityHint="Puts it in the field you're typing in"
      accessibilityState={{ selected: used }}
      style={({ pressed }) => [styles.chip, lead && !used ? styles.lead : styles.quiet, { maxWidth: lead ? bar.lead.max : bar.quiet.max }, pressed && styles.pressed]}>
      {({ pressed }) => {
        const tone = pressed ? color.text.onInverse : used ? color.text.muted : lead ? color.text.primary : color.text.secondary;
        return (
          <>
            {used ? <Glyph name="check" token={icon.mark} color={tone} /> : null}
            {cjk ? (
              // Hiragino Sans, a system face outside the app's text styles (as BagTile's CJK letter).
              <RNText numberOfLines={1} style={[styles.text, lead ? styles.cjkLead : styles.cjkQuiet, { color: tone }]}>
                {text}
              </RNText>
            ) : (
              <Text variant={lead ? 'lead' : 'body'} color={tone} numberOfLines={1} style={styles.text}>
                {text}
              </Text>
            )}
          </>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: bar.height,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface.raised,
    borderTopWidth: shape.borderWidth.weak,
    borderTopColor: color.border.muted,
  },
  source: {
    width: bar.source.width,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: shape.borderWidth.divider,
    borderRightColor: color.divider.hairline,
  },
  sourceImage: {
    width: bar.source.width - 2 * shape.borderWidth.weak,
    height: bar.source.image,
  },
  chips: {
    alignItems: 'center',
    gap: bar.chip.gap,
    paddingHorizontal: bar.chip.inset,
  },
  chip: {
    height: bar.chip.height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: bar.chip.checkGap,
    paddingHorizontal: bar.chip.padX,
    backgroundColor: color.surface.raised,
  },
  lead: {
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.strong,
  },
  quiet: {
    borderWidth: shape.borderWidth.weak,
    borderColor: color.border.muted,
  },
  pressed: {
    backgroundColor: color.surface.inverse,
    borderColor: color.surface.inverse,
  },
  text: {
    flexShrink: 1,
  },
  cjkLead: {
    fontFamily: bar.cjk.lead,
    fontSize: textStyle.lead.fontSize,
  },
  cjkQuiet: {
    fontFamily: bar.cjk.quiet,
    fontSize: textStyle.body.fontSize,
  },
});
