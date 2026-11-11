# App Store release checklist (recorded 2026-11-07)

Target: on the store by the end of December 2026 (`v1-status.md`). This lists what has to be submitted or set up, not features. Checked against the repo and this Mac on 2026-11-07.

**Mark:** ✅ ready · ⚠️ exists but must change · ❌ missing

## 1. Account and signing: start first

| Item | State | Notes |
|---|---|---|
| Apple Developer Program | ⏳ applied (2026-11-07), approval pending. Was: | This Mac holds one signing identity, "Apple Development: myao.jpn@gmail.com", and device builds expire after 7 days: that is free provisioning (a Personal Team, `Y57C6973DT`). The App Store needs the paid program (USD 99 a year). **Enrol now**: approval can take from a day to a couple of weeks. |
| Distribution certificate | ❌ | "Apple Distribution". Xcode's automatic signing makes it once the paid team exists. |
| App Store provisioning profile | ❌ | Made by automatic signing, the same way. |
| App ID / bundle ID | ✅ 2026-11-08: **`app.smallpress.extract`** (was `com.uryumyao.MoreCoffee-App`) | Not yet registered under the paid team: automatic signing registers it on the first signed build. **It can never change after the first upload.** A new bundle ID is a new app: Uryu's records stay in the old app on his phone, so **export there before deleting it** (`todo.md` T-16, `rename-plan.md`). |
| App Store Connect app record | ❌ the name is decided (2026-11-08); make it once the paid team is approved | Name, primary language (English), bundle ID, SKU. The bundle ID can't change after the first upload. |

## 2. The binary

| Item | State | Notes |
|---|---|---|
| Release build | ✅ builds | Release for device built 2026-11-07 (0 errors, 2 warnings). Install failed only because the phone disconnected. Archiving and uploading are untried: they need distribution signing. |
| Display name | ✅ 2026-11-08 | **"Extract Press"**, `ios.infoPlist.CFBundleDisplayName` (was "MoreCoffee", and "MoreCoffee-App" before 2026-11-07). `rename-plan.md`. |
| Version / build | ✅ 2026-11-09: `ios.buildNumber` is in `app.json` (was only in the generated Info.plist) | 1.0.0 (1). Profile's last line shows the same pair ("Extract Press 1.0.0 (1)"), so a report can be matched to an upload. **On every upload**: (1) raise `expo.ios.buildNumber` in `app.json` by one ("1" → "2"; App Store Connect refuses a build number it has seen for this version); (2) for a new release, raise `expo.version` and start the build number again at "1"; (3) `ios/` is generated, so run `npx expo prebuild --platform ios` (or a clean `expo run:ios`) and check `CFBundleVersion` in `ios/ExtractPress/Info.plist` before archiving; (4) check Profile's last line on the build. |
| App icon | ❌ | `assets/icon.png` is **Expo's template** (grey grid and circles). It is the right size: 1024×1024 with no alpha, and a single 1024 is enough now because Xcode makes the other sizes. A real icon is needed: square corners in the file, with no transparency. |
| Launch screen | ❌ | `assets/splash.png` is also Expo's template. The background is already `#F4EDEA`. |
| iPad | ✅ 2026-11-07: `supportsTablet: false`, the device family is iPhone only. Was: | `supportsTablet: true`: the app is offered as an iPad app, review tests it on iPad, iPad screenshots become required, and the iPad Info.plist allows all four orientations. The design is phone-only. **Set it to false before the first submission. A device family can't be dropped in a later update.** With false, iPads run the iPhone layout. |
| Export compliance | ✅ 2026-11-07: `ios.config.usesNonExemptEncryption: false` in `app.json` sets it. Was: | Add `ITSAppUsesNonExemptEncryption = false` (`ios.config.usesNonExemptEncryption: false` in `app.json`), or App Store Connect asks on every build. The app does no encryption of its own. |
| Privacy manifest | ✅ | `PrivacyInfo.xcprivacy`: no collected data types, `NSPrivacyTracking` false, and reasons given for the UserDefaults, file-timestamp and boot-time APIs. |
| Dev seed data | ✅ **verified** | A production export's source map lists the app's 126 modules, and `src/data/dev/seed.ts` is not among them. It cannot run in Release because it isn't in the bundle. (The opt-in `EXPO_PUBLIC_DEV_SEED=1` only applies under `__DEV__`.) |
| Dev harness | ✅ 2026-11-07: `require()`d inside the branch, so the production bundle went from 126 app modules to 110, none from `src/dev/`. Was: unreachable but shipped. | `SHOW_DEV_HARNESS = __DEV__ && EXPO_PUBLIC_DEV_HARNESS === '1'` is false in Release, and nothing else imports `src/dev/`, so no path reaches it. But `App.js` imports `DevHarness` at the top, so its **16 modules** (the Photo style lab, the AxisSlider page and the rest) are in the bundle. Fix: `require()` it inside the branch, as the seed does. A three-line change. |
| Retired screens | ✅ | HomeScreen, CoffeeListScreen, AddCoffeeScreen and the other old screens are not in the bundle. |
| Placeholder content | ⚠️ 2026-11-08: the Try next tab is gone (four-slot bar); 6b / 6c still to check (2026-11-09: 6c's link rows stay hidden while their URL is empty, so none is a dead end). Was: ❌ | The Try next tab says **"This screen is being rebuilt."** App Review rejects placeholder content (Guideline 2.1). It goes, whichever way Uryu decides Try next. Check every other row for a dead end too (6b, 6c). |

## 3. Permission strings (Info.plist, as of 2026-11-07)

| Key | Text now | |
|---|---|---|
| `NSCameraUsageDescription` | "Take a photo of a bag of beans. It stays on your phone." | ✅ 2026-11-07 (was "…a bag or a piece of gear…": gear photos are out of V1) |
| `NSLocationWhenInUseUsageDescription` | "Shows the cafés around you first when you pick one. Your location is never stored." | ✅ |
| Photo library | none | ✅ choosing from the library uses the system picker, which needs no permission (`photosPermission: false`) |
| Microphone, motion, Always location | none | ✅ turned off in the plugins |

## 4. App Store Connect metadata

| Item | State | Notes |
|---|---|---|
| Privacy policy URL | ❌ **required before the December submission** (`todo.md` T-18) | Required for every app, and App Review opens it: a 404 or an "under construction" page is a rejection. One GitHub Pages page; the content is settled in T-18 (records and photos stay on the phone; café search sends the search words, and the location when used, to Apple's MapKit; no analytics, no ads). **Also inside the app** (Guideline 5.1.1(i)): fill `PRIVACY_POLICY_URL` in `src/constants/links.js`, or Profile shows no Privacy policy row. |
| Support URL | ❌ **required before the December submission** (`todo.md` T-18) | Required, and must open. A contact address on one line, on the same site. `SUPPORT_URL` in `src/constants/links.js` holds it. |
| App privacy label | ❌ to fill in: **"Data Not Collected"** | Nothing is sent to us or to a third party: there is no analytics, crash reporting or network code besides MapKit. Location is used on the phone; MapKit's café search goes to Apple only to answer the request at that moment, which Apple's definition doesn't count as collecting. Photos and the CSV stay on the phone; the share sheet is the user's own act. No need to declare photos or location. |
| Age rating | ❌ to fill in | Apple's current questionnaire. Every answer "none" (no ads, no shared user content, no web browsing, no alcohol), which gives the lowest rating. My words is never shared, so it isn't user-generated content in Apple's sense. |
| Screenshots | ❌ | iPhone 6.9": 1320×2868, 1290×2796 or 1260×2736 px, 1 to 10 of them; the smaller iPhone sizes are made from these. iPad 13" too **if** `supportsTablet` stays true. English only. The 16 Pro Max-class simulator or Uryu's 15 Pro Max (1290×2796) gives the right size directly. |
| Description, keywords, subtitle, category | ❌ | Category: Food & Drink. |
| Copyright, price, availability | ❌ | |
| Review information | ❌ | Contact details, plus notes saying what the camera and location are for. No login, so no demo account. |

## 5. Suggested order

1. This week: enrol in the Developer Program; decide the bundle ID and iPad; fix the display name, the camera text and the export flag; drop the dev harness from the bundle.
2. Once enrolled: make the app record and archive, then upload to **TestFlight** and install it on Uryu's phone (this also answers whether his records survive).
3. In parallel: the icon and launch screen (Design), the privacy policy and support pages, the metadata text.
4. In the last two weeks: screenshots from the final build, then submit. **Before pressing Submit**: the privacy policy and support pages open from a phone, both URLs are on the app record, and the build's Profile shows the Privacy policy row and opens it (`todo.md` T-18). Review usually takes a day or two; allow for one rejection round.

Icon and launch screen: Uryu supplies them. The steps and file specs are in `rename-plan.md`, "Replacing the icon and launch screen".
