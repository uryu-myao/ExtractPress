import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { photoStyleAvailable, photoStyleMissing } from '../../modules/photo-style';
import { dropPhoto, preparePhoto } from '../data/photos';
import BagCamera from './BagCamera';
import { color, icon, layout, shape, size, space, spacing, state } from '../theme/tokens';
import BottomSheet from './base/BottomSheet';
import Button from './base/Button';
import Glyph from './base/Glyph';
import Text from './base/Text';

/**
 * Adding a photo (2026-11-01; bags first, 3c). One bottom sheet:
 *   choose   "Take a photo" / "Choose from library" (and "Remove photo"
 *            when the field has one)
 *   confirm  gear only: the photo as it will be kept, with "Use this photo"
 *            and "Choose another". A bag has no confirm step (Design Turn
 *            37, 2026-11-25: on Add a bag the lift is the confirmation, the
 *            camera button changes the photo; 38b): the photo goes straight
 *            back to the screen
 * Nothing is kept until the screen's own Save: the sheet hands back a
 * prepared photo (data/photos.ts preparePhoto), the screen keeps it.
 * usePhotoPick is the taking and choosing without the sheet: Add a bag's
 * footprint offers both on the page (38a).
 *
 * Failures say what happened and change nothing: no camera (the simulator),
 * the camera refused (with a way to Settings), the photo couldn't be read,
 * or a build without the photo module (photoStyleMissing, never silent).
 *
 * A bag's photo (guide="bag", 2026-11-23) is taken with BagCamera, which
 * frames the bag so it can be lifted out cleanly; gear keeps the system
 * camera. The library is the same for both.
 *
 * A bag's choose step is the "Bag photo" sheet (Design Round 31 v2, 37m;
 * 29a's sheet): the title in display.sm, then rows (a glyph at icon.action,
 * the label in `label`, at least 56 tall, a 1.5 border.subtle line between):
 * with a photo, Retake photo (BagCamera), Choose from Photos (the same lift)
 * and Remove photo (destructive: label and glyph only, Round 24) with "The
 * letter block takes its place" under it; with none, Take a photo and Choose
 * from Photos. No Cancel (Uryu, 2026-11-23; 37m draws one): the sheet
 * closes as every sheet does, a tap on the dimmed page or a swipe down.
 * Removing asks nothing more: the
 * bag and its cups stay, and a new photo is one tap away. Gear keeps the
 * buttons below until Design draws its sheet.
 *
 * Props
 *   visible, onClose
 *   onChosen   (PendingPhoto) => void: a bag's at once, gear's after "Use this photo"
 *   onRemove   optional: offers "Remove photo"
 *   guide      optional 'bag': take the photo with BagCamera's frame
 *   removeNote the line under Remove photo (bag sheet). Add a bag passes
 *              null: there the footprint comes back, not the letter block
 */
export default function PhotoSheet({ visible, onClose, onChosen, onRemove, guide, removeNote = 'The letter block takes its place' }) {
  const { width } = useWindowDimensions();
  // A bag's photo goes straight back (no confirm step, 38b); gear's waits in the sheet.
  const { step, setStep, pick, camera } = usePhotoPick({ guide, onChosen: guide === 'bag' ? onChosen : undefined });

  // Closing at any step drops a photo not taken.
  useEffect(() => {
    if (!visible) setStep(null);
  }, [visible, setStep]);

  const close = () => {
    if (step && step !== 'working') dropPhoto(step.id);
    onClose();
  };

  const use = () => {
    const chosen = step;
    setStep(null);
    onChosen(chosen);
  };

  const again = () => {
    dropPhoto(step.id);
    setStep(null);
  };

  const preview = width - 2 * layout.gutter;
  return (
    <>
      {camera}
      <BottomSheet visible={visible} onClose={close} swipeToClose>
        {step === 'working' ? (
          <View style={[styles.working, { height: preview * 0.75 }]}>
            <ActivityIndicator color={color.text.primary} />
            <Text variant="meta" color="muted">
              Preparing the photo…
            </Text>
          </View>
        ) : step ? (
          <View style={styles.body}>
            <Image source={{ uri: step.uri }} style={{ width: preview, height: preview * 0.75 }} resizeMode="contain" accessibilityLabel="The photo as it will be kept" />
            <Button label="Use this photo" onPress={use} />
            <Button variant="secondary" label="Choose another" onPress={again} />
          </View>
        ) : guide === 'bag' ? (
          <View style={styles.body}>
            <Text variant="displaySm">Bag photo</Text>
            <View>
              <SheetRow glyph="photo" label={onRemove ? 'Retake photo' : 'Take a photo'} onPress={() => pick('camera')} />
              <SheetRow glyph="photos" label="Choose from Photos" onPress={() => pick('library')} last={!onRemove} />
              {onRemove ? (
                <SheetRow
                  glyph="trash"
                  label="Remove photo"
                  sub={removeNote ?? undefined}
                  destructive
                  last
                  onPress={() => {
                    onRemove();
                    onClose();
                  }}
                />
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.body}>
            <Button variant="secondary" label="Take a photo" onPress={() => pick('camera')} />
            <Button variant="secondary" label="Choose from library" onPress={() => pick('library')} />
            {onRemove ? (
              <Button
                variant="text"
                destructive
                label="Remove photo"
                onPress={() => {
                  onRemove();
                  onClose();
                }}
              />
            ) : null}
          </View>
        )}
      </BottomSheet>
    </>
  );
}

/**
 * Taking or choosing a photo, without the sheet (PhotoSheet's choose step,
 * Add a bag's footprint, 38a). pick('camera' | 'library') checks the module
 * and the camera permission, takes the photo (a bag's through BagCamera,
 * whose modal is `camera`, to be rendered by the caller) and prepares it.
 * With onChosen the prepared photo goes straight to it; without, it waits
 * in `step` (PhotoSheet's confirm). step: null | 'working' | PendingPhoto.
 * Failures say what happened and change nothing.
 */
export function usePhotoPick({ guide, onChosen }) {
  const [step, setStep] = useState(null);
  const [framing, setFraming] = useState(false);

  const prepare = async (uri) => {
    try {
      setStep('working');
      const photo = await preparePhoto(uri);
      if (onChosen) {
        setStep(null);
        onChosen(photo);
      } else {
        setStep(photo);
      }
    } catch (error) {
      console.error('[photo] could not prepare the photo', error);
      setStep(null);
      Alert.alert("The photo couldn't be used", String(error?.message ?? error));
    }
  };

  const pick = async (source) => {
    if (!photoStyleAvailable) {
      Alert.alert("Photos can't be added yet", photoStyleMissing);
      return;
    }
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('The camera is off for Extract Press', 'Turn it on in Settings to take a photo here.', [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]);
          return;
        }
      }
      if (source === 'camera' && guide === 'bag') {
        setFraming(true);
        return;
      }
      const options = { mediaTypes: ['images'], quality: 1, exif: false };
      const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets?.[0]) return;
      await prepare(result.assets[0].uri);
    } catch (error) {
      console.error('[photo] could not take the photo', error);
      setStep(null);
      Alert.alert("The photo couldn't be used", String(error?.message ?? error));
    }
  };

  const camera = (
    <BagCamera
      visible={framing}
      onCancel={() => setFraming(false)}
      onTaken={(uri) => {
        setFraming(false);
        prepare(uri);
      }}
    />
  );

  return { step, setStep, pick, camera };
}

/** A row of the Bag photo sheet (37m): glyph, label, optional sub line; a line under all but the last. */
function SheetRow({ glyph, label, sub, destructive = false, last = false, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[label, sub].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.row, !last && styles.rowRule, pressed && styles.rowPressed]}>
      <Glyph name={glyph} token={icon.action} color={destructive ? color.icon.destructive : color.icon.default} />
      <View style={styles.rowText}>
        <Text variant="label" color={destructive ? 'destructive' : 'primary'}>
          {label}
        </Text>
        {sub ? (
          <Text variant="bodySm" color="muted">
            {sub}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.sheetRow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[14],
    paddingVertical: space[8],
  },
  rowRule: {
    borderBottomWidth: shape.borderWidth.weak,
    borderBottomColor: color.border.subtle,
  },
  rowPressed: {
    backgroundColor: state.pressed.row,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: space[2],
  },
  body: {
    gap: spacing.gap.section,
  },
  working: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    minHeight: size.tapTarget,
  },
});
