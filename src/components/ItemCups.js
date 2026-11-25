import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { archiveLines } from '../constants/cups';
import { partOfDay } from '../constants/dates';
import { cupsForFilter } from '../constants/search';
import { useDatabase } from '../data/DatabaseProvider';
import { listCups, onCupsChanged } from '../data/repository';
import { spacing } from '../theme/tokens';
import Button from './base/Button';
import ArchiveRow from './base/ArchiveRow';
import SectionLabel from './base/SectionLabel';
import Text from './base/Text';

/**
 * The bag and gear pages' cup list (Design Round 15, 19a / 19c). It sits
 * above the details: arriving to look means wanting "what came of it"
 * first, and the ~480 form would push it below the fold.
 *
 *   heading  "Cups from this bag · 3" / "Cups with this grinder · 3"; with
 *            no cups, the heading alone (19c)
 *   rows     the latest 5, Records' row (ArchiveRow; Uryu, 2026-11-25: one
 *            cup list across the app, as Home and Records; was ItemRow with
 *            "date · method", the flavours, the part of day). Its lines
 *            leave out what the page already is (pageLines); the date, no
 *            year, under the rating. Each opens 2c.
 *   more     past 5, "All N cups ›": search with this bag or gear as a
 *            block, in the archive's shape (18e)
 *   empty    one row: "No cups with this grinder yet." (bodySm, muted: the
 *            same quiet hint as the photo's "No photo yet. Tap to add one.")
 *            and, at its end, "Log a cup with it ›" (Log a cup with the item
 *            preselected), when there is a way to log one
 *
 * Props: cups (newest first), page ('bag', or the gear's category), heading,
 *        emptyLine, logLabel, onLog (optional), onOpen(id), onAll
 */
const ROWS = 5;

/** The date under the rating, as Home's and Records' rows: "Nov 21", no year. */
const dayFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

/**
 * The cups a search block keeps (bagFilter / gearFilter), newest first,
 * re-read whenever a cup changes. null until read.
 */
export function useFilteredCups(filter) {
  const db = useDatabase();
  const [cups, setCups] = useState(null);
  const { type, value } = filter;
  useEffect(() => {
    let alive = true;
    const load = () =>
      listCups(db).then(
        (all) => alive && setCups(cupsForFilter(all, { type, value })),
        (error) => console.error('[cups] could not read', error)
      );
    load();
    const off = onCupsChanged(load);
    return () => {
      alive = false;
      off();
    };
  }, [db, type, value]);
  return cups;
}

/**
 * A cup's lines on its bag's or gear's page: Records' (archiveLines), less
 * what the page is.
 *   bag     the bean is the page: the brewer as the title, the grinder
 *           under it ("Hario V60 02" / "Comandante C40"); no brewer, the
 *           grinder alone; neither, "‹Morning› cup" (as Records names a cup
 *           with nothing noted)
 *   brewer  Records' lines, the roaster alone under the bean (the method
 *           is the page)
 *   other   Records' lines as they are (grinder, kettle and scale aren't
 *           on them)
 */
function pageLines(cup, page) {
  const lines = archiveLines(cup, 'none');
  if (page === 'bag') {
    const title = cup.brew_method || cup.grinder || `${partOfDay(new Date(cup.logged_at))} cup`;
    return { ...lines, title, source: (cup.brew_method && cup.grinder) || null };
  }
  if (page === 'brewer' && cup.bean_name) return { ...lines, source: cup.bean_roaster || null };
  return lines;
}

export default function ItemCups({ cups, page, heading, emptyLine, logLabel, onLog, onOpen, onAll }) {
  return (
    <View style={styles.section}>
      <SectionLabel variant="plain" label={cups.length ? `${heading} · ${cups.length}` : heading} />
      {cups.length ? (
        <>
          <View>
            {cups.slice(0, ROWS).map((cup) => (
              <ArchiveRow key={cup.id} cup={cup} lines={pageLines(cup, page)} when={dayFormat.format(new Date(cup.logged_at))} onPress={() => onOpen(cup.id)} />
            ))}
          </View>
          {cups.length > ROWS ? (
            <View style={styles.action}>
              <Button variant="text" label={`All ${cups.length} cups`} trailingIcon="chevronRight" onPress={onAll} />
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.empty}>
          <Text variant="bodySm" color="muted" style={styles.emptyLine}>
            {emptyLine}
          </Text>
          {onLog ? <Button variant="text" label={logLabel} trailingIcon="chevronRight" onPress={onLog} /> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.gap.tight,
  },
  action: {
    alignItems: 'flex-start',
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.gap.row,
  },
  emptyLine: {
    flexShrink: 1,
  },
});
