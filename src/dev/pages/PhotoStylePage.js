import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { photoStyleAvailable, photoStyleMissing, renderPhoto } from '../../../modules/photo-style';
import Button from '../../components/base/Button';
import Text from '../../components/base/Text';
import { PHOTO_STYLE } from '../../constants/photoStyle';
import { color, layout, shape, size, spacing } from '../../theme/tokens';
import { HarnessGroup, HarnessPage } from '../harness';

/**
 * Photo style lab (dev only, 2026-11-01): pick a photo, change the house
 * style's numbers, see the styled copy each time (the native render, as the
 * app does it). Starts from PHOTO_STYLE; nothing here changes it. When a
 * setting looks right, copy the numbers shown into src/constants/photoStyle.js
 * (then restyleAll for the photos already kept).
 *
 * In place of Skia's live preview (Uryu, 2026-11-01): each change re-renders
 * through Core Image, a fraction of a second on the phone.
 */
const LAB = new Directory(Paths.cache, 'photo-lab');
const STEPS = { contrast: 0.05, dither: 0.02 };

export default function PhotoStylePage() {
  const { width } = useWindowDimensions();
  const [source, setSource] = useState(null);
  const [style, setStyle] = useState(PHOTO_STYLE);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const run = useRef(0);

  useEffect(() => {
    if (!source || !photoStyleAvailable) return;
    const mine = ++run.current;
    LAB.create({ intermediates: true, idempotent: true });
    const original = new File(LAB, `o${mine}.jpg`);
    const styled = new File(LAB, `s${mine}.jpg`);
    const started = Date.now();
    renderPhoto(source, original.uri, styled.uri, style).then(
      () => {
        if (run.current !== mine) return;
        setResult({ uri: styled.uri, ms: Date.now() - started, kb: Math.round(styled.size / 1024), originalKb: Math.round(original.size / 1024) });
        setError(null);
      },
      (e) => setError(String(e?.message ?? e))
    );
  }, [source, style]);

  const pick = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!picked.canceled && picked.assets?.[0]) setSource(picked.assets[0].uri);
  };
  const step = (key, sign) => setStyle((s) => ({ ...s, [key]: Math.max(0, Math.round((s[key] + sign * STEPS[key]) * 100) / 100) }));
  const side = width - 2 * layout.gutter;

  return (
    <HarnessPage>
      <HarnessGroup title="source">
        {photoStyleAvailable ? <Button variant="secondary" label="Choose a photo" onPress={pick} /> : <Text variant="body">{photoStyleMissing}</Text>}
      </HarnessGroup>
      {result ? (
        <HarnessGroup title={`styled · ${result.ms} ms · original ${result.originalKb} KB · styled ${result.kb} KB`}>
          <Image source={{ uri: result.uri }} style={{ width: side, height: side * 0.75 }} resizeMode="contain" />
        </HarnessGroup>
      ) : null}
      {error ? <Text variant="meta" color="accent">{error}</Text> : null}
      <HarnessGroup title="numbers (copy into photoStyle.js)">
        {['contrast', 'dither'].map((key) => (
          <View key={key} style={styles.row}>
            <Text variant="label" style={styles.name}>{`${key} ${style[key].toFixed(2)}`}</Text>
            <Button variant="secondary" label="−" onPress={() => step(key, -1)} />
            <Button variant="secondary" label="+" onPress={() => step(key, 1)} />
          </View>
        ))}
        {['ink', 'paper'].map((key) => (
          <View key={key} style={styles.row}>
            <Text variant="label" style={styles.name}>{key}</Text>
            <TextInput
              defaultValue={style[key]}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={(e) => {
                const hex = e.nativeEvent.text.trim();
                if (/^#[0-9a-fA-F]{6}$/.test(hex)) setStyle((s) => ({ ...s, [key]: hex }));
              }}
              style={styles.hex}
            />
          </View>
        ))}
        <Text variant="meta" color="muted">{JSON.stringify(style)}</Text>
        <Button variant="text" label="Reset to photoStyle.js" onPress={() => setStyle(PHOTO_STYLE)} />
      </HarnessGroup>
    </HarnessPage>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap.row,
  },
  name: {
    flex: 1,
  },
  hex: {
    flex: 1,
    height: size.field.height,
    borderBottomWidth: shape.borderWidth.box,
    borderBottomColor: color.border.strong,
    color: color.text.primary,
  },
});
