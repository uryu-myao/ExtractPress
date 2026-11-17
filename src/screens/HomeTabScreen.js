import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '../components/base/Button';
import ArchiveRow from '../components/base/ArchiveRow';
import Text from '../components/base/Text';
import HomeStats, { monthStart } from '../components/HomeStats';
import ShelfBlock from '../components/ShelfBlock';
import TasteDnaCard from '../components/TasteDnaCard';
import TryNextCard from '../components/TryNextCard';
import { archiveLines } from '../constants/cups';
import { useDatabase } from '../data/DatabaseProvider';
import {
  countBags,
  countCupCafes,
  countCups,
  cupTimesSince,
  dismissTryNext,
  listCups,
  loadTasteDna,
  loadTryNext,
  onCupsChanged,
  onShelfChanged,
  undoDismissTryNext,
} from '../data/repository';
import { onTabLeave, requestDnaInfo, requestOpenCup, requestPush, requestShell } from '../navigation';
import { component, layout, space, spacing } from '../theme/tokens';
import BellButton from '../components/BellButton';
import ScreenFrame from './ScreenFrame';

/**
 * Home (1b; 4a / 4b are Home with My beans / My gear below), top to bottom:
 *   - the bell (23b; Design Round 26 C1): the way into 7a, the blue dot
 *     while a notice is unread (BellButton)
 *   - title: a greeting by part of day — 1b's "Good morning"; "Good
 *     afternoon" / "Good evening" ours, confirmed (Design Round 7); eyebrow
 *     the app's name, "Extract Press" (1b's mock says "MoreCoffee"; renamed
 *     2026-11-08)
 *   - HomeStats: cups total; This month, Bags, Cafés; the month strip
 *     (Design Round 21, 23b)
 *   - "Record a coffee" (primary) → the Record sheet, as the bar's +
 *   - the Taste DNA card; its stamp opens 15b's sheet (over the bar, so
 *     AppShell hosts it: DnaInfoHost); its foot row "Open my taste DNA ›"
 *     opens 8f (Design Round 11, B)
 *   - Try next (Design Round 23, 25c): one suggestion, only when there is
 *     one (TryNextCard; the rules in data/tryNext.ts). "Not for me" leaves
 *     the hidden line with Undo until Home is left; the next suggestion, or
 *     none, shows when Home is shown again.
 *   - "Recently sipped" (label.caps, ink: the shelf's open tab's style, Uryu
 *     2026-11-15; was display.sm) — no divider under it, room alone sets the
 *     block apart — with "See all ›" (to Records; the ›
 *     since Design Round 15, B4, as the shelf's action) and the three
 *     latest cups in Records' row (ArchiveRow, with the date; Uryu,
 *     2026-11-17: one cup list across the app) → their 2c
 *   - My beans / My gear (Round 14, 17a / 17b: three rows a side, swiped
 *     or tabbed; "See all beans & gear ›" opens 17c / 17d on that side)
 * Not shown: the line under the counts (dropped for V1,
 * Design Round 10, C10; gone in Round 21's 23b too).
 *
 * Screens opened from Home — Beans & gear (17c / 17d), 3c (Add a bag), 3a
 * (Add gear) — are pushed over Home and the bottom bar (ShellStack; their mocks
 * draw no bar). Back or a swipe from the left edge returns.
 * Everything is read on open and again whenever a cup or the shelf changes.
 */
/**
 * The greeting by the hour (Design Round 7, 16): morning before 12:00,
 * afternoon 12:00–17:59, evening from 18:00 and through the night. Its own
 * split, not partOfDay's (the cup's daypart words keep theirs).
 */
function greetingAt(date) {
  const h = date.getHours();
  if (h >= 18 || h < 5) return 'Good evening';
  return h < 12 ? 'Good morning' : 'Good afternoon';
}
const dayFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

export default function HomeTabScreen() {
  const db = useDatabase();
  const [data, setData] = useState(null);
  // A Try next suggestion just dismissed: its hidden line stays until Home is left.
  const [dismissed, setDismissed] = useState(null);
  const push = (name) => requestPush({ name });

  const load = useCallback(() => {
    const now = Date.now();
    Promise.all([
      loadTasteDna(db),
      countCups(db),
      cupTimesSince(db, monthStart(now)),
      countBags(db),
      countCupCafes(db),
      listCups(db),
      loadTryNext(db, now),
    ]).then(
      ([dna, total, month, bags, cafes, cups, tryNext]) => setData({ dna, total, month, bags, cafes, recent: cups.slice(0, 3), tryNext, now }),
      (error) => console.error('[home] could not read', error)
    );
  }, [db]);

  useEffect(() => {
    load();
    // The shelf too: adding a bag changes Bags without touching a cup.
    const offCups = onCupsChanged(load);
    const offShelf = onShelfChanged(load);
    const offLeave = onTabLeave((tab) => {
      if (tab !== 'home') return;
      setDismissed(null);
      load();
    });
    return () => {
      offCups();
      offShelf();
      offLeave();
    };
  }, [load]);

  const dismiss = async (suggestion) => {
    try {
      await dismissTryNext(db, suggestion);
      setDismissed(suggestion);
    } catch (error) {
      console.error('[home] could not dismiss', error);
    }
  };
  const undo = async () => {
    try {
      await undoDismissTryNext(db, dismissed.key);
    } catch (error) {
      console.error('[home] could not undo', error);
    }
    setDismissed(null);
    load();
  };
  const tryNext = dismissed ?? data?.tryNext;


  const greeting = greetingAt(new Date(data?.now ?? Date.now()));
  return (
    <View style={styles.screen}>
      <ScreenFrame scroll title={greeting} eyebrow="Extract Press" trailing={<BellButton />}>
        {data ? (
          <View style={styles.body}>
            <HomeStats total={data.total} monthCupTimes={data.month} bags={data.bags} cafes={data.cafes} now={data.now} />
            <Button label="Record a coffee" onPress={() => requestShell({ record: true })} />
            <TasteDnaCard dna={data.dna} onStampPress={() => requestDnaInfo(data.dna)} onOpen={() => push('dna')} />
            {tryNext ? <TryNextCard suggestion={tryNext} hidden={dismissed != null} onDismiss={() => dismiss(tryNext)} onUndo={undo} /> : null}
            {data.recent.length ? (
              <View style={styles.recent}>
                <View style={styles.recentHead}>
                  <Text variant="labelCaps" color="primary">
                    Recently sipped
                  </Text>
                  <Button variant="text" label="See all" trailingIcon="chevronRight" onPress={() => requestShell({ tab: 'records' })} />
                </View>
                {data.recent.map((cup) => (
                  <ArchiveRow
                    key={cup.id}
                    cup={cup}
                    lines={archiveLines(cup, 'none')}
                    when={dayFormat.format(new Date(cup.logged_at))}
                    onPress={() => {
                      requestShell({ tab: 'records' });
                      requestOpenCup(cup.id);
                    }}
                  />
                ))}
              </View>
            ) : null}
            <ShelfBlock
              onSeeAll={(side) => requestPush({ name: 'shelf', side })}
              onAddBag={() => push('addBag')}
              onAddGear={() => push('addGear')}
              onOpenBag={(bag) => requestPush({ name: 'editBag', bag })}
              onOpenGear={(gear) => requestPush({ name: 'editGear', gear })}
            />
          </View>
        ) : null}
      </ScreenFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    // 1b's blocks sit 20 apart (each section's padding-bottom).
    gap: space[20],
    // Room under the last block; the pager already ends at the bar's band
    // (Design Round 23: the band plus space.20).
    paddingBottom: space[20],
  },
  // Home's titled blocks (Recently sipped, the shelf) are set apart by room
  // alone, no dividers (Uryu, 2026-11-15): about 32–35 above a heading,
  // about 20 between a heading and its rows, so each heading reads as its
  // block's. Recently sipped: space.8 more above it than the body's 20; and
  // it hands back its last row's 6 of padding (ArchiveRow), since the
  // shelf's tabs already bring their own room (their 44 touch band).
  recent: {
    marginTop: space[8],
    marginBottom: -component.archive.row.inset,
  },
  // space.16 under the heading, then the first row's own 6: about 22 from
  // the caps' line to the first thumbnail (Uryu, 2026-11-17, on device: was
  // about 10 with Records' row, too close). Centred, so "See all" (its
  // chevron a little taller than the caps) shares the heading's line.
  recentHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.gap.section,
    paddingBottom: space[16],
  },
});
