import { CameraView } from 'expo-camera';
import { useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, layout, shape, space, spacing } from '../theme/tokens';
import Button from './base/Button';
import Text from './base/Text';

/**
 * Taking a bag's photo with a frame to fit it in (Uryu, 2026-11-23). The
 * system camera (ImagePicker) can't draw over its preview, so bags get
 * this one; gear keeps the system camera.
 *
 * Why the frame: the bag is lifted out of the photo (Design Round 31), and
 * a bag that runs out of the picture comes out with straight cut sides; one
 * that fills three or four sides isn't lifted at all (data/photos.ts
 * MAX_EDGES). The frame asks for room around the bag. It is a guide only:
 * the whole picture is kept, and a hand holding the bag may run past it
 * (Design's rule snaps that cut to the tile's edge and fades it).
 *
 * The frame is 3 : 4, the shelf tile's shape (Design Round 31 §5), FRAME.width
 * of the preview's width, centred; outside it the preview is dimmed with the
 * sheet scrim. Words over the preview in text.onInverse; the controls in a
 * paper panel under it, as a sheet's.
 *
 * PROVISIONAL throughout, not drawn by Design: the frame's size, the dim,
 * the words and the panel. TODO(Design): draw this screen.
 *
 * Props
 *   visible
 *   onTaken   (uri) => void, the picture taken (a file in the cache)
 *   onCancel
 */
const FRAME = { width: 0.72, maxHeight: 0.78, aspect: 3 / 4 };

export default function BagCamera({ visible, onTaken, onCancel }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const camera = useRef(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [area, setArea] = useState(null);

  const take = async () => {
    if (!camera.current || busy) return;
    setBusy(true);
    try {
      const picture = await camera.current.takePictureAsync({ quality: 1, exif: false });
      onTaken(picture.uri);
    } catch (error) {
      console.error('[camera] could not take the picture', error);
      Alert.alert("The photo wasn't taken", String(error?.message ?? error));
    } finally {
      setBusy(false);
    }
  };

  // The frame, from the preview's measured height.
  let frame = null;
  if (area) {
    let w = width * FRAME.width;
    let h = w / FRAME.aspect;
    if (h > area * FRAME.maxHeight) {
      h = area * FRAME.maxHeight;
      w = h * FRAME.aspect;
    }
    frame = { width: w, height: h };
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onCancel}>
      <View style={styles.screen}>
        <View style={styles.preview} onLayout={(e) => setArea(e.nativeEvent.layout.height)}>
          {visible ? <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setReady(true)} /> : null}
          {frame ? (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={[styles.dim, styles.above, { paddingTop: insets.top }]}>
                <Text variant="label" color="onInverse" style={styles.centre}>
                  Fit the bag inside the frame
                </Text>
                <Text variant="meta" color="onInverse" style={styles.centre}>
                  Leave a little room around it, so it can be lifted out cleanly.
                </Text>
              </View>
              <View style={styles.middle}>
                <View style={styles.dim} />
                <View style={[styles.frame, frame]} />
                <View style={styles.dim} />
              </View>
              <View style={styles.dim} />
            </View>
          ) : null}
        </View>
        <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, layout.screen.bottom) }]}>
          <Button label={busy ? 'Taking…' : 'Take photo'} onPress={take} disabled={!ready || busy} />
          <Button variant="text" label="Cancel" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.surface.inverse,
  },
  preview: {
    flex: 1,
    overflow: 'hidden',
  },
  dim: {
    flex: 1,
    backgroundColor: color.scrim,
  },
  above: {
    justifyContent: 'flex-end',
    paddingHorizontal: layout.gutter,
    paddingBottom: space[16],
    gap: spacing.gap.tight,
  },
  centre: {
    textAlign: 'center',
  },
  middle: {
    flexDirection: 'row',
  },
  frame: {
    borderWidth: shape.borderWidth.box,
    borderColor: color.text.onInverse,
  },
  panel: {
    backgroundColor: color.surface.raised,
    borderTopWidth: shape.borderWidth.box,
    borderTopColor: color.border.container,
    paddingTop: layout.gutter,
    paddingHorizontal: layout.gutter,
    gap: spacing.gap.section,
  },
});
