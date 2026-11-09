import { StyleSheet, View } from 'react-native';
import { startOfDay } from '../constants/dates';
import { color, icon, shape, size, space, spacing, textStyle } from '../theme/tokens';
import Glyph from './base/Glyph';
import Text from './base/Text';

/**
 * 1b's top block (Design Round 21, 23b / 23c; a panel since Round 22 §5,
 * 2026-11-07): "Cups total" over the numeral, beside a column of three
 * stats, then the month strip under both, all in one panel: surface.raised,
 * a 2px border.muted frame (Round 22's quiet frame), inset.container.
 *
 * Row, centre-aligned, space.20 apart:
 *   left   "Cups total" space.12 above the numeral (D-34; §4: serif ink sets
 *          its own space), numeralLg (64 / 52) in accent
 *   right  the stat column (size.statColumn; from a four-digit total it
 *          hugs its content — Design Round 21 build questions, 5; at 64 a
 *          four-digit total fits beside it, Round 22 §5), rows space.6
 *          apart, no rule under them: [icon.sm] space.6 [label] ……… [value].
 *          Label labelEyebrow muted, value numeralInline ink, through
 *          Intl.NumberFormat.
 *            This month  cups since the 1st (local), all three modes
 *            Bags        every bag I've added, and deleted ones my cups
 *                        still name (countBags; Uryu, 2026-11-06)
 *            Cafés       distinct cafés my cups point at (countCupCafes);
 *                        0 shows as 0
 *          No week streak (Design: a streak counts what you missed).
 *          Counts of records: Taste DNA's reset doesn't touch them.
 * Month strip, space.14 under the row, full width: one equal cell per day
 * of this month, a size.dot.bullet square centred in it and, gap.tight
 * under it, today's ink underline (the square + 2 wide, borderWidth.box
 * tall; the other days keep its room empty). Square: a day with a cup
 * text.accent; a past day or today without one border.muted; days to come
 * border.subtle. No label. Local calendar days, as the old weekday strip.
 * The screen reader hears the strip as one element, "6 days with a cup this
 * month, out of 8 so far." (build questions, 9), never a list of days.
 *
 * Gone with Round 21: the This week panel (its count and Mon–Sun strip) and
 * "A slow start is still a start." (already dropped for V1, Round 10 C10).
 * Gone with Round 22 §5: the 96 hero numeral, the bottom-aligned row and the
 * hairline under each stat (built 2026-11-06 from Round 21 §3, which went out
 * without §5).
 *
 * Props: total, monthCupTimes (logged_at of this month's cups), bags, cafes,
 * now
 */
/*
 * The serif numerals' authored boxes (§3: Instrument Serif ascent 990,
 * descent 310 per 1000). On iOS they render on the natural box, 1.3 em
 * (§3.2); CSS centres the glyphs in the shorter line box, taking half the
 * difference off each side. This takes the same off, so the total's box is
 * the mock's 52 ("Cups total" space.12 above it, D-34) and each stat row the
 * mock's 22; on iOS's 28.6 rows the panel stood 20 taller than 23b and the
 * Taste DNA card missed 369 (Round 22 §5). From the measured metrics, not tokens.
 */
const trimToLineHeight = ({ fontSize, lineHeight }) => -(((990 + 310) / 1000) * fontSize - lineHeight) / 2;

/** Local midnight of the 1st of this month: the month strip and This month. */
export function monthStart(now) {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

const countFormat = new Intl.NumberFormat();
/** Today's underline: the square and one more each side (Design Round 21: "square + 2"). */
const UNDERLINE_W = size.dot.bullet + 2;

function Stat({ glyph, label, value }) {
  const shown = countFormat.format(value);
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}, ${shown}`}>
      <View style={styles.statLabel}>
        <Glyph name={glyph} token={icon.sm} color={color.icon.muted} />
        <Text variant="labelEyebrow" color="muted">
          {label}
        </Text>
      </View>
      <Text variant="numeralInline" color="primary" style={styles.value}>
        {shown}
      </Text>
    </View>
  );
}

export default function HomeStats({ total, monthCupTimes, bags, cafes, now }) {
  const start = new Date(monthStart(now));
  const today = startOfDay(new Date(now));
  const cupDays = new Set(monthCupTimes.map((t) => startOfDay(new Date(t))));
  const length = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const days = Array.from({ length }, (_, i) => {
    const ms = new Date(start.getFullYear(), start.getMonth(), i + 1).getTime(); // calendar days, safe across DST
    return { ms, cup: cupDays.has(ms), today: ms === today, future: ms > today };
  });
  const logged = days.filter((d) => d.cup).length;
  const soFar = days.filter((d) => !d.future).length;
  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <View>
          <Text variant="labelEyebrow" color="primary" style={styles.totalLabel}>
            Cups total
          </Text>
          <Text variant="numeralLg" color="accent" style={styles.numeral}>
            {String(total)}
          </Text>
        </View>
        {/* TODO: Design Round 21 build questions, 5 — if hugging isn't enough,
            the gap drops to space.12, then the stats go under the numeral as
            one row. Not drawn yet (Design draws it near 1,000 cups). */}
        <View style={[styles.stats, total < 1000 && styles.statsFixed]}>
          <Stat glyph="calendar" label="This month" value={monthCupTimes.length} />
          <Stat glyph="beanBag" label="Bags" value={bags} />
          <Stat glyph="store" label="Cafés" value={cafes} />
        </View>
      </View>
      <View
        style={styles.strip}
        accessible
        accessibilityLabel={`${logged} ${logged === 1 ? 'day' : 'days'} with a cup this month, out of ${soFar} so far.`}>
        {days.map((d) => (
          <View key={d.ms} style={styles.day}>
            <View style={[styles.square, { backgroundColor: d.cup ? color.text.accent : d.future ? color.border.subtle : color.border.muted }]} />
            <View style={[styles.underline, d.today && styles.underlineToday]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Round 22 §5: space.4 under the header's foot. ScreenFrame's body already
  // starts inset.container.v below it.
  block: {
    marginTop: space[4] - spacing.inset.container.v,
    gap: space[14],
    paddingVertical: spacing.inset.container.v,
    paddingHorizontal: spacing.inset.container.h,
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.muted,
    backgroundColor: color.surface.raised,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[20],
  },
  numeral: {
    marginVertical: trimToLineHeight(textStyle.numeralLg),
  },
  value: {
    marginVertical: trimToLineHeight(textStyle.numeralInline),
  },
  totalLabel: {
    // §4: the numeral's ink fills its box, so the space is set here (D-34).
    marginBottom: space[12],
  },
  stats: {
    gap: space[6],
  },
  statsFixed: {
    width: size.statColumn,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.gap.row,
  },
  statLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[6],
  },
  strip: {
    flexDirection: 'row',
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.gap.tight,
  },
  square: {
    width: size.dot.bullet,
    height: size.dot.bullet,
  },
  underline: {
    width: UNDERLINE_W,
    height: shape.borderWidth.box,
  },
  underlineToday: {
    backgroundColor: color.border.strong,
  },
});
