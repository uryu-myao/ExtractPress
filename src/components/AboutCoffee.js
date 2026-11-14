import { StyleSheet, View } from 'react-native';
import { color, shape, spacing } from '../theme/tokens';
import Text from './base/Text';
import RoastLevel from './RoastLevel';

/**
 * "About the coffee" (Turn 30 / 31; 31g, 32a / 32b): facts printed on the
 * bag, in one 2px frame on raised under a label.eyebrow. On 19a under the
 * status.
 *
 * IT MUST NOT READ AS A SIXTH AXIS (data-model.md "Roast is not a taste
 * axis"): it sits among bag details, and never appears in the Taste DNA card.
 *
 * Rows, in order:
 *   Roast level  first: RoastLevel, set in place (32a), padded 12 / 16 / 8.
 *                It is taller (title, track, legend), so it leads.
 *   then origin, region and process (columns on bags with no row yet; what
 *                Try Next's gap detection and origin matching will read)
 *                join under it as list rows (label · value · chevron, 31g's
 *                row; a hairline above each), each opening a picker that
 *                the screen hosts at its root, as DateSheet (32a "Later,
 *                with list rows under it"). They add rows here and a value
 *                field; the block's shape stays.
 *
 * Props
 *   value     { roastLevel } — the bag's facts as the screen holds them
 *   onChange  (field, next) => void — the screen decides when it is saved
 *             (19a: the Save bar's edits)
 */
export default function AboutCoffee({ value, onChange }) {
  return (
    <View style={styles.block}>
      <Text variant="labelEyebrow" color="muted">
        About the coffee
      </Text>
      <View style={styles.frame}>
        <View style={styles.sliderRow}>
          <RoastLevel value={value.roastLevel ?? null} onChange={(next) => onChange('roastLevel', next)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.gap.row,
  },
  frame: {
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.container,
    backgroundColor: color.surface.raised,
  },
  /**
   * 12 / 16 all round (32a draws 8 under the legend; Uryu on device,
   * 2026-11-14: it read heavier at the foot). The eyebrow's line box leaves
   * about 2 over its capitals and the flames almost none under them, so the
   * same 12 reads the same above and below.
   */
  sliderRow: {
    paddingVertical: spacing.inset.listRow.v,
    paddingHorizontal: spacing.inset.listRow.h,
  },
});
