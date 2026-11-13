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
      <AxisReadout axis={axis.id} {...p} />
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
      <HarnessGroup title="the axis colours, one per registered axis (computed)">
        <HarnessCase label="2 · 3.5 · 1.5 · 4 · 5 (interim frame until commit 2)">
          {TASTE_AXES.map((axis, i) => (
            <Row key={axis.id} axis={axis} value={[2, 3.5, 1.5, 4, 5][i % 5]} />
          ))}
        </HarnessCase>
      </HarnessGroup>
      <HarnessGroup title="computed (1b / 4a / 4b / 8f): marker text.muted">
        <HarnessCase label="1 · 3.5 · 5 · null">
          <Row value={1} />
          <Row value={3.5} />
          <Row value={5} />
          <Row value={null} label="Not noted" />
        </HarnessCase>
      </HarnessGroup>
      <HarnessGroup title="entered (2c, 11a: this cup's own values): marker border.accent">
        <HarnessCase label="1 · 3.5 · 5 · null">
          <Row tone="entered" value={1} />
          <Row tone="entered" value={3.5} />
          <Row tone="entered" value={5} />
          <Row tone="entered" value={null} label="Not noted" />
        </HarnessCase>
      </HarnessGroup>
      <HarnessGroup title="5c per §9: both computed (profile before → after)">
        <HarnessCase label="3.4 → 3.1 (down) · 2 → 2.3 (up)">
          <Row previous={3.4} value={3.1} />
          <Row previous={2} value={2.3} />
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
