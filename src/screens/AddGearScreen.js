import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Platform, StyleSheet, View } from 'react-native';
import { Field } from '../components/BagForm';
import CheckboxList from '../components/CheckboxList';
import DiscardSheet from '../components/DiscardSheet';
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
import { insertGear, listGearWithUse, recordGearCapPush } from '../data/repository';
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
 *            (CheckboxList). Checks persist across tabs. A row naming gear
 *            already on the shelf (same kind, same name ignoring case and
 *            accents) has an "On your shelf" badge after its name (Uryu,
 *            2026-11-20); it can still be checked.
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
 * its default. From the Record sheet, the first of each kind added goes on
 * this cup (not only the defaults).
 *
 * First setup's last step (Design Round 30, 36c; built 2026-11-21): this
 * screen with `setup` = { step, onDone }. Gear comes after beans, as
 * everywhere in the app (Uryu, 2026-11-21; 36c draws it first). 8c is 3a
 * once drinks_out is gone: the same cap (8, written "up to 8" in figures),
 * the same rule for defaults (the first of a category fills 5a's Method),
 * the same catalogue (not 8c's generic kinds). What changes:
 *   header  the standard header: ‹ (back to the bag step), "SETUP · 2 OF 2"
 *           (eyebrow) over the question as the title. No "Skip setup": on
 *           the last step it would do what Done does with nothing checked
 *           (as 36d drops it on its last step). No stat: "N slots left"
 *           keeps the count
 *   body    8c's line over 3a as it is
 *   footer  "Done", never off: it saves what is checked, or with nothing
 *           checked just finishes. TODO(Design): 36c's "Next" is a first
 *           step's word; "Done" is ours for the last. 36c puts the slots line
 *           above the button; it stays under, as 3a has it.
 * 36c's question title is serif 34 / 36; ours is display.lg (40 / 41).
 */
const PLURAL = { brewer: 'brewers', grinder: 'grinders', kettle: 'kettles', scale: 'scales' };
const TABS = GEAR_CATEGORIES.map((value) => ({ value, label: GEAR_CATEGORY[value] }));
const keyOf = (category, name) => `${category}/${name}`;
// The shelf's gear matched by kind and name, ignoring case and accents.
const ownedKey = (category, name) => `${category}/${foldText(tidy(name))}`;
const ON_SHELF = 'On your shelf';
const tidy = (s) => s.trim().replace(/\s+/g, ' ');

const CATALOGUE_ROWS = GEAR_CATALOGUE.map((g) => ({ ...g, key: keyOf(g.category, g.name) }));

const warn = () => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

export default function AddGearScreen({ onBack, setup, guardLeave }) {
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

  // The shelf as it is: its size for the cap, and what's on it, by kind and
  // folded name, for "On your shelf" (Uryu, 2026-11-20).
  const [ownedKeys, setOwnedKeys] = useState(() => new Set());
  useEffect(() => {
    let alive = true;
    listGearWithUse(db).then(
      (gear) => {
        if (!alive) return;
        setOwned(gear.length);
        setOwnedKeys(new Set(gear.map((g) => ownedKey(g.category, g.name))));
      },
      () => alive && setOwned(0)
    );
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
    const list = rows.map((g) => ({
      name: g.key,
      label: g.name,
      meta: g.meta,
      // Already on the shelf: a badge after the name, set apart from the
      // meta line's facts (Uryu, 2026-11-20); still checkable (two of the
      // same is a fair shelf).
      badge: ownedKeys.has(ownedKey(g.category, g.name)) ? ON_SHELF : undefined,
      hit: q ? matchWordStart(g.name, q) : null,
    }));
    return q ? list.filter((r) => r.hit) : list;
  }, [rows, q, ownedKeys]);

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
      // with: the first of each kind checked goes on it, whatever the
      // shelf's defaults (Uryu, 2026-11-18: a new dripper didn't follow the
      // cup, which only took the defaults). A kind with nothing added keeps
      // this cup's pick.
      if (chooseGear) {
        const pick = {};
        for (const kind of GEAR_CATEGORIES) {
          const fresh = added.find((g) => g.category === kind);
          if (fresh) pick[kind] = fresh;
        }
        chooseGear(pick);
      }
      guardLeave?.(false);
      if (setup) setup.onDone();
      else onBack({ force: true });
    } catch (error) {
      console.error('[gear] could not add', error);
      Alert.alert("This gear wasn't added", `Your picks are still here. ${String(error?.message ?? error)}`);
    }
  };

  const n = selected.length;
  // Leaving with gear checked asks first (Planner, 2026-11-27: as Add a bag
  // and Log a cup). ‹ asks here; the edge swipe through guardLeave. After a
  // save the screen leaves with { force: true }.
  const [discarding, setDiscarding] = useState(false);
  const askDiscard = () => {
    Keyboard.dismiss();
    setDiscarding(true);
  };
  useEffect(() => {
    guardLeave?.(n > 0, askDiscard);
  }, [guardLeave, n]); // eslint-disable-line react-hooks/exhaustive-deps
  const back = () => (n > 0 ? askDiscard() : onBack());
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
        compact={!setup}
        eyebrow={setup?.step}
        title={setup ? 'How do you usually brew?' : 'Add gear'}
        leading={<IconButton icon="chevronLeft" accessibilityLabel="Back" onPress={back} />}
        stat={owned != null && !setup ? { value: `${total} / ${GEAR_LIMIT}`, label: 'Selected' } : undefined}
        footer={
          <View style={styles.footer}>
            {setup ? (
              // Setup's last step: Done saves what is checked, or with nothing checked finishes.
              <Button label="Done" onPress={n > 0 ? save : setup.onDone} disabled={owned == null} />
            ) : (
              // "Save 0 items" says why it is off, so a press warns (§1).
              <Button label={n === 1 ? 'Save 1 item' : `Save ${n} items`} onPress={save} disabled={n === 0 || owned == null} warnWhenDisabled={n === 0} />
            )}
            {slotsLine ? (
              <Text variant="bodySm" color="secondary" style={styles.slots}>
                {slotsLine}
              </Text>
            ) : null}
          </View>
        }>
        <View style={styles.body}>
          {setup ? (
            <Text variant="body" color="secondary">
              {`Pick what you own now. This becomes your gear shelf — up to ${GEAR_LIMIT}, changeable any time.`}
            </Text>
          ) : null}
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
      {/* The Planner's words for Add a bag (2026-11-27), said of gear. TODO: Planner to confirm. */}
      <DiscardSheet
        visible={discarding}
        onClose={() => setDiscarding(false)}
        title="Leave without adding this gear?"
        body="Nothing you've entered will be kept."
        discardLabel="Leave"
        onDiscard={() => {
          setDiscarding(false);
          guardLeave?.(false);
          onBack({ force: true });
        }}
      />
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
