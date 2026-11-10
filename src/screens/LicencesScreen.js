import { StyleSheet, View } from 'react-native';
import DashedRule from '../components/base/DashedRule';
import IconButton from '../components/base/IconButton';
import Text from '../components/base/Text';
import LICENCES from '../constants/licences.json';
import { dashed, space, spacing } from '../theme/tokens';
import ScreenFrame from './ScreenFrame';

/**
 * 6c's Licences, pushed over the tabs and the bar (ShellStack 'licences',
 * 2026-11-09). 6c draws the row only; the page is ours, in the pushed
 * screens' shape (compact header, Back, title in titleCaps as 8f / 8g's,
 * body), to be shown to Design after the fact (Round 25).
 *
 *   opening   one line, body, secondary.
 *   entries   each package as shipped: its name (label), "version · licence"
 *             (meta, muted), then its licence text in full (bodySm,
 *             secondary): MIT and the others ask for the copyright notice to
 *             be kept, so a name alone is not enough. Split by dashed
 *             dividerSoft, as 8g's rules.
 *
 * The list is constants/licences.json, written by `npm run gen:licences`
 * from the production bundle and scripts/licences/native.json. Re-run it
 * after a dependency changes.
 */
export default function LicencesScreen({ onBack }) {
  return (
    <ScreenFrame scroll compact title="Licences" leading={<IconButton icon="chevronLeft" accessibilityLabel="Back" onPress={onBack} />}>
      <View style={styles.body}>
        <Text variant="body" color="secondary">
          Extract Press is built on these open-source projects. Each keeps its own licence, given here in full.
        </Text>
        {LICENCES.map((e, i) => (
          <View key={`${e.name}@${e.version}`} style={styles.entry}>
            {i > 0 ? <DashedRule token={dashed.dividerSoft} /> : null}
            <View style={styles.head}>
              <Text variant="label" color="primary">
                {e.name}
              </Text>
              <Text variant="meta" color="muted">
                {[e.version, e.licence].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Text variant="bodySm" color="secondary">
              {e.text}
            </Text>
          </View>
        ))}
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: space[20],
    paddingBottom: space[20],
  },
  entry: {
    gap: spacing.gap.row,
  },
  head: {
    gap: spacing.gap.tight,
  },
});
