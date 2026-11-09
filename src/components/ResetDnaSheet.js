import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useDatabase } from '../data/DatabaseProvider';
import { resetTasteDna } from '../data/repository';
import { onResetDnaRequest } from '../navigation';
import { space, spacing } from '../theme/tokens';
import BottomSheet from './base/BottomSheet';
import Button from './base/Button';
import Text from './base/Text';

/**
 * Reset my taste DNA's confirmation (gaps.md 18; Design Round 24, §2: the
 * delete sheets' form, red secondary on top, "Keep it" under it). Opened by
 * requestResetDna() (6b's row). The copy is approved (2026-11-09): it says
 * first that nothing is deleted, since the action only looks destructive.
 * No undo after it (repository resetTasteDna).
 */
export function ResetDnaHost() {
  const db = useDatabase();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => onResetDnaRequest(() => setVisible(true)), []);

  const reset = async () => {
    setBusy(true);
    try {
      await resetTasteDna(db);
      setVisible(false);
    } catch (error) {
      console.error('[reset] failed', error);
      Alert.alert("Couldn't reset", String(error?.message ?? error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={() => setVisible(false)} swipeToClose>
      <Text variant="displaySm" color="primary">
        Reset my taste DNA?
      </Text>
      <Text variant="body" color="secondary">
        Every cup stays in Records, with its notes. Taste DNA starts again from today: only cups from now on count.
      </Text>
      <View style={styles.actions}>
        <Button variant="secondary" destructive label="Reset my taste DNA" onPress={reset} disabled={busy} />
        <Button variant="secondary" label="Keep it" onPress={() => setVisible(false)} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  // As 11b's: the buttons a step under the copy.
  actions: {
    marginTop: space[8],
    gap: spacing.gap.section,
  },
});
