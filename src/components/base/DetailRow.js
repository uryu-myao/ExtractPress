import { Pressable, StyleSheet, View } from 'react-native';
import { color, shape, size, space, spacing, state } from '../../theme/tokens';
import Chevron from './Chevron';
import Text from './Text';

/**
 * A detail row (31g / 32a "About the coffee": Origin, Region, Process; the
 * family 29b draws 19a's date rows in): label on the left, the recorded
 * value on the right, then the chevron. The whole row opens its sheet.
 *
 *   label    textStyle.detailLabel (14 / 600), text.secondary
 *   value    textStyle.label (15 / 700), ink: a word in a list row, the same
 *            weight as "Mar 30"
 *   empty    "Add" in textStyle.detailEmpty (15 / 500), text.muted: nothing
 *            recorded
 *   divided  a divider above the row. Selection rows go WITHOUT (Uryu,
 *            2026-11-15: as Profile's rows, padding alone sets them apart)
 *   flag     optional emoji before the value (Origin: the country's flag,
 *            flags.js), textStyle.flag
 *   padding  spacing.inset.listRow (12 / 16); pressed: state.pressed.row
 *
 *   flush    no side padding: rows inside a card that pads them already (the
 *            bag form's Details, under Roaster; Uryu, 2026-11-15)
 *   framed   at least size.control.row (52) tall, keeping its own side
 *            padding (listRow.h, 16): Add a bag's "About the coffee" frame
 *            (Design Turn 37, 38a: rows of 52). The frame doesn't pad, so
 *            the pressed fill runs the frame's full width (Uryu, 2026-11-26)
 *
 * Props: label, value (null: "Add"), onPress, divided, flush, framed, flag
 */
export default function DetailRow({ label, value, onPress, divided = false, flush = false, framed = false, flag }) {
  const empty = value == null || value === '';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${empty ? 'not recorded' : value}`}
      accessibilityHint={empty ? 'Add' : 'Change'}
      style={({ pressed }) => [styles.row, flush && !framed && styles.flush, framed && styles.framed, divided && styles.divided, pressed && styles.pressed]}>
      <Text variant="detailLabel" color="secondary" numberOfLines={1} style={styles.label}>
        {label}
      </Text>
      <View style={styles.end}>
        {flag && !empty ? (
          <Text variant="flag" color="primary" importantForAccessibility="no-hide-descendants">
            {flag}
          </Text>
        ) : null}
        <Text variant={empty ? 'detailEmpty' : 'label'} color={empty ? 'muted' : 'primary'} numberOfLines={1} style={styles.value}>
          {empty ? 'Add' : value}
        </Text>
        <Chevron />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[12],
    paddingVertical: spacing.inset.listRow.v,
    paddingHorizontal: spacing.inset.listRow.h,
  },
  flush: {
    paddingHorizontal: 0,
  },
  framed: {
    minHeight: size.control.row,
  },
  divided: {
    borderTopWidth: shape.borderWidth.divider,
    borderTopColor: color.divider.hairline,
  },
  pressed: {
    backgroundColor: state.pressed.row,
  },
  label: {
    flexShrink: 0,
  },
  end: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: space[8],
    minWidth: 0,
  },
  value: {
    flexShrink: 1,
  },
});
