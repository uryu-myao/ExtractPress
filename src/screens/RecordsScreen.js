import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Button from '../components/base/Button';
import Glyph from '../components/base/Glyph';
import IconButton from '../components/base/IconButton';
import ModeThumb from '../components/base/ModeThumb';
import Text from '../components/base/Text';
import TextLink from '../components/base/TextLink';
import RecordGroup from '../components/RecordGroup';
import RestoreRow from '../components/RestoreRow';
import RecordsSearch, { SEARCH_PLACEHOLDER } from '../components/RecordsSearch';
import { DEFAULT_GROUP, DEFAULT_SORT, arrangeCups, isDefaultOrder, orderPhrase } from '../constants/records';
import { useDatabase } from '../data/DatabaseProvider';
import { countOwnRecords, listCups, onCupsChanged, onShelfChanged } from '../data/repository';
import { onOpenCupRequest, onTabLeave, onTabReset, requestPush, requestShell, requestSortSheet } from '../navigation';
import { color, component, dashed, icon, shape, size, space, spacing, state } from '../theme/tokens';
import ScreenFrame from './ScreenFrame';

/**
 * Records — 2a, the list of logged cups, newest first, grouped by month.
 * Reads from the database and refreshes whenever a cup is saved.
 *
 * Under the header, 2a's row: the search field and the filter button.
 *   - The field is only an opener (2a draws it idle): pressing it puts
 *     search (RecordsSearch, Design Round 15) in the list's place, focused;
 *     Cancel brings the list back, and so does leaving the Records tab
 *     (Uryu, 2026-10-28). It says what search finds, as search's own field
 *     does.
 *   - The filter button (IconButton, 2a's filter glyph) opens 2b (SortSheet,
 *     shown by AppShell over the bar: requestSortSheet).
 *     Its sort and group apply to this list; each launch starts from Newest
 *     first / Month (not stored). The button looks the same either way: V1
 *     has no filter, and its "in force" look is drawn with one (Design
 *     Round 10, 16; gaps.md 16).
 * Redrawn by handoff-records (2026-11-16, 34a–34g): a group's heading is its
 * name and count (RecordGroup); the sort's name left the headings for the
 * state strip under the search row, "By brew method · newest first" with
 * Reset, shown only when the order isn't the default (Month · newest first).
 * Each heading pins under the header until the next one pushes it up
 * (RecordGroup; Uryu, 2026-10-24).
 *
 * The empty archive (34b), at 0 cups: no search row; a title, a line, the
 * ghost row (an example, not pressable), Record a coffee (opens the Record
 * sheet, as the bar's +), and "New phone? Restore a backup" while the whole
 * app is empty (6b's rule, countOwnRecords).
 *
 * A row opens the cup (2c, CupRecordScreen) through ShellStack ('cup'), over
 * the tabs AND the bottom bar (Uryu, 2026-11-12: the record page shows no
 * global bar; 2c's mock draws one). The list stays mounted under it: Back or
 * a swipe from the left edge returns to it. 2c's pencil pushes 11a on top;
 * a delete there closes both (ShellStack).
 *
 * No category chips since Design Round 15 ("2a: remove the chip row"):
 * search's Kind chips filter by mode (18a), and 2a is the archive itself,
 * header, search, list. The header's "N Cups" counts every cup.
 *
 * Rows: ArchiveRow, their lines from constants/cups archiveLines.
 */


const countFormat = new Intl.NumberFormat();
const monthFormat = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

/** 2c over the tabs and the bar (ShellStack 'cup'). */
const openCup = (id) => requestPush({ name: 'cup', id });

export default function RecordsScreen() {
  const db = useDatabase();
  const [cups, setCups] = useState(null);
  // Restore is offered only while the app holds nothing at all.
  const [appEmpty, setAppEmpty] = useState(false);
  const [order, setOrder] = useState({ sort: DEFAULT_SORT, group: DEFAULT_GROUP });
  const [searching, setSearching] = useState(false);
  // The list's y in the page (where its headings start to pin).
  const [listY, setListY] = useState(null);
  const groups = useMemo(() => (cups ? arrangeCups(cups, order.sort, order.group, monthFormat) : null), [cups, order]);

  const load = useCallback(() => {
    listCups(db).then(setCups, (error) => {
      console.error('[records] could not read cups', error);
      setCups([]);
      Alert.alert("Couldn't read your cups", String(error?.message ?? error));
    });
    countOwnRecords(db).then(
      (own) => setAppEmpty(own.cups + own.bags + own.gear + own.places === 0),
      () => setAppEmpty(false)
    );
  }, [db]);

  useEffect(() => {
    load();
    const offCups = onCupsChanged(load);
    const offShelf = onShelfChanged(load);
    return () => {
      offCups();
      offShelf();
    };
  }, [load]);

  // 5c's "See this record" and Home's recently sipped open the cup, over
  // everything (ShellStack), with Records under it.
  useEffect(() => onOpenCupRequest(openCup), []);
  useEffect(
    () =>
      onTabReset((tab) => {
        if (tab === 'records') setSearching(false);
      }),
    []
  );
  // Leaving Records closes the search: coming back shows the list (Uryu,
  // 2026-10-28). An open cup stays, as before.
  useEffect(
    () =>
      onTabLeave((tab) => {
        if (tab === 'records') setSearching(false);
      }),
    []
  );

  return (
    <View style={styles.screen}>
      {searching ? (
        <RecordsSearch onOpenCup={openCup} onCancel={() => setSearching(false)} />
      ) : (
        <ScreenFrame
          scroll
          eyebrow="The archive"
          title="Records"
          // 2a's count: numeral over "Cups". Shown once the cups are read.
          // TODO(i18n): plural rules beyond English's one / other.
          stat={cups ? { value: countFormat.format(cups.length), label: cups.length === 1 ? 'Cup' : 'Cups' } : undefined}>
          {cups && cups.length === 0 ? (
            <EmptyArchive restore={appEmpty} />
          ) : (
            <>
              <View style={styles.tools}>
                <Pressable
                  onPress={() => setSearching(true)}
                  accessibilityRole="search"
                  accessibilityLabel="Search"
                  accessibilityHint={SEARCH_PLACEHOLDER}
                  style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}>
                  <Glyph name="search" token={icon.md} color={color.text.primary} />
                  <Text variant="body" color="placeholder" numberOfLines={1} style={styles.fieldText}>
                    {SEARCH_PLACEHOLDER}
                  </Text>
                </Pressable>
                <IconButton icon="filter" accessibilityLabel="Sort and group" onPress={() => requestSortSheet({ sort: order.sort, group: order.group, onApply: setOrder })} />
              </View>
              {isDefaultOrder(order) ? null : (
                <View style={styles.strip}>
                  <Text variant="meta" color="secondary" numberOfLines={1} style={styles.stripText}>
                    {orderPhrase(order)}
                  </Text>
                  <TextLink label="Reset" accessibilityLabel="Reset sort and group" onPress={() => setOrder({ sort: DEFAULT_SORT, group: DEFAULT_GROUP })} />
                </View>
              )}
              <View
                style={styles.list}
                onLayout={(e) => {
                  const at = e.nativeEvent.layout.y;
                  setListY((prev) => (prev === at ? prev : at));
                }}>
                {groups
                  ? groups.map((group, i) => (
                      <RecordGroup key={group.key} group={group} grouping={order.group} first={i === 0} top={0} listY={listY} onOpen={openCup} />
                    ))
                  : null}
              </View>
            </>
          )}
        </ScreenFrame>
      )}
    </View>
  );
}

/**
 * 34b, the empty archive (handoff-records §4). The ghost row is dashed: an
 * example, "not started", not a thing to press. Record a coffee opens the
 * Record sheet, as the bar's + does. Restore shows only while the whole app
 * is empty.
 * TODO(design): §4 gives no spacing between its parts (34b isn't in the local
 * canvas copy); space.8 under the title, space.20 between the blocks.
 */
function EmptyArchive({ restore }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyText}>
        <Text variant="displaySm">Nothing in the archive yet</Text>
        <Text variant="body" color="secondary">
          Every cup I log lands here, by day. A rating is enough to save one; it takes about 15 seconds.
        </Text>
      </View>
      <View style={styles.ghost} accessible accessibilityLabel="An example of a logged cup">
        <ModeThumb ghost />
        <View style={styles.ghostText}>
          <Text variant="title" color="placeholder" numberOfLines={1}>
            My first cup
          </Text>
          <Text variant="rowSource" color="placeholder" numberOfLines={1}>
            What it was · how it was made
          </Text>
        </View>
        <View style={styles.ghostRating}>
          <Glyph name="star" token={icon.stamp} color={color.text.placeholder} />
          <Text variant="numeralInline" color="placeholder">
            –
          </Text>
        </View>
      </View>
      <Button label="Record a coffee" onPress={() => requestShell({ record: true })} />
      {restore ? <RestoreRow /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  tools: {
    flexDirection: 'row',
    gap: spacing.gap.row,
  },
  // 2a's idle search field: SearchField's frame at 2a's 44 (size.tapTarget,
  // beside the 44 filter button), the placeholder in body.
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap.row,
    height: size.tapTarget,
    paddingHorizontal: space[12],
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.strong,
    backgroundColor: color.surface.raised,
  },
  fieldPressed: {
    backgroundColor: state.pressed.surface,
  },
  fieldText: {
    flex: 1,
  },
  // The state strip (handoff-records §1): 4 under the search row, on the
  // gutter; Reset at the right.
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.gap.row,
    marginTop: space[4],
  },
  stripText: {
    flexShrink: 1,
  },
  empty: {
    gap: space[20],
  },
  emptyText: {
    gap: spacing.gap.row,
  },
  // The ghost row (§4): dashed.ghost all round; §4's 10 / 12 padding, the
  // 10 folded to 12 (Round 9: every list row is 12).
  ghost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: component.archive.row.gap,
    paddingVertical: spacing.inset.listRow.v,
    paddingHorizontal: space[12],
    borderStyle: dashed.ghost.style,
    borderWidth: dashed.ghost.width,
    borderColor: dashed.ghost.color,
  },
  ghostText: {
    flex: 1,
    minWidth: 0,
  },
  ghostRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap.tight,
  },
  // 8l's 16 from the search row to the list (it sat under the chips).
  list: {
    paddingTop: space[16],
    zIndex: 1,
    // Room under the last row; the pager already ends at the bar's band
    // (Design Round 23: the band plus space.20).
    paddingBottom: space[20],
  },
});
