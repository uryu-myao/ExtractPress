import { StyleSheet, View } from 'react-native';
import AxisReadout, { AxisPoles } from '../../components/base/AxisReadout';
import Text from '../../components/base/Text';
import { TASTE_AXES } from '../../constants/tasteAxes';
import { spacing } from '../../theme/tokens';
import { HarnessCase, HarnessGroup, HarnessPage } from '../harness';

/**
 * AxisReadout tones and 5c's ghost, side by side (decision aid, 2026-10-11).
 * Since Design Round 21 the fill is the axis's colour and the tone sets the
 * marker only.
 */
function Row({ label, axis = TASTE_AXES[0], ...p }) {
  return (
    <View style={styles.row}>
      <AxisPoles axis={axis} />
      <AxisReadout axis={axis.key} {...p} />
      {label ? (
        <Text variant="meta" color="muted">
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export default function AxisReadoutPage() {
  return (
    <HarnessPage>
      <HarnessGroup title="the four axis colours (computed)">
        <HarnessCase label="26 · 62 · 30 · 70">
          <Row axis={TASTE_AXES[0]} value={26} />
          <Row axis={TASTE_AXES[1]} value={62} />
          <Row axis={TASTE_AXES[2]} value={30} />
          <Row axis={TASTE_AXES[3]} value={70} />
        </HarnessCase>
      </HarnessGroup>
      <HarnessGroup title="computed (1b / 4a / 4b / 8f): marker text.muted">
        <HarnessCase label="26 · 62 · 50 · null">
          <Row value={26} />
          <Row value={62} />
          <Row value={50} />
          <Row value={null} label="Not noted" />
        </HarnessCase>
      </HarnessGroup>
      <HarnessGroup title="entered (2c, 11a: this cup's own values): marker border.accent">
        <HarnessCase label="26 · 62 · 50 · null">
          <Row tone="entered" value={26} />
          <Row tone="entered" value={62} />
          <Row tone="entered" value={50} />
          <Row tone="entered" value={null} label="Not noted" />
        </HarnessCase>
      </HarnessGroup>
      <HarnessGroup title="5c per §9: both computed (profile before → after)">
        <HarnessCase label="44 → 38 (away from 50) · 30 → 36 (toward 50)">
          <Row previous={44} value={38} />
          <Row previous={30} value={36} />
        </HarnessCase>
      </HarnessGroup>
    </HarnessPage>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.gap.row,
    marginBottom: spacing.gap.section,
  },
});
