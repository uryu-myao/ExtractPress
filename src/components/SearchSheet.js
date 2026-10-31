import { useCallback, useMemo, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
// RNGH 3: the old ScrollView, which takes turns with the sheet's swipe (a
// legacy Gesture.Pan) as before. Moves to the new one with the gestures.
import { LegacyScrollView as ScrollView } from 'react-native-gesture-handler';
import BottomSheet from './base/BottomSheet';
import Button from './base/Button';
import InlineAction from './base/InlineAction';
import SearchField from './base/SearchField';
import Text from './base/Text';
import { color, shape, spacing } from '../theme/tokens';
import CheckboxList from './CheckboxList';
import RadioList from './RadioList';

/**
 * Search sheet (decided 2026-10-10): BottomSheet (full) + SearchField + a
 * list. Built for the flavour tags first; the bag's Origin reuses it later.
 * Stage 3's bag / gear pickers are a separate component (no search, richer
 * rows).
 *
 * The sheet runs from under the status bar to the keyboard (BottomSheet
 * `full`): on an SE about 282pt / 5 rows stay above the keyboard.
 *
 * Matching: case-insensitive; items whose label starts with the query come
 * first, then other matches (`match` overrides; Origin will match aliases
 * through `searchText`). The caller orders `items`.
 * Add: when `onAdd` is set and the query, normalised, matches no item
 * exactly (ignoring case), the last row offers Add "Query".
 *
 * The keyboard's return key (✓) enters what was typed (Uryu, 2026-11-01):
 * a row whose name it is (ignoring case) is picked, else it is added, as
 * the Add row would. Single mode then closes; multi mode keeps the sheet
 * open with the field cleared. Before, ✓ only hid the keyboard, and a name
 * typed but never added was lost on closing (on device: a drink, a product).
 *
 * Closing: "Back" beside the field (8l's slot): it only closes, and keeps
 * nothing typed, so "Done" read as if it saved (Uryu, 2026-11-01; Design
 * drew "Done" in 20a / 20f; Design Round 19), a tap on the dimmed page, or a swipe down (BottomSheet
 * swipeToClose, 2026-10-18). The list is gesture handler's ScrollView, so the
 * list's scroll and the swipe take turns (as in BottomSheet).
 *
 * Props
 *   visible, onClose
 *   placeholder
 *   items       [{ key, label, hint?, searchText? }], already ordered
 *   selected    keys
 *   mode        'multi' (5b's flavours) | 'single' (Packaged's product name,
 *               2026-10-15): radio rows; a pick or an Add closes the sheet
 *   selected    multi: keys; single: one key or null
 *   limit       multi only: at the limit unselected rows and Add lock
 *   onToggle    multi: (key) => void
 *   onPick      single: (key) => void
 *   onAdd       optional (label) => void, with `normalize`
 *   normalize   (query) => label, for Add
 *   match       (item, q) => 2 starts with / 1 contains / 0 no match;
 *               default on label or searchText
 *   onQueryChange  optional (query) => void, on every keystroke and with ''
 *               on close: for results fetched as the user types (the café
 *               sheet's map search, 2026-10-30). Such items pass `match`
 *               (they matched already, often on what the label doesn't show)
 *   status      optional line under the field (text.muted): the café
 *               sheet's searching / can't search / location off (Design
 *               Round 16, B2; the states are answered in words, not drawn)
 *   statusSettings  true: the line ends in "Open Settings" (InlineAction),
 *               the phone's settings for this app (Round 16, B2: location off)
 *   addHint     single mode: a line under the Add row (Round 16, B1: the
 *               café sheet's "Saved by name only")
 */
export const defaultMatch = (item, q) => {
  const hay = (item.searchText ?? item.label).toLowerCase();
  if (hay.startsWith(q)) return 2;
  return hay.includes(q) ? 1 : 0;
};

/**
 * A sheet's rows with the field's own value, and what this cup added, kept
 * (on device, 2026-10-31 / 11-01). A name added with Add "…" is in no
 * history until the cup is saved, so without this it vanished: on
 * reopening, and again once another row was picked.
 *   chosen  the field's value: leads unless a row has its name (ignoring
 *           case); a row spelled otherwise ("latte" for "Latte") takes its
 *           key, so its marker shows
 *   kept    every name added while logging this cup (useKept), newest
 *           first, after the value: switching to Cortado and back must not
 *           mean typing "ほうじ茶ラテ" again (Uryu). Saving the cup puts them
 *           in the history; discarding it drops them.
 * The flavour sheet keeps its words the same way (TastingNoteScreen
 * searchItems); the café sheet its places (CafeSheet).
 */
export function withChosen(items, chosen, kept = []) {
  const known = new Set(items.map((item) => item.label.toLowerCase()));
  const lead = [];
  let out = items;
  if (chosen) {
    const k = chosen.toLowerCase();
    if (known.has(k)) out = items.map((item) => (item.label.toLowerCase() === k ? { ...item, key: chosen } : item));
    else lead.push({ key: chosen, label: chosen });
    known.add(k);
  }
  for (const name of kept) {
    if (known.has(name.toLowerCase())) continue;
    known.add(name.toLowerCase());
    lead.push({ key: name, label: name });
  }
  return lead.length ? [...lead, ...out] : out;
}

/**
 * What was added while logging (or editing) one cup, by kind, newest first:
 * [kept, keep]. keep('drinks', 'Oat latte'); a café is kept by its MapKit id,
 * else its name. Lives as long as the cup's draft, so it ends with it.
 */
export function useKept() {
  const [kept, setKept] = useState({ drinks: [], products: [], flavours: [], cafes: [] });
  const keep = useCallback((kind, value) => {
    const id = (v) => (typeof v === 'string' ? v.toLowerCase() : v.externalId ?? v.name.toLowerCase());
    setKept((prev) => ({ ...prev, [kind]: [value, ...prev[kind].filter((v) => id(v) !== id(value))] }));
  }, []);
  return [kept, keep];
}

export default function SearchSheet({
  visible,
  onClose,
  placeholder,
  items,
  selected,
  mode = 'multi',
  limit,
  onToggle,
  onPick,
  onAdd,
  normalize = (q) => q.trim(),
  match = defaultMatch,
  onQueryChange,
  status,
  statusSettings = false,
  addHint,
}) {
  const [query, setQueryState] = useState('');
  const setQuery = (next) => {
    setQueryState(next);
    onQueryChange?.(next);
  };
  const q = query.trim().toLowerCase();

  const shown = useMemo(() => {
    if (!q) return items;
    return items
      .map((item, i) => ({ item, i, score: match(item, q) }))
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .map((m) => m.item);
  }, [items, q, match]);

  const added = onAdd && q ? normalize(query) : null;
  const canAdd = Boolean(added) && !items.some((item) => item.label.toLowerCase() === added.toLowerCase());
  const single = mode === 'single';
  const locked = !single && limit != null && selected.length >= limit;

  const close = () => {
    setQuery('');
    onClose();
  };

  // ✓ on the keyboard: pick the row with this name, or add it.
  const enter = () => {
    if (!q) return;
    const name = onAdd ? added : query.trim();
    const row = items.find((item) => item.label.toLowerCase() === name.toLowerCase());
    if (single) {
      if (row) onPick(row.key);
      else if (canAdd) onAdd(added);
      else return;
      close();
      return;
    }
    if (row) {
      if (!selected.includes(row.key) && !locked) onToggle(row.key);
    } else if (canAdd && !locked) onAdd(added);
    else return;
    setQuery('');
  };

  return (
    <BottomSheet visible={visible} onClose={close} full swipeToClose>
      <View style={styles.header}>
        <SearchField value={query} onChangeText={setQuery} placeholder={placeholder} autoFocus={visible} onSubmitEditing={enter} />
        <Button variant="text" label="Back" onPress={close} />
      </View>
      {status ? (
        <View style={styles.status}>
          <Text variant="meta" color="muted" style={styles.statusText}>
            {status}
          </Text>
          {statusSettings ? <InlineAction label="Open Settings" onPress={() => Linking.openSettings()} /> : null}
        </View>
      ) : null}
      {/* The 2px frame stays whole around the list; only its inside scrolls
          (decided 2026-10-12: a frame cut by the sheet's edge breaks "the
          box's outline", §1). */}
      <View style={[styles.list, shown.length || canAdd ? styles.frame : null]}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="none">
          {single ? (
            <RadioList
              framed={false}
              items={shown.map((item) => ({ key: item.key, label: item.label, meta: item.hint }))}
              selected={selected}
              onPick={(key) => {
                onPick(key);
                close();
              }}
              add={
                canAdd
                  ? {
                      label: `Add "${added}"`,
                      meta: addHint,
                      onPress: () => {
                        onAdd(added);
                        close();
                      },
                    }
                  : undefined
              }
            />
          ) : (
            <CheckboxList
              framed={false}
              items={shown.map((item) => ({ name: item.key, label: item.label, hint: item.hint }))}
              selected={selected}
              locked={locked}
              onToggle={onToggle}
              add={
                canAdd
                  ? {
                      label: `Add "${added}"`,
                      onPress: () => {
                        onAdd(added);
                        setQuery('');
                      },
                    }
                  : undefined
              }
            />
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap.row,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap.row,
  },
  statusText: {
    flex: 1,
  },
  list: {
    flexShrink: 1,
  },
  frame: {
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.strong,
    backgroundColor: color.surface.raised,
  },
});
