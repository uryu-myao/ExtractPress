import { StyleSheet, View } from 'react-native';
import { bestBeforeCardLine, bestBeforeSentence, sealedBestBeforeLine } from '../constants/bagDates';
import { FRESHNESS_TUNING, FRESHNESS_WORDS, freshnessOf } from '../data/freshness';
import { color, component, icon, spacing } from '../theme/tokens';
import Glyph from './base/Glyph';
import Text from './base/Text';

/**
 * beanFreshness (3d's cards, 4b's rows): a clock, the bar and "Day 7 · drink
 * now", from the roast date (data/freshness.ts; a guide, not a prediction).
 *
 * Bar: the track, the peak band (FRESHNESS_TUNING.drinkFrom … drinkUntil of
 * span), the elapsed fill from the left, and the today marker (2 × 14) at
 * its end. Past `span` the fill stays full. Colours by state
 * (component.beanFreshness, Design Round 7 / 14a).
 * Without a roast date nothing is drawn: no day, no state, no bar.
 *
 * sealed (3d, a bag not opened yet; 2026-10-17): in the bar's place, a
 * sealed-bag glyph and "Sealed · clock starts when opened", with or without
 * a roast date.
 *
 * stacked (the bag page, Design Round 15, 19a): "Day 7 · drink now" on its
 * own line, the bar under it at the column's full width, no clock glyph.
 *
 * bestBefore (Design Round 27, 29b–29d): a bag with a best-before date and
 * no roast date says its date, never a state. No bar, no band, no state
 * colour (constants/bagDates.js):
 *   row      the calendar glyph and "Best before Oct 1 · 142 days left"
 *            (meterLabel, text.muted; "· passed" in text.secondary)
 *   sealed   the same glyph, "Sealed · best before Oct 1": its clock runs
 *            sealed, so not "clock starts when opened" (C1)
 *   stacked  19a: one sentence in the serif, "142 days to its best-before
 *            date" (displayXs; 29b draws 26, which has no style); passed in
 *            text.secondary
 * With a roast date the roast clock leads, as before.
 */
const { drinkFrom, drinkUntil, span } = FRESHNESS_TUNING;
const BAND = { left: `${(drinkFrom / span) * 100}%`, width: `${((drinkUntil - drinkFrom) / span) * 100}%` };
const meter = component.beanFreshness;

export default function BeanFreshness({ roastedAt, bestBefore = null, sealed = false, stacked = false }) {
  const bag = { roasted_at: roastedAt ?? null, best_before: bestBefore };
  const dated = sealed ? sealedBestBeforeLine(bag) : stacked ? null : bestBeforeCardLine(bag);
  if (dated) {
    return (
      <View style={styles.row}>
        <Glyph name="calendar" token={icon.sm} color={color.text.muted} />
        <Text variant="meterLabel" color={dated.passed ? 'secondary' : 'muted'} style={styles.sealedLabel}>
          {dated.text}
        </Text>
      </View>
    );
  }
  if (stacked && !sealed) {
    const sentence = bestBeforeSentence(bag);
    if (sentence) {
      return (
        <Text variant="displayXs" color={sentence.passed ? 'secondary' : 'primary'}>
          {sentence.text}
        </Text>
      );
    }
  }
  if (sealed) {
    return (
      <View style={styles.row}>
        <Glyph name="sealed" token={icon.sm} color={meter.sealed.glyph} />
        <Text variant="meterLabel" color={meter.sealed.label} style={styles.sealedLabel}>
          Sealed · clock starts when opened
        </Text>
      </View>
    );
  }
  const f = freshnessOf(roastedAt);
  if (!f) return null;
  const tone = meter[f.state];
  const label = `Day ${f.day} · ${FRESHNESS_WORDS[f.state]}`;
  if (stacked) {
    return (
      <View style={styles.stack} accessible accessibilityLabel={label}>
        <Text variant="meterLabel" color={tone.label}>
          {label}
        </Text>
        <FreshnessTrack freshness={f} />
      </View>
    );
  }
  return (
    <View style={styles.row} accessible accessibilityLabel={label}>
      <Glyph name="clock" token={icon.sm} color={tone.elapsed} />
      <FreshnessTrack freshness={f} style={styles.grow} />
      <Text variant="meterLabel" color={tone.label}>
        {label}
      </Text>
    </View>
  );
}

/**
 * The bar alone, for a freshness from freshnessOf(): Home's shelf rows draw
 * it short (size.statusColumn) under the state word (Round 14, 17b), with
 * the same colours and marker as here (component.beanFreshness).
 *   style  layout only: the bar's width (flex here, a fixed width on Home)
 */
export function FreshnessTrack({ freshness, style }) {
  const tone = meter[freshness.state];
  const at = `${freshness.elapsed * 100}%`;
  return (
    <View style={[styles.track, { backgroundColor: meter.track }, style]}>
      <View style={[styles.fill, BAND, { backgroundColor: tone.peakBand }]} />
      <View style={[styles.fill, { left: 0, width: at, backgroundColor: tone.elapsed }]} />
      <View style={[styles.marker, { left: at, backgroundColor: tone.todayMarker }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap.row,
  },
  sealedLabel: {
    flexShrink: 1,
  },
  stack: {
    gap: spacing.gap.row,
  },
  grow: {
    flex: 1,
  },
  track: {
    height: meter.height,
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  // Centred on the 4pt track: (14 − 4) / 2 = 5 above it.
  marker: {
    position: 'absolute',
    top: (meter.height - meter.marker.h) / 2,
    width: meter.marker.w,
    height: meter.marker.h,
    marginLeft: -meter.marker.w / 2,
  },
});
