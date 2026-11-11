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
