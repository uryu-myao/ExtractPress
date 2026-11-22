import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { component } from '../theme/tokens';

/**
 * Welcome's plate (Design Round 30, 36a): the visual at the top of 8a. One
 * static image on a brown plate, at the gutter, 196 tall, a 2px ink frame,
 * no shadow (component.welcomePlate).
 *
 * TODO(Uryu): the artwork. Put the file in src/assets/images/ and set
 * ARTWORK to require('../assets/images/<file>.png'); it fills the plate
 * (cover). Until then a provisional drawing stands in: 9b's idea, concentric
 * extraction rings (a cup seen from above, the water's ripple) printed in two
 * inks a few points out of register.
 */
const ARTWORK = null;

const plate = component.welcomePlate;
// The provisional drawing's rings: radii in a 0–100 box, centred low-right.
const RADII = [12, 22, 32, 42, 52, 62, 72];
const MISREGISTER = { x: 2.5, y: 1.8 };

export default function WelcomePlate() {
  return (
    <View style={styles.plate} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {ARTWORK ? (
        <Image source={ARTWORK} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          {RADII.map((r) => (
            <Circle key={`o${r}`} cx={62 + MISREGISTER.x} cy={58 + MISREGISTER.y} r={r} stroke={plate.offset} strokeWidth={1.4} fill="none" />
          ))}
          {RADII.map((r) => (
            <Circle key={`r${r}`} cx={62} cy={58} r={r} stroke={plate.rings} strokeWidth={1.4} fill="none" />
          ))}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    height: plate.height,
    overflow: 'hidden',
    backgroundColor: plate.fill,
    borderWidth: plate.frame.width,
    borderColor: plate.frame.color,
  },
});
