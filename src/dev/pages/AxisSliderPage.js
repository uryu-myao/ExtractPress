import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AxisSlider, { AxisScaleKey } from '../../components/base/AxisSlider';
import { TASTE_AXES } from '../../constants/tasteAxes';
import { color, shape, space, spacing } from '../../theme/tokens';
import { HarnessCase, HarnessGroup, HarnessPage } from '../harness';

/**
 * AxisSlider (30a–30d) in every state, on a raised card as 5b shows it.
 * Live: drag, tap (a tap on the waiting handle confirms 1), ✕.
 */
function Rows({ initial }) {
  const [values, setValues] = useState(initial);
  return (
    <View style={styles.card}>
      <View style={styles.rows}>
        {TASTE_AXES.map((a) => (
          <AxisSlider key={a.id} axis={a.id} value={values[a.id] ?? null} onChange={(v) => setValues((p) => ({ ...p, [a.id]: v }))} />
        ))}
      </View>
      <AxisScaleKey style={styles.key} />
    </View>
  );
}

export default function AxisSliderPage() {
  return (
    <HarnessPage>
      <HarnessGroup title="30a: none noted (every handle waits at 1, grey)">
        <HarnessCase label="Not noted × 5">
          <Rows initial={{}} />
        </HarnessCase>
      </HarnessGroup>
      <HarnessGroup title="30b: a realistic mix">
        <HarnessCase label="3.5 · 1 · not noted · 2.5 · not noted">
          <Rows initial={{ acidity: 3.5, bitterness: 1, sweetness: 2.5 }} />
        </HarnessCase>
      </HarnessGroup>
      <HarnessGroup title="30c: all five set">
        <HarnessCase label="4 · 2 · 3 · 3.5 · 5">
          <Rows initial={{ acidity: 4, bitterness: 2, body: 3, sweetness: 3.5, aftertaste: 5 }} />
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
  },
  rows: {
    gap: spacing.gap.row,
  },
  key: {
    marginTop: space[2],
  },
});
