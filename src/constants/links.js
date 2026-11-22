/**
 * Pages outside the app (6c). One place: fill a URL here and its row appears.
 *
 * A row whose URL is null is not shown (2026-11-09): no dead row, and nothing
 * that opens a 404 in front of App Review (Guideline 2.1).
 *
 * T-18 (2026-11-22): both pages are live on smallpress.app (site/, Cloudflare
 * Workers static assets; `cd site && npx wrangler deploy`). App Store Connect
 * takes both URLs, and Guideline 5.1.1(i) wants the privacy policy inside the
 * app too, so PRIVACY_POLICY_URL must not be null in the submitted build.
 */
export const PRIVACY_POLICY_URL = 'https://smallpress.app/extract-press/privacy';

/**
 * App Store Connect's Support URL (https://smallpress.app/extract-press/support).
 * Null on purpose: no row in 6c leads there; it is entered in App Store
 * Connect only.
 */
export const SUPPORT_URL = null;

/**
 * 6c's Send feedback (Design Round 26 A6, B5): opens Mail to this address,
 * the support page's (smallpress.app/extract-press/support; Uryu,
 * 2026-11-22). The privacy policy describes this row, so it must stay set.
 */
export const SUPPORT_EMAIL = 'hello@smallpress.app';

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
