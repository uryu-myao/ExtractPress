import { CameraView } from 'expo-camera';
import { useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, component, layout, space } from '../theme/tokens';
import Button from './base/Button';
import Text from './base/Text';

const cam = component.bagCamera;

/**
 * Taking a bag's photo with a frame to fit it in (Uryu, 2026-11-23; drawn
 * by Design Round 31 v2, 37j). The system camera (ImagePicker) can't draw
 * over its preview, so bags get this one; gear keeps the system camera.
 *
 * Why the frame: the bag is lifted out of the photo (Design Round 31), and
 * a bag that runs out of the picture comes out with straight cut sides; one
 * that fills three or four sides isn't lifted at all (data/photos.ts
 * MAX_EDGES). The frame is 3 : 4, the shelf tile's shape, so what is in the
 * frame is what stands on the shelf. It is a guide only: the whole picture
 * is kept, and a hand holding the bag may run past it (37i snaps that cut
 * to the tile's edge and fades it).
 *
 * 37j: the feed fills the screen above a panel. The frame, frameWidth of
 * the screen's width, centred in the feed, is a thin line with four white
 * corner marks; outside it the feed is dimmed. Above the frame, "Fit the
 * bag in the frame" (cameraTitle) and its line (sheetNote): "A plain
 * background works best" is for white bags on white shelves, the case the
 * lift still loses (Code's note 5). Under it the eyebrow "3 : 4 · the shelf
 * tile's shape". The panel: Take photo, then Cancel centred under it.
 *
 * 37k (look at the cutout before keeping it) is on hold (Uryu, 2026-11-23):
 * a bad cutout is retaken from the bag page's edit.
 *
 * Props
 *   visible
 *   onTaken   (uri) => void, the picture taken (a file in the cache)
 *   onCancel
 */
export default function BagCamera({ visible, onTaken, onCancel }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const camera = useRef(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feed, setFeed] = useState(null);

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

  // The frame: 3 : 4 at frameWidth of the width, centred in the measured feed.
  const frame = feed
    ? (() => {
        const w = width * cam.frameWidth;
        const h = (w * 4) / 3;
        return { left: (width - w) / 2, top: (feed - h) / 2, width: w, height: h };
      })()
    : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onCancel}>
      <View style={styles.screen}>
        <View style={styles.feed} onLayout={(e) => setFeed(e.nativeEvent.layout.height)}>
          {visible ? <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setReady(true)} /> : null}
          {frame ? <Overlay frame={frame} /> : null}
        </View>
        <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, space[20]) }]}>
          <Button label={busy ? 'Taking…' : 'Take photo'} onPress={take} disabled={!ready || busy} />
          <View style={styles.cancel}>
            <Button variant="text" label="Cancel" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** The dim around the frame, its line and corner marks, and the words above and below it. */
function Overlay({ frame: f }) {
  const right = f.left + f.width;
  const bottom = f.top + f.height;
  const { length, width: stroke, overhang } = cam.mark;
  // A corner mark: an L of two borders, overhanging the frame's line.
  const corner = (atTop, atLeft) => ({
    position: 'absolute',
    width: length,
    height: length,
    borderColor: cam.mark.color,
    top: atTop ? f.top - overhang : bottom + overhang - length,
    left: atLeft ? f.left - overhang : right + overhang - length,
    [atTop ? 'borderTopWidth' : 'borderBottomWidth']: stroke,
    [atLeft ? 'borderLeftWidth' : 'borderRightWidth']: stroke,
  });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.dim, { top: 0, left: 0, right: 0, height: f.top }]} />
      <View style={[styles.dim, { top: bottom, left: 0, right: 0, bottom: 0 }]} />
      <View style={[styles.dim, { top: f.top, left: 0, width: f.left, height: f.height }]} />
      <View style={[styles.dim, { top: f.top, left: right, right: 0, height: f.height }]} />
      <View style={[styles.line, f]} />
      <View style={corner(true, true)} />
      <View style={corner(true, false)} />
      <View style={corner(false, true)} />
      <View style={corner(false, false)} />
      <View style={[styles.words, { height: f.top - cam.textAbove }]}>
        <Text variant="cameraTitle" color={cam.text.title} style={styles.centre}>
          Fit the bag in the frame
        </Text>
        <Text variant="sheetNote" color={cam.text.line} style={styles.centre}>
          Leave a little room around it. A plain background works best.
        </Text>
      </View>
      <View style={[styles.eyebrow, { top: bottom + cam.eyebrowBelow }]}>
        <Text variant="tileStatus" color={cam.text.eyebrow}>
          3 : 4 · the shelf tile's shape
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.surface.inverse,
  },
  feed: {
    flex: 1,
    overflow: 'hidden',
  },
  dim: {
    position: 'absolute',
    backgroundColor: cam.dim,
  },
  line: {
    position: 'absolute',
    borderWidth: cam.line.width,
    borderColor: cam.line.color,
  },
  // Above the frame, its foot textAbove over the frame's top.
  words: {
    position: 'absolute',
    top: 0,
    left: layout.gutter,
    right: layout.gutter,
    justifyContent: 'flex-end',
    gap: cam.textGap,
  },
  centre: {
    textAlign: 'center',
  },
  eyebrow: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  panel: {
    backgroundColor: color.surface.raised,
    borderTopWidth: cam.panel.border,
    borderTopColor: color.border.strong,
    paddingTop: cam.panel.top,
    paddingHorizontal: layout.gutter,
    gap: cam.panel.gap,
  },
  cancel: {
    alignItems: 'center',
  },
});
