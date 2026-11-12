import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { requestPush } from '../navigation';
import { reconcileStale, reminderText } from './bagReminders';
import { useDatabase } from './DatabaseProvider';
import { asSqlDb } from './migrate';
import { getBag, onShelfChanged } from './repository';

/**
 * Local notifications on the phone (Design Round 26; data-model.md
 * "Best-before"). Local only: app.json sets expo-notifications'
 * enableRemoteNotifications false, so the build carries no push entitlement
 * (aps-environment) and App Review has no push to ask about.
 *
 *   permission     'granted' | 'denied' | 'undetermined'. Provisional counts
 *                  as granted. Asked only when the user turns 6c's switch on
 *                  (Round 26 A3); never at launch
 *   syncReminders  reconcileStale over expo-notifications (bagReminders.ts).
 *                  If iOS has notifications off while the switch is on, the
 *                  switch goes off first (B2: back from Settings with
 *                  permission on, the row is off, ready to flip)
 *   NotificationsHost  mounted once inside AppShell: syncs on launch, on any
 *                  shelf change and on return to the foreground, and opens
 *                  what a tapped notification points at, including a tap
 *                  that launched the app
 */

// A reminder that comes while the app is open still shows as a banner.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function getPermission() {
  if (Platform.OS === 'web') return 'denied';
  const p = await Notifications.getPermissionsAsync();
  if (p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'granted';
  return p.status === 'undetermined' ? 'undetermined' : 'denied';
}

/** iOS's prompt: only while undetermined (it shows once; later calls answer at once). */
export async function requestPermission() {
  const p = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return p.granted ? 'granted' : 'denied';
}

export async function getNotifyStale(db) {
  const row = await db.getFirstAsync('SELECT notify_stale FROM device WHERE id = 1');
  return Boolean(row?.notify_stale);
}

export async function setNotifyStale(db, on) {
  await db.runAsync('UPDATE device SET notify_stale = ? WHERE id = 1', [on ? 1 : 0]);
  await syncReminders(db);
}

const scheduler = {
  pending: async () => (await Notifications.getAllScheduledNotificationsAsync()).map((n) => n.identifier),
  cancel: (id) => Notifications.cancelScheduledNotificationAsync(id),
  schedule: (reminder) => {
    const { title, body, open } = reminderText(reminder);
    return Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: { title, body, data: open },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(reminder.at) },
    });
  },
};

let syncing = Promise.resolve();

/** Cancel and re-plan every bag reminder. Serialised: two shelf changes in a row never interleave. */
export function syncReminders(db) {
  syncing = syncing
    .catch(() => {})
    .then(async () => {
      if (Platform.OS === 'web') return;
      if ((await getNotifyStale(db)) && (await getPermission()) !== 'granted') {
        await db.runAsync('UPDATE device SET notify_stale = 0 WHERE id = 1');
      }
      await reconcileStale(asSqlDb(db), scheduler);
    })
    .catch((error) => console.error('[notifications] sync failed', error));
  return syncing;
}

/** Where a tapped reminder goes (Round 26 C2): the bag's page, or My beans for several, or for a bag gone since. */
async function openFrom(db, data) {
  const bag = data?.bagId != null ? await getBag(db, data.bagId) : null;
  if (bag) requestPush({ name: 'editBag', bag });
  else requestPush({ name: 'shelf', side: 'beans' });
}

/**
 * Mount once, after ShellStack (AppShell renders it later), so a push
 * request from a launch tap finds ShellStack listening.
 */
export function NotificationsHost() {
  const db = useDatabase();
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    let handled = null;
    const open = (response) => {
      const key = `${response.notification.request.identifier}@${response.notification.date}`;
      if (handled === key) return;
      handled = key;
      openFrom(db, response.notification.request.content.data);
      // Once handled, a remount (or the next launch) mustn't open it again.
      Notifications.clearLastNotificationResponseAsync().catch(() => {});
    };
    syncReminders(db);
    Notifications.getLastNotificationResponseAsync().then((r) => r && open(r));
    const tap = Notifications.addNotificationResponseReceivedListener(open);
    const offShelf = onShelfChanged(() => syncReminders(db));
    const app = AppState.addEventListener('change', (next) => next === 'active' && syncReminders(db));
    return () => {
      tap.remove();
      offShelf();
      app.remove();
    };
  }, [db]);
  return null;
}

/** 6c's switch row: { on, permission, refresh }. Re-reads on return to the foreground (back from Settings). */
export function useStaleSwitch(db) {
  const [state, setState] = useState({ on: false, permission: 'undetermined' });
  const refresh = async () => {
    const [on, permission] = await Promise.all([getNotifyStale(db), getPermission()]);
    setState({ on: on && permission === 'granted', permission });
  };
  useEffect(() => {
    refresh();
    const app = AppState.addEventListener('change', (next) => next === 'active' && syncReminders(db).then(refresh));
    return () => app.remove();
  }, [db]);
  return { ...state, refresh };
}
