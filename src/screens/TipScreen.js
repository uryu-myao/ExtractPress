import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import DashedRule from '../components/base/DashedRule';
import Glyph from '../components/base/Glyph';
import IconButton from '../components/base/IconButton';
import Text from '../components/base/Text';
import TextLink from '../components/base/TextLink';
import { TIPS } from '../constants/tips';
import { useTips } from '../data/tips';
import { color, component, dashed, icon, layout, motion, shape, space, spacing, state } from '../theme/tokens';
import ScreenFrame from './ScreenFrame';

/**
 * 6c's Buy me a coffee (28e / 28g; Design Round 26 B6, Round 28 A2 / B1),
 * pushed over the tabs and the bar (ShellStack 'tips').
 *
 *   header      compact, Back and the title in titleCaps, as every pushed
 *               page (Licences, 8f, 8g, 7a). 28e draws the title in
 *               Instrument Serif beside Back; the app's pushed pages all
 *               take the compact header (drift).
 *   picture     the mug, 48 in text.accent, in a 96 raised tile with the
 *               quiet frame. Not pressable.
 *   line        "Extract Press has no ads and no account. A tip keeps it
 *               that way." After a tip goes through it becomes the
 *               thank-you, "Thank you. That's ‹a pour-over› on you. It goes
 *               into the next update.", until the screen is left.
 *   tips        A drip coffee and A pour-over, then Support more opens A bag
 *               of beans in place (motion.expand), with Show less under it.
 *               The screen remembers neither. Each row is one control; a tap
 *               opens Apple's payment sheet at once, no confirm of ours. The
 *               price is StoreKit's string; until it is known the row shows
 *               no tag and doesn't press. The row just paid for turns ink
 *               with a check until the screen is left; it can be tipped
 *               again.
 *   status      one line under the tips, below a dashed soft divider, no
 *               error colour: Failed, or Waiting for approval (Ask to Buy).
 *               A cancel on Apple's sheet shows nothing.
 *   small print at the foot. Its first sentence says what a tip gets:
 *               nothing in the app changes (Guideline 3.1.1; Round 28 B1).
 */
const expandEasing = Easing.bezier(...motion.expand.controlPoints);

// TODO(Design Round 28 B1): Design writes the words and picks the place for
// "a tip changes nothing". Until then, the brief's own sentence, in the small
// print where it is always on screen.
const NOTHING_CHANGES = 'Nothing changes in the app. The whole thing is free and stays free.';
const SMALL_PRINT = 'One-time, nothing recurring. Apple takes the payment; Extract Press never sees your card.';

const STATUS = {
  failed: "That didn't go through. Nothing was charged.",
  waiting: "Waiting for approval. It goes through once it's approved.",
  // TODO(Design): not drawn. The store couldn't be reached, or this build has
  // no store (a development build from before expo-iap); the rows then show
  // no price and don't press.
  unavailable: "The App Store can't be reached right now. Try again later.",
};

function TipRow({ tip, price, paid, disabled, onPress }) {
  const ink = paid ? component.tip.paid.ink : color.text.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !price}
      accessibilityRole="button"
      accessibilityLabel={[tip.name, price].filter(Boolean).join(', ')}
      accessibilityState={{ disabled: disabled || !price, selected: paid }}
      style={({ pressed }) => [styles.row, paid && styles.rowPaid, pressed && !paid && styles.rowPressed]}>
      <View style={[styles.tile, paid && styles.tilePaid]}>
        <Glyph name={tip.glyph} token={component.tip.glyph} color={ink} />
      </View>
      <Text variant="label" color={ink} style={styles.name}>
        {tip.name}
      </Text>
      {paid ? <Glyph name="tick" token={component.tip.paid.check} color={ink} /> : null}
      {price ? (
        <View style={[styles.tag, paid && styles.tagPaid]}>
          <Text variant="priceTag" color={ink}>
            {price}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function TipScreen({ onBack }) {
  const { available, prices, loading, busy, outcome, buy } = useTips();
  const [more, setMore] = useState(false);
  const open = useRef(new Animated.Value(0)).current;
  const [moreHeight, setMoreHeight] = useState(0);

  useEffect(() => {
    Animated.timing(open, { toValue: more ? 1 : 0, duration: motion.expand.duration, easing: expandEasing, useNativeDriver: false }).start();
  }, [more, open]);

  const paid = outcome?.kind === 'paid' ? TIPS.find((t) => t.id === outcome.id) : null;
  // Say it went through, out loud too: the thank-you replaces the line.
  useEffect(() => {
    if (paid) AccessibilityInfo.announceForAccessibility(`Thank you. That's ${paid.onYou} on you.`);
  }, [outcome, paid]);

  const unavailable = !loading && (!available || TIPS.every((t) => !prices[t.id]));
  const status = unavailable ? STATUS.unavailable : outcome && outcome.kind !== 'paid' ? STATUS[outcome.kind] : null;

  const row = (tip) => (
    <TipRow key={tip.id} tip={tip} price={prices[tip.id]} paid={paid?.id === tip.id} disabled={busy != null} onPress={() => buy(tip.id)} />
  );

  return (
    <ScreenFrame scroll compact title="Buy me a coffee" leading={<IconButton icon="chevronLeft" accessibilityLabel="Back" onPress={onBack} />}>
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.hero}>
            <Glyph name="mug" token={icon.hero} color={color.icon.accent} />
          </View>
          <Text variant="lead" color="primary" style={styles.center} accessibilityLiveRegion="polite">
            {paid
              ? `Thank you. That's ${paid.onYou} on you.\nIt goes into the next update.`
              : 'Extract Press has no ads and no account.\nA tip keeps it that way.'}
          </Text>
        </View>

        <View style={styles.tips}>
          {TIPS.filter((t) => !t.more).map(row)}
          <Animated.View
            style={[styles.moreClip, { height: open.interpolate({ inputRange: [0, 1], outputRange: [0, moreHeight] }), opacity: open }]}
            pointerEvents={more ? 'auto' : 'none'}
            accessibilityElementsHidden={!more}
            importantForAccessibility={more ? 'auto' : 'no-hide-descendants'}>
            <View style={styles.moreInner} onLayout={(e) => setMoreHeight(e.nativeEvent.layout.height)}>
              {TIPS.filter((t) => t.more).map(row)}
            </View>
          </Animated.View>
          <TextLink centered label={more ? 'Show less' : 'Support more'} glyph={more ? 'chevronUp' : 'chevronDown'} onPress={() => setMore((m) => !m)} />
        </View>

        {status ? (
          <View style={styles.status}>
            <DashedRule token={dashed.dividerSoft} />
            <Text variant="sheetNote" color="secondary" accessibilityLiveRegion="polite">
              {status}
            </Text>
          </View>
        ) : null}

        <Text variant="bodySm" color="muted" style={[styles.center, styles.smallPrint]}>
          {`${NOTHING_CHANGES}\n${SMALL_PRINT}`}
        </Text>
      </View>
    </ScreenFrame>
  );
}

const tip = component.tip;

const styles = StyleSheet.create({
  body: {
    flexGrow: 1,
    // The small print ends clear of the home indicator: layout.screen.bottom
    // is measured from the screen's edge, as a footer's.
    paddingBottom: layout.screen.bottom,
  },
  top: {
    alignItems: 'center',
    gap: space[16],
    paddingTop: space[20],
    paddingBottom: space[28],
    paddingHorizontal: space[8],
  },
  hero: {
    width: tip.hero.tile,
    height: tip.hero.tile,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.container,
    backgroundColor: color.surface.raised,
  },
  center: {
    textAlign: 'center',
  },
  tips: {
    gap: spacing.gap.section,
  },
  row: {
    height: tip.row.height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tip.row.gap,
    paddingHorizontal: tip.row.inset,
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.strong,
    backgroundColor: color.surface.ground,
  },
  rowPressed: {
    backgroundColor: state.pressed.surface,
  },
  rowPaid: {
    backgroundColor: tip.paid.background,
  },
  tile: {
    width: tip.tile.size,
    height: tip.tile.size,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: tip.tile.border,
    borderColor: tip.tile.borderColor,
    backgroundColor: tip.tile.background,
  },
  tilePaid: {
    borderColor: tip.paid.tileBorder,
    backgroundColor: tip.paid.background,
  },
  name: {
    flex: 1,
  },
  tag: {
    paddingVertical: tip.tag.v,
    paddingHorizontal: tip.tag.h,
    backgroundColor: tip.tag.background,
  },
  tagPaid: {
    backgroundColor: tip.paid.tag,
  },
  // The third row's clip: the gap above it travels with it, so closed it
  // takes no room at all.
  moreClip: {
    overflow: 'hidden',
    marginTop: -spacing.gap.section,
  },
  moreInner: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingTop: spacing.gap.section,
  },
  status: {
    gap: space[12],
    marginTop: space[8],
  },
  smallPrint: {
    marginTop: 'auto',
    paddingTop: space[28],
  },
});
