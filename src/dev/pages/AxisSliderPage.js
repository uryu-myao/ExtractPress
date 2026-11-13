import { useState } from 'react';
import AxisSlider from '../../components/base/AxisSlider';
import { STEP_WORDS, TASTE_AXES } from '../../constants/tasteAxes';
import { HarnessCase, HarnessGroup, HarnessPage } from '../harness';

/**
 * AxisSlider states (interim until Turn 29's commit 3: five whole stops on
 * 1–5, one track; the square handle carries the state).
 */
const [FIRST, SECOND] = TASTE_AXES;

export default function AxisSliderPage() {
  const [empty, setEmpty] = useState(null);
  const [entered, setEntered] = useState(2);

  return (
    <HarnessPage>
      <HarnessGroup title="operable (drag, tap, Clear)">
        <HarnessCase label="empty — muted square resting at 1 (a placeholder, never a value)">
          <AxisSlider axis={FIRST.id} label={FIRST.label} steps={STEP_WORDS} value={empty} onChange={setEmpty} />
        </HarnessCase>
        <HarnessCase label="entered — accent square, Clear; touch scales it">
          <AxisSlider axis={SECOND.id} label={SECOND.label} steps={STEP_WORDS} value={entered} onChange={setEntered} />
        </HarnessCase>
      </HarnessGroup>
    </HarnessPage>
  );
}
