# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start the development server
npx expo start

# Run on specific platforms
npx expo start --ios
npx expo start --android
npx expo start --web

# Release build onto Uryu's iPhone (JS bundled in, no Metro needed). Signed
# by the paid team (Y57C6973DT), so the build no longer expires after 7 days.
# Phone connected by cable or "Connect via network". Records survive a
# reinstall.
npm run ios:device

# After adding a native dependency or a config plugin, regenerate ios/
# (gitignored, Continuous Native Generation) before building:
CI=1 npx expo prebuild --platform ios --no-install && (cd ios && pod install)

# If ios:device can't find a profile or hangs at "Connecting", build and
# install directly (-allowProvisioningUpdates fetches the profile):
(cd ios && xcodebuild -workspace ExtractPress.xcworkspace -scheme ExtractPress \
  -configuration Release -destination id=00008130-001661C42142001C \
  -derivedDataPath build -allowProvisioningUpdates \
  -allowProvisioningDeviceRegistration build)
xcrun devicectl device install app --device 00008130-001661C42142001C \
  ios/build/Build/Products/Release-iphoneos/ExtractPress.app
```

No test or lint scripts are configured yet.

## Architecture

Extract Press (internal name MoreCoffee) is a React Native + Expo mobile app for logging and tracking coffee consumption. The GitHub repository is `uryu-myao/ExtractPress`; `expo.slug`, `package.json` `name` and code identifiers keep the internal name; what the user sees says Extract Press (`design/rename-plan.md`).

**Entry point:** `App.js` → renders `src/AppShell.js`

**Navigation model:** Tab-based navigation managed entirely in `AppShell.js` via React `useState`. There is no React Navigation or router library — `activeTab` state drives which screen renders. The Add Coffee button opens a modal overlay instead of navigating.

**Screen registration:** `src/screens/index.js` exports a map of tab key → screen component. Add new screens here.

**Modal overlay:** `src/components/AddCoffeeOverlay.js` wraps `AddCoffeeScreen` in an animated slide-up modal, controlled by `showAddCoffee` state in `AppShell`.

**Shared layout:** `src/screens/ScreenFrame.js` is the standard wrapper for screen content — provides consistent header and padding. Most screens use this.

**Design tokens:** `src/theme/token.ts` is the single source of truth for all visual values (colors, spacing, radius, typography, shadows, icon sizes, semantic composites). Always use tokens; never hardcode raw values. If a token is missing, add it there with a semantic name.

## UI Implementation Rules (from AGENTS.md)

- **Tokens first:** Never hardcode colors, spacing, font sizes, or radius values. Use `src/theme/token.ts`.
- **Reuse before creating:** Check existing components (cards, buttons, tabs, list rows) before making new ones. Extend rather than duplicate.
- **Flex layouts:** Prefer flex over absolute positioning. Keep layouts responsive for common iPhone widths.
- **Typography hierarchy:** Screen title → section title → card title → body → caption. Avoid too many font sizes per screen.
- **Implementation order:** structure → shared components → tokens → spacing/hierarchy → shown states only.
- **No invented interactions:** If a component looks informational, don't make it appear editable. Match what's in the design.
- **Ambiguity:** Leave a `// TODO:` comment and flag it in your summary rather than inventing product behavior.

## Output Format for Implementation Tasks

After completing each implementation task, provide:
- Files changed
- Short summary of what was implemented
- Any design ambiguities
- Any deviations from the mock
