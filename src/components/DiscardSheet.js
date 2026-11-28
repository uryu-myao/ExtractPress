import { StyleSheet, View } from 'react-native';
import { space, spacing } from '../theme/tokens';
import BottomSheet from './base/BottomSheet';
import Button from './base/Button';
import Text from './base/Text';

/**
 * Leaving an edit form with unsaved changes (Design Round 4, 19; the 11b
 * shape): "Discard your changes?", a body naming the object, primary "Keep
 * editing", text action "Discard changes". 11a and 3g; 3e / 6d later.
 *
 * Leaving something not added yet (Add a bag, Log a cup, Add gear; Planner,
 * 2026-11-27) asks "Leave without adding this bag?" with "Leave": the same
 * sheet, its title and its destructive text action given (26a / 26b: red
 * text, no red fill).
 *
 * Props
 *   visible, onClose (Keep editing, or the scrim)
 *   title        default "Discard your changes?"
 *   body       "Your edits to this cup won't be saved. The cup stays as it was."
 *   discardLabel default "Discard changes"
 *   onDiscard
 */
export default function DiscardSheet({ visible, onClose, title = 'Discard your changes?', body, discardLabel = 'Discard changes', onDiscard }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} swipeToClose>
      <Text variant="displaySm" color="primary">
        {title}
      </Text>
      <Text variant="body" color="secondary">
        {body}
      </Text>
      <View style={styles.actions}>
        <Button label="Keep editing" onPress={onClose} />
        <Button variant="text" stacked destructive label={discardLabel} onPress={onDiscard} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  // The buttons sit a step under the copy (11b: margin-top 8 over the sheet's gap).
  actions: {
    marginTop: space[8],
    gap: spacing.gap.section,
  },
});
