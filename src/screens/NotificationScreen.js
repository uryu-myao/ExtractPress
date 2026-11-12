import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Badge from '../components/base/Badge';
import Button from '../components/base/Button';
import IconButton from '../components/base/IconButton';
import InlineAction from '../components/base/InlineAction';
import Text from '../components/base/Text';
import { NOTICES, NOTICE_KIND_LABEL } from '../constants/notices';
import { formatDayWithYear } from '../constants/dates';
import { useDatabase } from '../data/DatabaseProvider';
import { asSqlDb } from '../data/migrate';
import { markNoticeRead } from '../data/notices';
import { requestCloseStack, requestPush, requestShell } from '../navigation';
import { color, shape, space, spacing } from '../theme/tokens';
import ScreenFrame from './ScreenFrame';

/**
 * 7b Notification (Design Round 26 B4, 28d), pushed from 7a (ShellStack
 * 'notification'). Opening it marks the notice read. Next notification walks
 * 7a's order without going back; each one opened is marked read.
 *
 *   header   compact: Back, "Notifications", meta "1 of 5" (its place in 7a)
 *   head     the badge and the date line, then the title (displaySm). An
 *            Update's date line carries its version ("Sep 10, 2026 ·
 *            v1.4.0"); a Notice's is the date alone
 *   card     the body's paragraphs, then the points, each on a hairline
 *            (divider.hairline), no icons: a bold lead-in, then its sentences
 *            (Design Round 27 D2, 29e)
 *   footer   the notice's action, when it has one, as the screen's primary
 *            (blue, 56): it is what the notice is for. Then "Next
 *            notification" (not on the last) and "Back to list". Without an
 *            action, only those two; nothing stands in for it
 *
 * Kept from before 28d, PROVISIONAL:
 *   - The title is displaySm (30); 7b draws 36, which has no text style.
 *   - Body text is text.secondary; 7b's #3C332E has no token (gaps.md, 8j's
 *     same colour).
 */
const dayOf = (date) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
};

/**
 * Where an action leads (NOTICE_TARGETS; 28d: each opened as it is
 * elsewhere). Record and My beans open over the pushed screens; a tab first
 * drops them (requestCloseStack).
 * TODO: My data and Support & feedback land on Profile's top; scrolling to
 * the section (6b / 6c) isn't built. No V1 notice leads there yet.
 */
const toTab = (tab) => () => {
  requestCloseStack();
  requestShell({ tab });
};
const GO = {
  record: () => requestShell({ record: true }),
  records: toTab('records'),
  beans: () => requestPush({ name: 'shelf', side: 'beans' }),
  tasteDna: () => requestPush({ name: 'dna' }),
  dnaBuilt: () => requestPush({ name: 'dnaBuilt' }),
  myData: toTab('profile'),
  support: toTab('profile'),
};

export default function NotificationScreen({ id, order, onBack }) {
  const db = useDatabase();
  const [current, setCurrent] = useState(id);
  const notice = NOTICES.find((n) => n.id === current);
  const at = order.indexOf(current);
  const next = at >= 0 && at < order.length - 1 ? order[at + 1] : null;

  useEffect(() => {
    markNoticeRead(asSqlDb(db), current);
  }, [db, current]);

  if (!notice) return null;
  const go = notice.action ? GO[notice.action.to] : null;

  return (
    <ScreenFrame
      scroll
      compact
      title="Notifications"
      leading={<IconButton icon="chevronLeft" accessibilityLabel="Back" onPress={onBack} />}
      meta={
        at >= 0 ? (
          <Text variant="meta" color="muted">
            {`${at + 1} of ${order.length}`}
          </Text>
        ) : undefined
      }
      footer={
        <View style={styles.footer}>
          {go ? <Button label={notice.action.label} onPress={go} /> : null}
          <View style={styles.links}>
            {next ? <InlineAction label="Next notification" onPress={() => setCurrent(next)} /> : <View />}
            <InlineAction label="Back to list" onPress={onBack} />
          </View>
        </View>
      }>
      <View style={styles.body}>
        <View style={styles.head}>
          <View style={styles.meta}>
            <Badge label={NOTICE_KIND_LABEL[notice.kind]} tone="selected" />
            <Text variant="meta" color="muted">
              {[formatDayWithYear(dayOf(notice.date)), notice.kind === 'update' ? `v${notice.version}` : null].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <Text variant="displaySm" color="primary" accessibilityRole="header">
            {notice.title}
          </Text>
        </View>
        <View style={styles.card}>
          {notice.body.map((p, i) => (
            <Text key={i} variant="body" color="secondary">
              {p}
            </Text>
          ))}
          {/* Points on hairlines, no icons (Design Round 27 D2, 29e): a bold lead-in, then its sentences. */}
          {notice.points?.map((p, i) => (
            <View key={i} style={styles.point}>
              <Text variant="body" color="secondary">
                {typeof p === 'string' ? (
                  p
                ) : (
                  <>
                    {/* noticeName: body's size and line, bold (14 / 700 / 21). */}
                    <Text variant="noticeName" color="primary">
                      {p.lead}
                    </Text>
                    {` ${p.text}`}
                  </>
                )}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: space[20],
    paddingBottom: space[20],
  },
  head: {
    gap: spacing.gap.row,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  card: {
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.container,
    backgroundColor: color.surface.raised,
    paddingVertical: spacing.inset.container.v,
    paddingHorizontal: spacing.inset.container.h,
    gap: space[14],
  },
  point: {
    borderTopWidth: shape.borderWidth.divider,
    borderTopColor: color.divider.hairline,
    paddingTop: space[14],
  },
  footer: {
    gap: spacing.gap.row,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
