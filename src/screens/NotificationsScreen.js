import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Badge from '../components/base/Badge';
import Chevron from '../components/base/Chevron';
import Glyph from '../components/base/Glyph';
import IconButton from '../components/base/IconButton';
import Text from '../components/base/Text';
import { NOTICES, noticeBadge } from '../constants/notices';
import { formatDay } from '../constants/dates';
import { useDatabase } from '../data/DatabaseProvider';
import { asSqlDb } from '../data/migrate';
import { listNotices, onNoticesChanged } from '../data/notices';
import { color, icon, shape, space, spacing, state } from '../theme/tokens';
import ScreenFrame from './ScreenFrame';

/**
 * 7a Notifications (Design Round 26 B3, 28c), pushed over the tabs and the
 * bar (ShellStack 'notifications'). The notices ship in the app
 * (constants/notices.js); data/notices.ts says which were delivered here and
 * which are read. Opening one (7b) is how it gets read: no Mark all read.
 *
 *   header   compact: Back, "Notifications" (titleCaps, as every pushed page)
 *   unread   "‹n› unread" in text.muted (28c; the mock's brown was off-role),
 *            first in the body; not shown at none
 *   groups   "This month" (the notice's date in this calendar month) and
 *            "Earlier", each a labelEyebrow heading over a 2px
 *            border.container frame on raised, as Profile's sections
 *   row      the badge, the date, the title, the summary. Unread: the blue
 *            square (space[8], the bell's dot, C1) and the text at full
 *            strength. Read: no square, the title and summary in
 *            text.muted. The badge never changes: a greyed badge read as a
 *            different kind (Uryu, 2026-11-12). Every row opens 7b and ends
 *            in the chevron (D-28)
 *   empty    the bell in text.muted, "Nothing yet" (displaySm), "News about
 *            Extract Press shows up here." No action (28c)
 *
 * Kept from before 28c, PROVISIONAL:
 *   - "‹n› unread" sits in the body: 28c draws it under a 31pt title, and
 *     pushed pages have the compact header (D-71).
 *   - No tinted background on unread rows (7a's #FFF8F1 has no token; 28c
 *     doesn't say).
 *   - No dividers between rows (Design Round 9).
 *   - The empty bell is icon.lg (22); 28c draws 28, which has no token.
 */
const dayOf = (date) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function NotificationsScreen({ onBack, onOpen }) {
  const db = useDatabase();
  const [notices, setNotices] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () => listNotices(asSqlDb(db), NOTICES).then((list) => alive && setNotices(list));
    load();
    const off = onNoticesChanged(load);
    return () => {
      alive = false;
      off();
    };
  }, [db]);

  const unread = notices ? notices.filter((n) => n.read_at == null).length : 0;
  const now = new Date();
  const thisMonth = (n) => {
    const d = dayOf(n.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };
  const groups = notices
    ? [
        { title: 'This month', items: notices.filter(thisMonth) },
        { title: 'Earlier', items: notices.filter((n) => !thisMonth(n)) },
      ].filter((g) => g.items.length)
    : [];

  return (
    <ScreenFrame scroll compact title="Notifications" leading={<IconButton icon="chevronLeft" accessibilityLabel="Back" onPress={onBack} />}>
      {notices ? (
        groups.length ? (
          <View style={styles.body}>
            {unread ? (
              <Text variant="meta" color="muted">
                {`${unread} unread`}
              </Text>
            ) : null}
            {groups.map((g) => (
              <View key={g.title} style={styles.section}>
                <Text variant="labelEyebrow" color="muted" accessibilityRole="header">
                  {g.title}
                </Text>
                <View style={styles.frame}>
                  {g.items.map((n) => (
                    <NoticeRow key={n.id} notice={n} onPress={() => onOpen(n.id, notices.map((x) => x.id))} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Glyph name="bell" token={icon.lg} color={color.text.muted} />
            <Text variant="displaySm" color="primary">
              Nothing yet
            </Text>
            <Text variant="body" color="secondary" style={styles.emptyLine}>
              News about Extract Press shows up here.
            </Text>
          </View>
        )
      ) : null}
    </ScreenFrame>
  );
}

function NoticeRow({ notice: n, onPress }) {
  const unread = n.read_at == null;
  const date = formatDay(dayOf(n.date).getTime());
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[unread ? 'Unread' : 'Read', noticeBadge(n), date, n.title].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={[styles.dot, unread && styles.dotUnread]} />
      <View style={styles.text}>
        <View style={styles.meta}>
          <Badge label={noticeBadge(n)} tone="selected" />
          <Text variant="meta" color="muted">
            {date}
          </Text>
        </View>
        <Text variant="label" color={unread ? 'primary' : 'muted'}>
          {n.title}
        </Text>
        <Text variant="bodySm" color={unread ? 'secondary' : 'muted'}>
          {n.summary}
        </Text>
      </View>
      <Chevron />
    </Pressable>
  );
}

/** The unread square: space[8] (28c: 7a's 9 snaps to it), the same mark as the bell's dot. */
const DOT = space[8];

const styles = StyleSheet.create({
  body: {
    gap: space[20],
    paddingBottom: space[20],
  },
  section: {
    gap: spacing.gap.row,
  },
  frame: {
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.container,
    backgroundColor: color.surface.raised,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    // 16 over the badge (Uryu, 2026-11-12: listRow's 12 read tight above
    // it; 28c draws 15). The bottom keeps 12: the summary's line height
    // already adds room under the text.
    paddingTop: space[16],
    paddingBottom: spacing.inset.listRow.v,
    paddingHorizontal: spacing.inset.listRow.h,
  },
  rowPressed: {
    backgroundColor: state.pressed.row,
  },
  dot: {
    width: DOT,
    height: DOT,
    alignSelf: 'flex-start',
    marginTop: space[6],
  },
  dotUnread: {
    backgroundColor: color.action.bg,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: spacing.gap.tight,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  empty: {
    alignItems: 'center',
    gap: space[8],
    paddingVertical: space[28],
  },
  emptyLine: {
    textAlign: 'center',
  },
});
