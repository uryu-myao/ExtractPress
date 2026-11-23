import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { color, texture } from '../../theme/tokens';

/**
 * The dot grid a section of bags stands on (Design Round 31 v2, 37e;
 * texture.dots): flat paper with a dot every pitch from the origin, edge to
 * edge of the section. Fills its parent, behind the content (absolute, no
 * touches). Memoised: it never changes with what is on it.
 */
function DotGround() {
  const { pitch, origin, radius } = texture.dots;
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="dots" x={origin - pitch / 2} y={origin - pitch / 2} width={pitch} height={pitch} patternUnits="userSpaceOnUse">
          <Circle cx={pitch / 2} cy={pitch / 2} r={radius} fill={texture.dots.color} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={color.surface.ground} />
      <Rect width="100%" height="100%" fill="url(#dots)" />
    </Svg>
  );
}

export default memo(DotGround);
