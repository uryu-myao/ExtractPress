import { Pressable, StyleSheet, View } from 'react-native';
import { MODE_LABEL } from '../../constants/cups';
import { color, component, icon, layout, spacing, state } from '../../theme/tokens';
import Chevron from './Chevron';
import Glyph from './Glyph';
import ModeThumb from './ModeThumb';
import Text from './Text';

const archive = component.archive;

/**
 * One cup in a list of cups (handoff-records §3, 34a–34g): Records, search,
 * and Home's Recently sipped (Uryu, 2026-11-17: one cup list across the app;
 * replaces RecordRow).
 *
 *   [thumb 48] · 12 · [title / source / words or flavours] · [rating column
 *   44: star + numeral, the time or date under them] · 12 · [chevron]
 *
 * Three lines at most, one line each with an ellipsis; line 2 and 3 are
 * absent when there's nothing to say (never a placeholder). Text shorter
 * than the thumb is centred on it (Uryu, 2026-11-17); taller text starts at
 * the row's top with the thumb. Line 3 is My
 * words (34g, A: a 12 pen in border.accent, space.4, Instrument Serif 15, no
 * quotation marks, no rule) or, without them, the flavours in bodySm muted.
 * The mode is the thumb's tint and glyph (ModeThumb); no badge.
 *
 * The whole row presses (state.pressed.row), out to the screen's right edge.
 * Its left edge: the screen's (`bleed`, the default), or the day gutter's
 * right edge under a Month heading (`gutter`: the row's own padding is the
 * space.12 after the gutter; §2 "Pressed").
 *
 * Props
 *   cup      a listCups row (mode, photo_uri, rating)
 *   lines    { title, source, words, flavours } (constants/cups archiveLines)
 *   when     the time ("08:10") or the date ("Nov 16"), preformatted
 *   onPress  opens the cup (2c)
 *   gutter   the row sits beside the day gutter
 */
export default function ArchiveRow({ cup, lines, when, onPress, gutter = false }) {
  const { title, source, words, flavours } = lines;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[title, MODE_LABEL[cup.mode], source, words ?? flavours, `${cup.rating} of 5`, when].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.touch, gutter ? styles.touchGutter : styles.touchBleed, pressed && styles.pressed]}>
      <View style={styles.row}>
        <ModeThumb mode={cup.mode} photo={cup.photo_uri} />

        <View style={styles.content}>
          <Text variant="title" numberOfLines={1}>
            {title}
          </Text>
          {source ? (
            <Text variant="rowSource" color="secondary" numberOfLines={1}>
              {source}
            </Text>
          ) : null}
          {words ? (
            <View style={styles.words}>
              <Glyph name="pen" token={icon.mark} color={archive.pen.color} />
              <Text variant="noteRow" color="secondary" numberOfLines={1} style={styles.wordsText}>
                {words}
              </Text>
            </View>
          ) : flavours ? (
            <Text variant="bodySm" color="muted" numberOfLines={1}>
              {flavours}
            </Text>
          ) : null}
        </View>

        <View style={styles.side}>
          <View style={styles.rating}>
            <Glyph name="star" token={icon.fill.sm} filled />
            <Text variant="numeralInline">{String(cup.rating)}</Text>
          </View>
          <Text variant="rowWhen" color="muted">
            {when}
          </Text>
        </View>
        {onPress ? (
          <View style={styles.chevron}>
            <Chevron />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // The touch area (and its pressed fill) reaches the screen's right edge,
  // padded back in so the content stays put.
  touch: {
    marginRight: -layout.gutter,
    paddingRight: layout.gutter,
  },
  touchBleed: {
    marginLeft: -layout.gutter,
    paddingLeft: layout.gutter,
  },
  touchGutter: {
    paddingLeft: archive.gutter.gap,
  },
  pressed: {
    backgroundColor: state.pressed.row,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: archive.row.gap,
    minHeight: archive.row.minHeight,
    paddingVertical: archive.row.inset,
  },
  // Centred on the row: beside the 48 thumb when shorter, and filling the
  // row (so top-aligned) when taller.
  content: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'center',
  },
  words: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: archive.pen.gap,
  },
  wordsText: {
    flexShrink: 1,
  },
  side: {
    width: archive.ratingColumn,
    alignItems: 'flex-end',
    // numeralInline renders on its natural box on iOS (design-system §3.2): no
    // gap, so the time sits close under the digits.
    gap: 0,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap.tight,
  },
  chevron: {
    alignSelf: 'center',
  },
});
