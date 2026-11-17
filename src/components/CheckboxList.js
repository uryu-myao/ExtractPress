import { Pressable, StyleSheet, View } from 'react-native';
import { color, icon, shape, size, space, spacing, state } from '../theme/tokens';
import { MatchedName } from './ChoiceSheet';
import Glyph from './base/Glyph';
import Text from './base/Text';

/**
 * Checkbox list (catalogue #7 checkbox list, #8 checkbox): a multi-select
 * list in one 2px frame. No item dividers (Design Round 9, 2026-10-18):
 * rows are set apart by spacing.inset.listRow alone. Used by 3a's
 * Gear pick list (8c's generic gear) and the flavour search sheet.
 *
 * Row (8c): a 24 checkbox, the name (title) and an optional hint (meta,
 * text.muted) beside it. 3a's rows put a meta line UNDER the name instead
 * ("Ceramic · Cone dripper", meta, text.muted); a searched row draws the
 * typed part in ink and the rest muted, as the Origin sheet (MatchedName). Checked = ink box with a ground tick and the name in ink (a
 * chosen option is ink, §1; 8c's blue was drift D-19). Unchecked = 2px ink
 * box on raised, name text.secondary. At the cap, unchecked rows lock (§1
 * Disabled options: name text.muted, box border.muted); the count says why. 8c's row tint
 * #FFF8F1 was absorbed into surface.raised, so a checked row has no tint.
 * The row is the pressable (≥ 44pt), so its pressed look is the surface.
 *
 * Add row (search sheet, `add`): last row, "Add \"xxx\"" beside an ink plus
 * (icon.sm) in the checkbox's 24 place, no frame — a row like the others
 * (dashed means only an empty or not-started state, decided 2026-10-18,
 * Uryu; a framed box would read as a checkbox). It locks with the rest at
 * the cap: plus and label muted.
 * TODO: no mock draws the add row; to be shown to Design.
 *
 * Props
 *   items     [{ name, label?, hint?, meta?, hit? }] — name is the key; label is
 *             shown (defaults to name); meta, the line under it; hit, a
 *             matchWordStart span while searching
 *   selected  names checked
 *   locked    true at the cap: unchecked rows can't be checked
 *   lockedHint what a screen reader adds on a locked row (§1 Selection
 *             limit). Defaults to §1's "deselect one" line; pass another
 *             when nothing can be deselected (3a with a full shelf)
 *   onToggle  (name) => void
 *   onLockedPress  optional (name) => void: a locked row (or the add row)
 *             stays pressable, with no pressed look, and calls this instead —
 *             3a counts a tap past the gear cap (schema.ts gear_cap_pushes)
 *   add       optional { label, onPress }: the add row
 *   framed    false when the container draws the frame (the search sheet's
 *             list scrolls inside a fixed frame)
 */
const LIMIT_HINT = 'Limit reached — deselect one to choose another.';

export default function CheckboxList({ items, selected, locked = false, lockedHint = LIMIT_HINT, onToggle, onLockedPress, add, framed = true }) {
  if (items.length === 0 && !add) return null;
  return (
    <View style={framed && styles.frame}>
      {items.map((item) => {
        const on = selected.includes(item.name);
        const off = locked && !on;
        return (
          <Pressable
            key={item.name}
            onPress={() => (off ? onLockedPress?.(item.name) : onToggle(item.name))}
            disabled={off && !onLockedPress}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on, disabled: off }}
            accessibilityLabel={[item.label ?? item.name, item.meta, item.hint].filter(Boolean).join(', ')}
            accessibilityHint={off ? lockedHint : undefined}
            style={({ pressed }) => [styles.row, pressed && !off && styles.pressed]}>
            <View style={[styles.box, on && styles.boxOn, off && styles.boxOff]}>
              {on ? <Glyph name="check" token={icon.xs} color={color.text.onInverse} /> : null}
            </View>
            {item.meta ? (
              <View style={styles.stack}>
                <MatchedName variant="title" label={item.label ?? item.name} hit={off ? null : item.hit} color={on ? 'primary' : off ? 'muted' : 'secondary'} />
                <Text variant="meta" color="muted" truncate="meta">
                  {item.meta}
                </Text>
              </View>
            ) : (
              <MatchedName variant="title" label={item.label ?? item.name} hit={off ? null : item.hit} color={on ? 'primary' : off ? 'muted' : 'secondary'} style={styles.name} />
            )}
            {item.hint ? (
              <Text variant="meta" color="muted" truncate="meta">
                {item.hint}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
      {add ? (
        <Pressable
          onPress={locked ? () => onLockedPress?.(null) : add.onPress}
          disabled={locked && !onLockedPress}
          accessibilityRole="button"
          accessibilityState={{ disabled: locked }}
          accessibilityLabel={add.label}
          accessibilityHint={locked ? lockedHint : undefined}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={styles.addMark}>
            <Glyph name="plus" token={icon.sm} color={locked ? color.text.muted : color.text.primary} />
          </View>
          <Text variant="title" color={locked ? 'muted' : 'primary'} style={styles.name} truncate="name">
            {add.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.container,
    backgroundColor: color.surface.raised,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    paddingVertical: spacing.inset.listRow.v,
    paddingHorizontal: spacing.inset.listRow.h,
  },
  // A frameless whole row (state.pressed.row, 2026-10-18): it already spans
  // its frame, edge to edge.
  pressed: {
    backgroundColor: state.pressed.row,
  },
  // Unchecked: a 2px ink box (decided 2026-10-12; 3a's mock). Locked:
  // border.muted, so the marker differs as well as the label (§1 Disabled
  // options). An unfilled frame never means "selected" (§1).
  box: {
    width: size.checkbox,
    height: size.checkbox,
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.strong,
    backgroundColor: color.surface.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: color.surface.inverse,
  },
  boxOff: {
    borderColor: color.border.muted,
  },
  addMark: {
    width: size.checkbox,
    height: size.checkbox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    minWidth: 0,
  },
  // 3a: the name over its meta line. 3a draws 3 apart; space[2] is the nearest step.
  stack: {
    flex: 1,
    minWidth: 0,
    gap: space[2],
  },
});
