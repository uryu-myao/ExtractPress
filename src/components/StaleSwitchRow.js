import { Linking, StyleSheet, View } from 'react-native';
import { useDatabase } from '../data/DatabaseProvider';
import { requestPermission, setNotifyStale, useStaleSwitch } from '../data/notifications';
import { space, spacing } from '../theme/tokens';
import InlineAction from './base/InlineAction';
import MenuRow from './base/MenuRow';
import Switch from './base/Switch';
import Text from './base/Text';

/**
 * 6c's "Bag reminders" (Design Round 26 B1 / B2, 28a / 28b; renamed in Round
 * 27 C3, 29d: it sends both reminders): 8i's one switch, folded into 6c's
 * App section.
 *
 *   off      the default (A3). Turning it on is what asks iOS
 *   on       allowed: the reminders are planned (data/notifications.js)
 *   denied   iOS has notifications off for the app: the switch takes the
 *            disabled look and can't be flipped (a press gives the warning
 *            haptic); under the row, the reason and "Open Settings" (the
 *            app's page in iOS Settings). Back from Settings with permission
 *            on, the row is off, ready to flip
 * The sub line states both rules (29d).
 */
export default function StaleSwitchRow() {
  const db = useDatabase();
  const { on, permission, refresh } = useStaleSwitch(db);
  const denied = permission === 'denied';

  const flip = async (next) => {
    if (next && permission !== 'granted') {
      const answer = await requestPermission();
      if (answer !== 'granted') {
        await refresh();
        return;
      }
    }
    await setNotifyStale(db, next);
    await refresh();
  };

  return (
    <View>
      <MenuRow
        icon="bell"
        label="Bag reminders"
        sub={denied ? undefined : 'At 9:00, when a bag has been open 3 weeks, and a week before a best-before date'}
        subWraps
        trailing={<Switch value={on} onValueChange={flip} disabled={denied} warnWhenDisabled accessibilityLabel="Bag reminders" />}
      />
      {denied ? (
        <View style={styles.denied}>
          <Text variant="bodySm" color="secondary">
            Notifications for Extract Press are off in iOS Settings, so this can't be turned on here.
          </Text>
          <InlineAction label="Open Settings" onPress={() => Linking.openSettings()} style={styles.settings} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  denied: {
    gap: space[8],
    paddingHorizontal: spacing.inset.listRow.h,
    paddingBottom: spacing.inset.listRow.v,
  },
  settings: {
    alignSelf: 'flex-start',
  },
});
