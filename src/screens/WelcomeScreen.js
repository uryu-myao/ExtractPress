import { StyleSheet, View } from 'react-native';
import Button from '../components/base/Button';
import Glyph from '../components/base/Glyph';
import Text from '../components/base/Text';
import TextLink from '../components/base/TextLink';
import RestoreRow from '../components/RestoreRow';
import WelcomePlate from '../components/WelcomePlate';
import { color, icon, shape, space, spacing } from '../theme/tokens';
import ScreenFrame from './ScreenFrame';

/**
 * 8a — Welcome, the first launch's first screen (Design Round 30, 36a / 36e;
 * built 2026-11-21). It says what the app is, not what it has: "five
 * sliders", "ten notes", "15 seconds" are the welcome notice's (36b,
 * constants/notices.js). That nothing is sent to us is here, because it
 * decides whether to use the app at all.
 *
 * Top to bottom (36a):
 *   EXTRACT PRESS     eyebrow, and on its row, at the right end:
 *   Skip setup        (36e) what you take instead of the screen, where every
 *                     setup step keeps it. Home, setup done for good. The
 *                     header holds only this row: no title, so it doesn't
 *                     collapse
 *   the plate         WelcomePlate: the visual, 196 tall. A provisional
 *                     drawing until Uryu's artwork (TODO there)
 *   headline          "You log a cup." in ink, then on its own line "Extract
 *                     Press works out what you like." in brown, the same
 *                     serif; the screen's header for accessibility
 *   the line          rate AND note: a rating alone doesn't move the profile
 *   the privacy frame 1.5 border.muted on surface.raised, a phone glyph in
 *                     ink centred on the text, the bold lead "It stays on
 *                     your phone." and, on the next line, 29e's line:
 *                     backups and exports do leave the phone, never to us
 *   Set up my shelf   primary, at the foot: the bag step, then gear
 *   New phone? Restore a backup
 *                     a hairline row space[20] under the primary (34b's row,
 *                     RestoreRow), only while the app is empty: Restore
 *                     works only then, and the bag and gear steps end it
 *                     (Round 23 C3, Round 30 A2)
 *
 * Ours: the headline is display.lg (40 / 41), not 36a's 40 / 42, and the
 * glyph icon.md (18), not 20: neither is a token.
 */
export default function WelcomeScreen({ onSetUp, onSkip, restore }) {
  return (
    <ScreenFrame
      scroll
      leadingEnd={<TextLink label="Skip setup" onPress={onSkip} />}
      eyebrow="Extract Press"
      footer={
        <View>
          <Button label="Set up my shelf" onPress={onSetUp} />
          {restore ? (
            <View style={styles.restore}>
              <RestoreRow />
            </View>
          ) : null}
        </View>
      }>
      <View style={styles.body}>
        <WelcomePlate />
        <Text variant="displayLg" color="primary" accessibilityRole="header">
          You log a cup.{'\n'}
          <Text variant="displayLg" color="accent">
            Extract Press works out what you like.
          </Text>
        </Text>
        <Text variant="body" color="secondary">
          Not a diary: the cups you rate and note add up to a profile of your taste.
        </Text>
        <View style={styles.privacy}>
          <Glyph name="phone" token={icon.md} color={color.text.primary} />
          <Text variant="body" color="secondary" style={styles.privacyText}>
            <Text variant="noticeName" color="primary">
              It stays on your phone.
            </Text>
            {'\nNo account, no server. Your cups are never sent to us.'}
          </Text>
        </View>
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.gap.section,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    paddingVertical: spacing.inset.container.v,
    paddingHorizontal: spacing.inset.container.h,
    borderWidth: shape.borderWidth.weak,
    borderColor: color.border.muted,
    backgroundColor: color.surface.raised,
  },
  privacyText: {
    flex: 1,
  },
  restore: {
    marginTop: space[20],
  },
});
