/**
 * The house style every photo is shown in (Uryu, 2026-11-01): the one place
 * its numbers live, as DNA_TUNING is for Taste DNA. They will be tuned; never
 * scatter them. Applied on the phone by modules/photo-style (Core Image),
 * which takes them on every call, so changing one needs no native rebuild.
 *
 * CHANGING THESE DOES NOT CHANGE THE PHOTOS ALREADY KEPT. Their styled copies
 * stay in the old style, and old and new then sit side by side. Every
 * original is kept (data/photos.ts), so they can all be re-made: run
 * restyleAll() (data/photos.ts) after a change.
 *
 *   ink, paper  the duotone's two ends, dark and light. PROVISIONAL: the
 *               app's ink and ground (Design Round 19, A1 sets them)
 *   contrast    the grey before the duotone; 1 leaves it, above 1 spreads it
 *   dither      CIDither's intensity, 0 for none; 0.12 reads as a fine grain
 *               and keeps 9pt type readable (tested 2026-11-01). Raises the
 *               styled JPEG's size about 1.8×
 *   longSide    the original's long side, pixels
 *   quality     JPEG quality for both copies
 *
 * The condition on any style (Design Round 19, A1): the words on a bag must
 * stay readable. So a duotone that keeps the tones, never a two-level
 * posterize, which loses small type first.
 */
export const PHOTO_STYLE = {
  ink: '#273D22',
  paper: '#F4EDEA',
  contrast: 1.1,
  dither: 0.12,
  longSide: 1200,
  quality: 0.8,
};
