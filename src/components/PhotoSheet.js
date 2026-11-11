import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, StyleSheet, View, useWindowDimensions } from 'react-native';
import { photoStyleAvailable, photoStyleMissing } from '../../modules/photo-style';
import { dropPhoto, preparePhoto } from '../data/photos';
import { color, layout, size, space, spacing } from '../theme/tokens';
import BottomSheet from './base/BottomSheet';
import Button from './base/Button';
import Text from './base/Text';

/**
 * Adding a photo (2026-11-01; bags first, 3c). PROVISIONAL throughout: the
 * choice, the confirm screen and their words wait on Design Round 19 (A3,
 * A4, A8). One bottom sheet, two steps:
 *   choose   "Take a photo" / "Choose from library" (and "Remove photo"
 *            when the field has one)
 *   confirm  the photo AS IT WILL BE KEPT, already styled (Uryu: showing the
 *            original, then another picture after saving, would surprise),
 *            with "Use this photo" and "Choose another"
 * Nothing is kept until the screen's own Save: the sheet hands back a
 * prepared photo (data/photos.ts preparePhoto), the screen keeps it.
 *
 * Failures say what happened and change nothing: no camera (the simulator),
 * the camera refused (with a way to Settings), the photo couldn't be styled,
 * or a build without the photo module (photoStyleMissing, never silent).
 *
 * Props
 *   visible, onClose
 *   onChosen   (PendingPhoto) => void, after "Use this photo"
 *   onRemove   optional: offers "Remove photo"
 */
export default function PhotoSheet({ visible, onClose, onChosen, onRemove }) {
  const { width } = useWindowDimensions();
  // null (choose) | 'working' | { id, uri } (confirm)
  const [step, setStep] = useState(null);

  // Closing at any step drops a photo not taken.
  useEffect(() => {
    if (!visible) setStep(null);
  }, [visible]);

  const close = () => {
    if (step && step !== 'working') dropPhoto(step.id);
    onClose();
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
      const options = { mediaTypes: ['images'], quality: 1, exif: false };
      const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets?.[0]) return;
      setStep('working');
      setStep(await preparePhoto(result.assets[0].uri));
    } catch (error) {
      console.error('[photo] could not take the photo', error);
      setStep(null);
      Alert.alert("The photo couldn't be used", String(error?.message ?? error));
    }
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
    <BottomSheet visible={visible} onClose={close} swipeToClose>
      {step === 'working' ? (
        <View style={[styles.working, { height: preview * 0.75 }]}>
          <ActivityIndicator color={color.text.primary} />
          <Text variant="meta" color="muted">
            Styling the photo…
          </Text>
        </View>
      ) : step ? (
        <View style={styles.body}>
          <Image source={{ uri: step.uri }} style={{ width: preview, height: preview * 0.75 }} resizeMode="contain" accessibilityLabel="The photo as it will be kept" />
          <Button label="Use this photo" onPress={use} />
          <Button variant="secondary" label="Choose another" onPress={again} />
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
  );
}

const styles = StyleSheet.create({
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
