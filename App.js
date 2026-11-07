import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppShell from './src/AppShell';
import DatabaseProvider from './src/data/DatabaseProvider';
import { fontAssets } from './src/theme/fonts';

// The base-component dev harness stays reachable for development:
//   EXPO_PUBLIC_DEV_HARNESS=1 npx expo start
// Required inside the branch (as the dev seed, DatabaseProvider.js): Metro
// folds __DEV__ to false, so production builds drop src/dev/ entirely.
const SHOW_DEV_HARNESS = __DEV__ && process.env.EXPO_PUBLIC_DEV_HARNESS === '1';
const DevHarness = SHOW_DEV_HARNESS ? require('./src/dev/DevHarness').default : null;

export default function App() {
  const [fontsLoaded] = useFonts(fontAssets);

  if (!fontsLoaded) return null;

  // GestureHandlerRootView: required at the root by react-native-gesture-handler,
  // used (with Reanimated) only for finger-following gestures such as the taste
  // axis drag. Existing scroll-linked animation stays on Animated (§1).
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {SHOW_DEV_HARNESS ? (
          <DevHarness />
        ) : (
          <DatabaseProvider>
            <AppShell />
          </DatabaseProvider>
        )}
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
