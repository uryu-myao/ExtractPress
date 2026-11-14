import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
// RNGH 3: the old ScrollView, which takes turns with the sheet's swipe.
import { LegacyScrollView as ScrollView } from 'react-native-gesture-handler';
import { foldText, matchWordStart } from '../constants/match';
import { color, icon, shape, size, space, spacing, state } from '../theme/tokens';
import BottomSheet from './base/BottomSheet';
import Glyph from './base/Glyph';
import SearchField from './base/SearchField';
import Text from './base/Text';
import TextLink from './base/TextLink';

/**
 * Choice sheet (Turn 31, 32e / 32f; brief 4b): pick one value for a bag's
 * fact — Origin, Region, Process — from lists, by search, or as written.
 * ONE COMPONENT, driven by data: the three are configurations, not variants.
 *
 *   header   the title (display.sm) and, under it, an optional scope
 *            (meta, text.muted: "In Ethiopia", "No origin yet"); a Clear
 *            TextLink at the right sets the value back to empty and closes
 *   search   optional (Origin, Region; Process has none): SearchField,
 *            focused only when tapped. Typing turns the lists into one
 *            "Results" list: the pool's items whose name matches at the
 *            start of any word (matchWordStart), the typed part in ink, the
 *            rest text.muted; an alias match shows the name whole.
 *   note     optional, under the field: a line and an action (Region with no
 *            origin: "Regions are listed by origin …" · Choose origin first)
 *   lists    one or two sections, each under a label.eyebrow, in one 2px
 *            border.container frame on raised: rows at least 48, 10 / 16,
 *            a 1.5 divider.hairline above every row after the first; the
 *            name in `label` (15 / 700), an optional meta line (bodySm,
 *            text.muted: "3 bags", "Colombia"); the current value carries an
 *            ink check. A check, not RadioList's square: 32e and the brief
 *            draw it, and these are long, searched lists of names where the
 *            check marks the one in force (a §9 exception, design-system.md).
 *   free     'noMatch' (Origin): with no result, a line and "Use “‹text›”
 *            as written". 'always' (Region): under any results, "Not here?"
 *            and the same action, since farms and washing stations are in
 *            no table. Absent (Process): nothing typed is ever stored.
 * One tap picks and closes. What a pick or a written value means is the
 * caller's (19a: the Save bar; 3c: written on add).
 *
 * ChoiceSheetBody is the content alone (the dev harness draws its states
 * inline); ChoiceSheet wraps it in a BottomSheet (full, keyboard-following,
 * when it searches).
 *
 * Props (body)
 *   title, scope, onClear
 *   search     { placeholder } | undefined
 *   sections   [{ label?, items: [{ key, label, meta?, aliases? }] }], shown
 *              before any typing (an empty section is left out); key is the
 *              value stored. Process has one, unlabelled.
 *   pool       items searched while typing; default: the sections' items,
 *              first occurrence kept (so "From my bags" counts carry over)
 *   selected   the current key, or null
 *   onPick     (key or written text) => void
 *   free       { mode: 'noMatch' | 'always', noMatch: (text) => line } | undefined
 *   note       { text, action: { label, onPress } } | undefined
 *   initialQuery  harness only
 */
const tidy = (q) => q.trim().replace(/\s+/g, ' ');

function Name({ label, hit }) {
  if (!hit) {
    return (
      <Text variant="label" color="primary" truncate="name">
        {label}
      </Text>
    );
  }
  const chars = Array.from(label);
  const before = chars.slice(0, hit.start).join('');
  const typed = chars.slice(hit.start, hit.start + hit.length).join('');
  const after = chars.slice(hit.start + hit.length).join('');
  return (
    <Text variant="label" color="muted" truncate="name">
      {before}
      <Text variant="label" color="primary">
        {typed}
      </Text>
      {after}
    </Text>
  );
}

function Row({ item, hit, on, divided, onPick }) {
  return (
    <Pressable
      onPress={() => onPick(item.key)}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={[item.label, item.meta].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.row, divided && styles.divided, pressed && styles.pressed]}>
      <View style={styles.rowText}>
        <Name label={item.label} hit={hit} />
        {item.meta ? (
          <Text variant="bodySm" color="muted" truncate="meta">
            {item.meta}
          </Text>
        ) : null}
      </View>
      {on ? <Glyph name="check" token={icon.md} color={color.text.primary} /> : null}
    </Pressable>
  );
}

function List({ label, items, selected, onPick, hits }) {
  return (
    <View style={styles.section}>
      {label ? (
        <Text variant="labelEyebrow" color="muted">
          {label}
        </Text>
      ) : null}
      <View style={styles.frame}>
        {items.map((item, i) => (
          <Row key={item.key} item={item} hit={hits?.get(item.key)} on={item.key === selected} divided={i > 0} onPick={onPick} />
        ))}
      </View>
    </View>
  );
}

export function ChoiceSheetBody({ title, scope, onClear, search, sections = [], pool, selected = null, onPick, free, note, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const q = tidy(query);

  const everything = useMemo(() => {
    if (pool) return pool;
    const seen = new Set();
    return sections.flatMap((s) => s.items).filter((i) => (seen.has(i.key) ? false : seen.add(i.key)));
  }, [pool, sections]);

  const { results, hits } = useMemo(() => {
    if (!q) return { results: [], hits: null };
    const map = new Map();
    const found = [];
    for (const item of everything) {
      const hit = matchWordStart(item.label, q);
      if (hit) {
        map.set(item.key, hit);
        found.push(item);
      } else if (item.aliases?.some((a) => matchWordStart(a, q))) {
        found.push(item);
      }
    }
    return { results: found, hits: map };
  }, [everything, q]);

  const exact = q && everything.some((i) => foldText(i.label) === foldText(q));
  const written = `Use “${q}” as written`;

  return (
    <>
      <View style={styles.header}>
        <View style={styles.titleColumn}>
          <Text variant="displaySm" color="primary">
            {title}
          </Text>
          {scope ? (
            <Text variant="meta" color="muted">
              {scope}
            </Text>
          ) : null}
        </View>
        {onClear ? <TextLink label="Clear" accessibilityLabel={`Clear ${title}`} onPress={onClear} /> : null}
      </View>
      {search ? <SearchField value={query} onChangeText={setQuery} placeholder={search.placeholder} /> : null}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bounces={false}>
        {note ? (
          <View>
            <Text variant="sheetNote" color="secondary">
              {note.text}
            </Text>
            <TextLink label={note.action.label} onPress={note.action.onPress} />
          </View>
        ) : null}
        {!q ? (
          sections.filter((s) => s.items.length).map((s, i) => <List key={s.label ?? i} label={s.label} items={s.items} selected={selected} onPick={onPick} />)
        ) : (
          <>
            {results.length ? <List label="Results" items={results} selected={selected} onPick={onPick} hits={hits} /> : null}
            {free && !exact && (free.mode === 'always' || !results.length) ? (
              <View>
                <Text variant="sheetNote" color="secondary">
                  {free.mode === 'always' ? 'Not here?' : free.noMatch(q)}
                </Text>
                <TextLink label={written} onPress={() => onPick(q)} />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </>
  );
}

export default function ChoiceSheet({ visible, onClose, onPick, onClear, ...body }) {
  // Each opening starts with an empty field: the body remounts.
  const [opening, setOpening] = useState(0);
  useEffect(() => {
    if (visible) setOpening((n) => n + 1);
  }, [visible]);
  return (
    <BottomSheet visible={visible} onClose={onClose} full={Boolean(body.search)} swipeToClose>
      <ChoiceSheetBody
        key={opening}
        {...body}
        onPick={(value) => {
          onPick(value);
          onClose();
        }}
        onClear={
          onClear
            ? () => {
                onClear();
                onClose();
              }
            : undefined
        }
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[12],
  },
  titleColumn: {
    flexShrink: 1,
    gap: space[2],
  },
  scroll: {
    flexShrink: 1,
  },
  content: {
    gap: space[14],
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
    minHeight: size.choiceRow,
    paddingVertical: spacing.inset.listRow.v,
    paddingHorizontal: spacing.inset.listRow.h,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
  },
  divided: {
    borderTopWidth: shape.borderWidth.divider,
    borderTopColor: color.divider.hairline,
  },
  pressed: {
    backgroundColor: state.pressed.row,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: space[2],
  },
});
