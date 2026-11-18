import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { Field } from '../components/BagForm';
import CheckboxList from '../components/CheckboxList';
import { useRecordDraftIfAny } from '../components/RecordDraft';
import AddButton from '../components/base/AddButton';
import BottomSheet from '../components/base/BottomSheet';
import Button from '../components/base/Button';
import IconButton from '../components/base/IconButton';
import SearchField from '../components/base/SearchField';
import SegmentedControl from '../components/base/SegmentedControl';
import Text from '../components/base/Text';
import { GEAR_CATALOGUE, GEAR_CATEGORIES, GEAR_CATEGORY, GEAR_LIMIT } from '../constants/gear';
import { foldText, matchWordStart } from '../constants/match';
import { useDatabase } from '../data/DatabaseProvider';
import { countGear, insertGear, recordGearCapPush } from '../data/repository';
import { icon, spacing } from '../theme/tokens';
import ScreenFrame from './ScreenFrame';

/**
 * 3a — "Add gear" (2026-11-17; was 3a minimal, 8c's generic list), pushed
 * from Beans & gear's "Add gear", Home's shelf and 5a's Method.
 *
 * Header: compact, ‹ and the title as every pushed page (D-71; the header
 * stays as built, Uryu 2026-11-17), with 3a's stat "N / 8 Selected": the
 * shelf after saving (gear already owned + checked), since the cap is the
 * shelf's.
 * Body, top to bottom:
 *   tabs     Brewer · Grinder · Kettle · Scale (SegmentedControl, compact so
 *            four hold one line at 375). One category's list at a time.
 *   search   "Search brewers": the Origin sheet's word-start matcher
 *            (matchWordStart) over the active tab's names, the typed part in
 *            ink. The text stays when the tab changes ("Hario" across tabs).
 *   list     the tab's five catalogue rows (constants/gear.json) with their
 *            meta line, then any the user wrote in, multi-select checkboxes
 *            (CheckboxList). Checks persist across tabs.
 *   add      "Not listed — add your own" (AddButton) → the name sheet. With
 *            a search that matches nothing: "No brewers match “x”." and the
 *            button reads "Add “x” as a brewer" — the same button, no extra
 *            emphasis (confirmed 2026-11-17).
 * Footer: "Save N items" and "N slots left" (as built; 3a's 8-segment meter
 * is not built). Full, a line at the top of the body says what frees a
 * slot (not drawn; design-system.md §9 "Add gear at the cap").
 *
 * The name sheet (not drawn; confirmed 2026-11-17): "Add a brewer", one
 * Name field (the search text carried in), category from the tab. The new
 * gear appears CHECKED in the tab's list and is saved with Save, not on its
 * own: one save point, so Back still cancels everything. A name matching a
 * row already in the tab (ignoring case and accents) checks that row
 * instead of adding a second.
 *
 * At the cap (0 slots left): unchecked rows and the add button lock;
 * checked rows can still be unchecked; the line above the tabs says what to do. A tap
 * on a locked row or the locked button gives the warning haptic and is
 * counted (recordGearCapPush): a tap PAST the cap is wanting more than
 * allowed, which reaching 8 is not (schema.ts gear_cap_pushes). Counted at
 * most once per category per visit, so a few frustrated taps are one wish.
 * The light impact the moment the cap is reached stays (§1 Selection limit).
 *
 * Save writes the checked gear in the order it was checked; a catalogue pick
 * copies name, maker and meta (insertGear). The first of a category becomes
 * its default. From the Record sheet, the first brewer and grinder added go
 * on this cup (not only the defaults).
 */
const PLURAL = { brewer: 'brewers', grinder: 'grinders', kettle: 'kettles', scale: 'scales' };
const TABS = GEAR_CATEGORIES.map((value) => ({ value, label: GEAR_CATEGORY[value] }));
const keyOf = (category, name) => `${category}/${name}`;
const tidy = (s) => s.trim().replace(/\s+/g, ' ');

const CATALOGUE_ROWS = GEAR_CATALOGUE.map((g) => ({ ...g, key: keyOf(g.category, g.name) }));

const warn = () => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

export default function AddGearScreen({ onBack }) {
  const db = useDatabase();
  // In the Record sheet the gear added goes on this cup; from Home it just joins the shelf.
  const chooseGear = useRecordDraftIfAny()?.chooseGear;
  const [owned, setOwned] = useState(null);
  const [tab, setTab] = useState(GEAR_CATEGORIES[0]);
  const [query, setQuery] = useState('');
  // Keys, in the order checked (the first of a category becomes its default).
  const [selected, setSelected] = useState([]);
  // Gear written in on the name sheet this visit: { key, category, name }.
  const [written, setWritten] = useState([]);
  const [naming, setNaming] = useState(null);
  const pushed = useRef(new Set());

  useEffect(() => {
    let alive = true;
    countGear(db).then((n) => alive && setOwned(n), () => alive && setOwned(0));
    return () => {
      alive = false;
    };
  }, [db]);

  const total = (owned ?? 0) + selected.length;
  const left = GEAR_LIMIT - total;
  const full = owned == null || left <= 0;
  const q = tidy(query);

  const rows = useMemo(() => [...CATALOGUE_ROWS, ...written].filter((g) => g.category === tab), [tab, written]);
  const shown = useMemo(() => {
    const list = rows.map((g) => ({ name: g.key, label: g.name, meta: g.meta, hit: q ? matchWordStart(g.name, q) : null }));
    return q ? list.filter((r) => r.hit) : list;
  }, [rows, q]);

  const toggle = (key) => {
    const adding = !selected.includes(key);
    // §1 Selection limit: a light impact the moment the cap is reached, once.
    if (adding && total + 1 === GEAR_LIMIT && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  // A tap past the cap, on this tab: once per category per visit.
  const pushCap = () => {
    warn();
    if (owned == null || pushed.current.has(tab)) return;
    pushed.current.add(tab);
    recordGearCapPush(db, tab).catch((error) => console.warn('[gear] cap push not recorded', error));
  };

  const addWritten = (raw) => {
    const name = tidy(raw);
    if (!name) return;
    const same = rows.find((g) => foldText(g.name) === foldText(name));
    const key = same ? same.key : keyOf(tab, name);
    if (!same) setWritten((prev) => [...prev, { key, category: tab, name }]);
    setSelected((prev) => (prev.includes(key) ? prev : [...prev, key]));
    if (total + 1 === GEAR_LIMIT && !selected.includes(key) && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuery('');
    setNaming(null);
  };

  const save = async () => {
    try {
      const all = [...CATALOGUE_ROWS, ...written];
      const items = selected.map((key) => {
        const g = all.find((r) => r.key === key);
        return { name: g.name, category: g.category, maker: g.maker ?? null, meta: g.meta ?? null };
      });
      const { added } = await insertGear(db, items, GEAR_LIMIT);
      // In the Record sheet the gear just added is what this cup is made
      // with: the first brewer and grinder checked go on it, whatever the
      // shelf's defaults (Uryu, 2026-11-18: a new dripper didn't follow the
      // cup, which only took the defaults). A kind with nothing added keeps
      // this cup's pick.
      if (chooseGear) {
        const pick = {};
        for (const kind of ['brewer', 'grinder']) {
          const fresh = added.find((g) => g.category === kind);
          if (fresh) pick[kind] = fresh;
        }
        chooseGear(pick);
      }
      onBack();
    } catch (error) {
      console.error('[gear] could not add', error);
      Alert.alert("This gear wasn't added", `Your picks are still here. ${String(error?.message ?? error)}`);
    }
  };

  const n = selected.length;
  const noMatch = Boolean(q) && shown.length === 0;
  const slotsLine = owned == null ? null : left === 1 ? '1 slot left' : `${Math.max(left, 0)} slots left`;
  // Full only: what frees a slot, at the top with the header's counter
  // (design-system.md §9 "Add gear at the cap"). Unchecking here, or, with
  // nothing checked, removing gear in My gear (Design 2026-10-20).
  const fullLine = owned != null && left <= 0 ? (n > 0 ? 'No slots left. Uncheck one to choose another.' : 'No slots left. Remove gear from My gear to free one.') : null;

  return (
    // The name sheet sits beside the frame, not in its scrolling content (as 3e's).
    <View style={styles.screen}>
      <ScreenFrame
        scroll
        compact
        title="Add gear"
        leading={<IconButton icon="chevronLeft" accessibilityLabel="Back" onPress={onBack} />}
        stat={owned != null ? { value: `${total} / ${GEAR_LIMIT}`, label: 'Selected' } : undefined}
        footer={
          <View style={styles.footer}>
            {/* "Save 0 items" says why it is off, so a press warns (§1). */}
            <Button label={n === 1 ? 'Save 1 item' : `Save ${n} items`} onPress={save} disabled={n === 0 || owned == null} warnWhenDisabled={n === 0} />
            {slotsLine ? (
              <Text variant="bodySm" color="secondary" style={styles.slots}>
                {slotsLine}
              </Text>
            ) : null}
          </View>
        }>
        <View style={styles.body}>
          {fullLine ? (
            <Text variant="body" color="secondary">
              {fullLine}
            </Text>
          ) : null}
          <SegmentedControl compact options={TABS} value={tab} onChange={setTab} />
          {/* SearchField grows to fill a row (beside Back elsewhere); in this column it needs a row of its own to keep its height. */}
          <View style={styles.searchRow}>
            <SearchField value={query} onChangeText={setQuery} placeholder={`Search ${PLURAL[tab]}`} accessibilityLabel={`Search ${PLURAL[tab]}`} />
          </View>
          {noMatch ? (
            <Text variant="body" color="secondary">
              {`No ${PLURAL[tab]} match “${q}”.`}
            </Text>
          ) : (
            <CheckboxList
              items={shown}
              selected={selected}
              locked={full}
              lockedHint={n === 0 ? 'No slots left. Remove gear from My gear to free one.' : undefined}
              onToggle={toggle}
              onLockedPress={pushCap}
            />
          )}
          <AddButton
            icon="plus"
            iconToken={icon.sm}
            label={noMatch ? `Add “${q}” as a ${GEAR_CATEGORY[tab].toLowerCase()}` : 'Not listed — add your own'}
            disabled={full}
            onDisabledPress={pushCap}
            onPress={() => setNaming({ category: tab, name: q })}
          />
        </View>
      </ScreenFrame>
      <NameSheet naming={naming} onClose={() => setNaming(null)} onAdd={addWritten} />
    </View>
  );
}

/**
 * "Not listed — add your own" (not drawn; confirmed 2026-11-17): a name, the
 * category from the tab. Maker, photo and the rest are 3e's, later. The
 * copy ("Add a grinder", "Add") is ours, confirmed 2026-11-18.
 */
function NameSheet({ naming, onClose, onAdd }) {
  const [name, setName] = useState('');
  // The last opening's, so the sheet keeps its title while it slides out.
  const [shown, setShown] = useState(null);
  useEffect(() => {
    if (!naming) return;
    setName(naming.name);
    setShown(naming);
  }, [naming]);
  const kind = shown ? GEAR_CATEGORY[shown.category].toLowerCase() : '';
  return (
    <BottomSheet visible={Boolean(naming)} onClose={onClose} keyboard swipeToClose>
      <Text variant="displaySm" color="primary">
        {`Add a ${kind}`}
      </Text>
      <Field key={naming ? 'open' : 'closing'} label="Name" value={name} onChangeText={setName} autoFocus={Boolean(naming)} />
      <Button label="Add" onPress={() => onAdd(name)} disabled={!tidy(name)} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    gap: spacing.gap.section,
  },
  searchRow: {
    flexDirection: 'row',
  },
  footer: {
    gap: spacing.gap.row,
  },
  slots: {
    textAlign: 'center',
  },
});
