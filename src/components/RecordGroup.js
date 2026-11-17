import { useContext, useMemo, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { archiveLines } from '../constants/cups';
import { dayKey } from '../constants/records';
import { ContentScrollContext } from '../screens/ScreenFrame';
import { color, component, layout, shape, space, spacing } from '../theme/tokens';
import ArchiveRow from './base/ArchiveRow';
import { AlignedGrainTexture } from './base/GrainTexture';
import Text from './base/Text';

const archive = component.archive;

/**
 * One group of the archive (2a; moved out of RecordsScreen for search's
 * Kind / Rating results, Design Round 15, 18e, which keep its shape).
 * Redrawn by handoff-records (2026-11-16, 34a / 34d / 34e / 34f):
 *   heading  the group's name (labelEyebrow, accent) and its count
 *            ("· 9 cups", labelEyebrow, muted), nothing else: the sort's name
 *            moved to 2a's state strip. The line under it. Group by None
 *            has no heading.
 *   Month    the day gutter (§2): 40 wide, written once per day, the day
 *            number (dayNumeral) over the weekday (TODAY in accent), 8
 *            above the number; space.12, then the day's rows, which show
 *            their time. Days are space.6 apart, a line above each but the
 *            first, and space.6 under every line (the heading's too), so a
 *            pressed row's fill stands as clear of the line above it as of
 *            the line below (Uryu, 2026-11-17, on device: it touched the
 *            line above). The gutter isn't pressable.
 *   others   rows on the gutter, showing their date; space.6 under the
 *            heading's line, as under a day's.
 *   Group by Roaster: the roaster leaves line 2 (archiveLines).
 * Every line here (the heading's, the days') is THE DIVIDER, 1 in
 * divider.hairline (Uryu, 2026-11-15). TODO(design): §0 draws the heading's
 * at 1.5 border.soft and the days' at 1.5 border.subtle.
 *
 * Pinned headings (Uryu, 2026-10-24): inside a ScreenFrame scroll page, a
 * heading stays under the header (`top` below the page's foot) until the
 * next one pushes it up; scrolling back, it returns with the content. Built
 * on ScreenFrame's ContentScrollContext (RN's stickyHeaderIndices pins one
 * block at a time, and only a direct child of the ScrollView). A pinned
 * heading hides the rows passing under it: surface.ground edge to edge, with
 * the page's grain drawn in it, lined up with the page's (AlignedGrainTexture),
 * so it still reads as the page. The line between a heading and its first
 * row belongs to the heading, so it stays while the heading is pinned.
 * Outside a ScreenFrame page (search) nothing pins.
 *
 * Props: group ({ key, label, cups, days? }, constants/records arrangeCups),
 * grouping ('month' | 'method' | 'roaster' | 'none'), first (the list's
 * first group: no room above it), top (where headings pin; 0 under the
 * header), listY (the list's y in the page), onOpen(id)
 */
export function pinFrom(scroll, from, travel) {
  if (!scroll || from == null) return null;
  scroll = scroll.under;
  if (travel == null) {
    // No end: once reached, it stays.
    return scroll.interpolate({ inputRange: [from, from + 1], outputRange: [0, 1], extrapolateLeft: 'clamp' });
  }
  if (!(travel > 0)) return null;
  return scroll.interpolate({ inputRange: [from, from + travel], outputRange: [0, travel], extrapolate: 'clamp' });
}

/**
 * A pinned block's top on screen, for its grain: the page's top + its y in
 * the page + how far it has pinned.
 */
function usePinnedTop(scroll, pageY, pin) {
  return useMemo(() => {
    if (!scroll || pageY == null) return null;
    const base = Animated.add(scroll.pageTop, pageY);
    return pin ? Animated.add(base, pin) : base;
  }, [scroll, pageY, pin]);
}

const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const countFormat = new Intl.NumberFormat();

// TODO(i18n): plural rules beyond English's one / other.
const cupsLabel = (n) => `· ${countFormat.format(n)} ${n === 1 ? 'cup' : 'cups'}`;

/** A day's gutter: the day number over the weekday, or TODAY. */
function DayGutter({ time, today }) {
  const d = new Date(time);
  return (
    <View style={styles.gutter} accessible accessibilityLabel={today ? 'Today' : `${weekdayFormat.format(d)} ${d.getDate()}`}>
      <Text variant="dayNumeral">{String(d.getDate())}</Text>
      <Text variant="labelEyebrow" color={today ? 'accent' : 'muted'}>
        {today ? 'Today' : weekdayFormat.format(d)}
      </Text>
    </View>
  );
}

export default function RecordGroup({ group, grouping, first = false, top = 0, listY = 0, onOpen }) {
  const scroll = useContext(ContentScrollContext);
  const [box, setBox] = useState(null); // { y, h, head }
  const measure = (key) => (e) => {
    const v = key === 'head' ? e.nativeEvent.layout.height : e.nativeEvent.layout;
    setBox((prev) => {
      const next = { ...prev, ...(key === 'head' ? { head: v } : { y: v.y, h: v.height }) };
      return prev && prev.y === next.y && prev.h === next.h && prev.head === next.head ? prev : next;
    });
  };
  const headed = group.label != null;
  const pins = scroll && headed;
  const ready = pins && box && box.head != null && box.y != null && listY != null && top != null;
  const from = ready ? listY + box.y - top : null;
  const travel = ready ? box.h - box.head : null;
  const pin = useMemo(() => (from == null ? null : pinFrom(scroll, from, travel)), [scroll, from, travel]);
  const screenTop = usePinnedTop(scroll, ready ? listY + box.y : null, pin);
  const today = dayKey(Date.now());
  const row = (cup, when, gutter) => (
    <ArchiveRow key={cup.id} cup={cup} lines={archiveLines(cup, grouping)} when={when} gutter={gutter} onPress={() => onOpen(cup.id)} />
  );
  return (
    <View onLayout={pins ? measure('group') : undefined} style={!first && headed && styles.apart}>
      {headed ? (
        <Animated.View
          onLayout={pins ? measure('head') : undefined}
          style={[styles.head, scroll && styles.pinned, pin && { transform: [{ translateY: pin }] }]}>
          {screenTop ? <AlignedGrainTexture y={screenTop} /> : null}
          <View style={[styles.heading, styles.headLine]}>
            <Text variant="labelEyebrow" color="accent" style={styles.groupLabel} numberOfLines={1}>
              {group.label}
            </Text>
            <Text variant="labelEyebrow" color="muted">
              {cupsLabel(group.cups.length)}
            </Text>
          </View>
        </Animated.View>
      ) : null}
      {group.days
        ? group.days.map((day, i) => (
            <View key={day.key} style={[styles.day, i > 0 && styles.dayApart]}>
              <DayGutter time={day.time} today={day.key === today} />
              <View style={styles.dayRows}>{day.cups.map((cup) => row(cup, timeFormat.format(new Date(cup.logged_at)), true))}</View>
            </View>
          ))
        : <View style={headed && styles.underLine}>{group.cups.map((cup) => row(cup, dateFormat.format(new Date(cup.logged_at)), false))}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  // A pinned block: opaque from the screen's left edge to its right (it
  // starts at the page's left edge, as AlignedGrainTexture needs), clipping
  // the texture's overhang.
  pinned: {
    marginHorizontal: -layout.gutter,
    paddingHorizontal: layout.gutter,
    backgroundColor: color.surface.ground,
    overflow: 'hidden',
  },
  head: {
    zIndex: 1,
  },
  // Room between one group's last row and the next heading.
  // TODO(design): not given in §1; 2a's 16 from the search row to the list.
  apart: {
    marginTop: space[16],
  },
  // The heading carries the line under it, at the content's width, so a
  // pinned heading keeps it.
  headLine: {
    borderBottomWidth: shape.borderWidth.divider,
    borderBottomColor: color.divider.hairline,
  },
  groupLabel: {
    flexShrink: 1,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap.tight,
    paddingBottom: spacing.gap.row,
  },
  day: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: archive.gutter.dayGap,
  },
  underLine: {
    paddingTop: archive.gutter.dayGap,
  },
  dayApart: {
    marginTop: archive.gutter.dayGap,
    borderTopWidth: shape.borderWidth.divider,
    borderTopColor: color.divider.hairline,
  },
  // The number stays 8 under the line: the day's own space.6, then the rest.
  gutter: {
    width: archive.gutter.width,
    paddingTop: archive.gutter.top - archive.gutter.dayGap,
  },
  dayRows: {
    flex: 1,
    minWidth: 0,
  },
});
