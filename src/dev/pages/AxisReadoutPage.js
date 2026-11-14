import { StyleSheet, View } from 'react-native';
import AxisReadout from '../../components/base/AxisReadout';
import { TASTE_AXES } from '../../constants/tasteAxes';
import { color, shape, spacing } from '../../theme/tokens';
import { HarnessCase, HarnessGroup, HarnessPage } from '../harness';

/**
 * AxisReadout (31b / 31d) in every state, on a raised card as it is shown.
 * Check value 1 against Not noted first: a tick flush left on an empty track
 * against words with no tick, in colour and in greyscale.
 */
const [A, B, C, D, E] = TASTE_AXES;

function Card({ children }) {
  return <View style={styles.card}>{children}</View>;
}

export default function AxisReadoutPage() {
  return (
    <HarnessPage>
      <HarnessGroup title="value 1 beside Not noted (computed)">
        <HarnessCase label="1 — the marker flush left is the reading · Not noted yet — no marker">
          <Card>
            <AxisReadout axis={B.id} value={1} />
            <AxisReadout axis={E.id} value={null} />
          </Card>
        </HarnessCase>
      </HarnessGroup>
      <HarnessGroup title="computed (Home, 5c, 8f): marker text.muted">
        <HarnessCase label="every axis: 1 · 2.5 · 3.5 · 5 · not noted">
          <Card>
            {TASTE_AXES.map((axis, i) => (
              <AxisReadout key={axis.id} axis={axis.id} value={[1, 2.5, 3.5, 5, null][i % 5]} />
            ))}
          </Card>
        </HarnessCase>
      </HarnessGroup>
      <HarnessGroup title="entered (2c, 11a): marker border.accent">
        <HarnessCase label="3.5 · 5 · 1 · Not noted">
          <Card>
            <AxisReadout axis={A.id} tone="entered" value={3.5} />
            <AxisReadout axis={C.id} tone="entered" value={5} />
            <AxisReadout axis={B.id} tone="entered" value={1} />
            <AxisReadout axis={D.id} tone="entered" value={null} />
          </Card>
        </HarnessCase>
      </HarnessGroup>
      <HarnessGroup title="8f: the 56 step-word column">
        <HarnessCase label="3.8 Bold · 2.3 Light · 2.9 Medium · 1.2 Faint · not noted">
          <Card>
            {TASTE_AXES.map((axis, i) => (
              <AxisReadout key={axis.id} axis={axis.id} step value={[3.8, 2.3, 2.9, 1.2, null][i % 5]} />
            ))}
          </Card>
        </HarnessCase>
      </HarnessGroup>
      <HarnessGroup title="5c: before (border.muted) under after">
        <HarnessCase label="3.4 → 3.1 (down) · 2 → 2.3 (up)">
          <Card>
            <AxisReadout axis={A.id} previous={3.4} value={3.1} />
            <AxisReadout axis={D.id} previous={2} value={2.3} />
          </Card>
        </HarnessCase>
      </HarnessGroup>
    </HarnessPage>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: shape.borderWidth.box,
    borderColor: color.border.container,
    backgroundColor: color.surface.raised,
    paddingVertical: spacing.inset.container.v,
    paddingHorizontal: spacing.inset.container.h,
    gap: spacing.gap.section,
  },
});
