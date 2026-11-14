import { ROAST_LEVELS } from '../constants/cups';
import { color, icon } from '../theme/tokens';
import Glyph from './base/Glyph';
import OptionSlider from './base/OptionSlider';

/**
 * A bag's roast level, set in place (Turn 31, 32a–32d): OptionSlider over
 * the four levels, light → dark, with the flame pair under the track's ends
 * (the light flame at the left, the dark at the right; icon.legend in
 * text.muted, no words: the word column names the level). The ONE control
 * for roast: 19a's "About the coffee" (its first row) and 3c's form under
 * Roaster (it replaces 3c / 3g's four chips, D-73).
 *
 * A fact printed on the bag, never a taste axis and never in Taste DNA
 * (data-model.md "Roast is not a taste axis").
 *
 * Props: value (a roast_level, or null: not recorded), onChange
 */
const ENDS = [
  <Glyph key="light" name="flameLight" token={icon.legend} color={color.text.muted} />,
  <Glyph key="dark" name="flameDark" token={icon.legend} color={color.text.muted} />,
];

export default function RoastLevel({ value, onChange }) {
  return <OptionSlider label="Roast level" options={ROAST_LEVELS} value={value} onChange={onChange} ends={ENDS} />;
}
