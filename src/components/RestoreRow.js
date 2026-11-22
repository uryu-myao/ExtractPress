import { StyleSheet, View } from 'react-native';
import { requestRestore } from '../navigation';
import { color, shape, spacing } from '../theme/tokens';
import Text from './base/Text';
import TextLink from './base/TextLink';

/**
 * "New phone? Restore a backup" (Design 34b, 36a): a hairline above, the
 * line at the left, the text action at the right. One way to restore, worded
 * once: Records' empty archive (34b) and Welcome (36a). Its owner shows it
 * only while the whole app is empty (countOwnRecords), as Restore needs.
 */
export default function RestoreRow() {
  return (
    <View style={styles.row}>
      <Text variant="sheetNote" color="secondary">
        New phone?
      </Text>
      <TextLink label="Restore a backup" onPress={requestRestore} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.gap.row,
    borderTopWidth: shape.borderWidth.divider,
    borderTopColor: color.divider.hairline,
  },
});
