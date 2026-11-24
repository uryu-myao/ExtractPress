import { memo } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { component } from '../theme/tokens';

const spec = component.gearTile.icon;

/**
 * The gear type icons (Design Round 31 addendum, 37p): a different asset
 * class from the 24 glyphs. One 64 × 64 master per type, on an 8 grid, live
 * area 56 (4 inset), stroke 2.5, round caps and joins, outline only: the
 * silhouette and 1–3 inner lines. Drawn for the size; the stroke scales
 * with the icon (3 at 76).
 *
 * TEMPORARY: the four on 37p are Design's stand-ins, drawn to the spec so
 * the real ones drop in here without moving anything. A brewer that isn't
 * a dripper (AeroPress, French press) uses the brewer icon.
 *
 * Props: category ('brewer' | 'grinder' | 'kettle' | 'scale'), size, color
 */
const SHAPES = {
  brewer: [
    <Path key="a" d="M8 14h48" />,
    <Path key="b" d="M12 14l12 24h16l12-24" />,
    <Path key="c" d="M52 19c8 2 6 12 0 14" />,
    <Path key="d" d="M22 38h20v5H22z" />,
    <Path key="e" d="M18 48h28v5a7 7 0 0 1-7 7H25a7 7 0 0 1-7-7z" />,
  ],
  grinder: [
    <Path key="a" d="M32 19V9" />,
    <Path key="b" d="M32 9h16" />,
    <Circle key="c" cx="48" cy="14" r="3" />,
    <Path key="d" d="M20 19h24v6H20z" />,
    <Path key="e" d="M22 25h20v32H22z" />,
    <Path key="f" d="M22 45h20" />,
  ],
  kettle: [
    <Path key="a" d="M30 17v6" />,
    <Path key="b" d="M21 23h18v5H21z" />,
    <Path key="c" d="M15 28h30v22a6 6 0 0 1-6 6H21a6 6 0 0 1-6-6z" />,
    <Path key="d" d="M45 31h5a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-5" />,
    <Path key="e" d="M15 46C7 46 8 30 4 23" />,
  ],
  scale: [
    <Path key="a" d="M6 26h52v22H6z" />,
    <Path key="b" d="M18 33h16v8H18z" />,
    <Circle key="c" cx="46" cy="37" r="2.5" />,
    <Path key="d" d="M12 48v4M52 48v4" />,
  ],
};

function GearIcon({ category, size, color }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${spec.master} ${spec.master}`} fill="none" stroke={color} strokeWidth={spec.stroke} strokeLinecap="round" strokeLinejoin="round">
      {SHAPES[category] ?? SHAPES.brewer}
    </Svg>
  );
}

export default memo(GearIcon);
