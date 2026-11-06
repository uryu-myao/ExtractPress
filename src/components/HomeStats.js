import { StyleSheet, View } from 'react-native';
import { startOfDay } from '../constants/dates';
import { color, icon, shape, size, space, spacing, textStyle } from '../theme/tokens';
import Glyph from './base/Glyph';
import Text from './base/Text';

/**
 * 1b's top block (Design Round 21, 23b / 23c): "Cups total" over the hero
 * numeral, beside a column of three stats, then the month strip under both.
 *
 * Row, bottom-aligned, space.20 apart:
 *   left   "Cups total" space.12 above the numeral (D-34; §4: serif ink sets
 *          its own space), numeralHero in accent
 *   right  the stat column (size.statColumn; from a four-digit total it
 *          hugs its content, so the numeral never shrinks or wraps —
 *          Design Round 21 build questions, 5), rows space.8 apart: [icon.sm]
 *          space.6 [label] ……… [value], a hairline (divider, hairlineStrong)
 *          space.6 under each. Label labelEyebrow muted, value
 *          numeralInline ink, through Intl.NumberFormat.
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
 *
 * Props: total, monthCupTimes (logged_at of this month's cups), bags, cafes,
 * now
 */
/*
 * The hero numeral's ink, not its box (§3, measured: Instrument Serif ascent
 * 990, descent 310 per 1000; digit ink −10 … 745). On iOS the numeral renders
 * on its natural box (§3.2), so (990 − 745) / 1000 em of space sits above the
 * digits and 310 / 1000 em below. These pull the box in to the ink, so
 * "Cups total" sits space.12 above the digits (D-34) and the digits' foot
 * meets the stat column's last hairline. Formulas from the measured metrics, not tokens.
 */
const HERO = textStyle.numeralHero.fontSize;
const HERO_ABOVE_INK = ((990 - 745) / 1000) * HERO;
const HERO_BELOW_INK = (310 / 1000) * HERO;

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
      <Text variant="numeralInline" color="primary">
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
          <Text variant="numeralHero" color="accent" style={styles.hero}>
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
  block: {
    gap: space[14],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space[20],
  },
  hero: {
    marginTop: -HERO_ABOVE_INK,
    marginBottom: -HERO_BELOW_INK,
  },
  totalLabel: {
    // §4: the hero numeral's ink fills its box, so the space is set here (D-34).
    marginBottom: space[12],
  },
  stats: {
    gap: space[8],
  },
  statsFixed: {
    width: size.statColumn,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.gap.row,
    paddingBottom: space[6],
    borderBottomWidth: shape.borderWidth.divider,
    borderBottomColor: color.divider.hairlineStrong,
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
