/**
 * Pages outside the app (6c). One place: fill a URL here and its row appears.
 *
 * A row whose URL is null is not shown (2026-11-09): no dead row, and nothing
 * that opens a 404 in front of App Review (Guideline 2.1).
 *
 * TODO(T-18): both pages must exist before the December submission
 * (design/todo.md T-18, release-checklist.md §4). App Store Connect requires
 * both URLs, and Guideline 5.1.1(i) wants the privacy policy inside the app
 * too, so PRIVACY_POLICY_URL must not be null in the submitted build.
 */
export const PRIVACY_POLICY_URL = null;

/** App Store Connect's Support URL. No row in 6c draws it; kept here with its pair. */
export const SUPPORT_URL = null;

/**
 * 6c's Send feedback (Design Round 26 A6, B5): opens Mail to this address.
 * TODO(T-18): the support address, the same one as the support page's. While
 * null, the row isn't shown.
 */
export const SUPPORT_EMAIL = null;

/**
 * The App Store's numeric id for Extract Press (App Store Connect → the app
 * record → Apple ID; Uryu, 2026-11-20). 6c's Review on App Store and Share
 * the app need it; while null, neither row is shown.
 * Until the app is on sale, both lead to the App Store's "not found" page:
 * that is expected. Check both again once it is public.
 */
export const APP_STORE_ID = '6835357246';

/** The app's page: what Share the app hands to the share sheet. */
export const appStoreUrl = (id) => `https://apps.apple.com/app/id${id}`;
/** The App Store's write-a-review sheet. iOS opens apps.apple.com links in the App Store app. */
export const appStoreReviewUrl = (id) => `https://apps.apple.com/app/id${id}?action=write-review`;
