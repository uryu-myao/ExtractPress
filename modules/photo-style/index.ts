import { requireOptionalNativeModule } from 'expo';

/** The style's numbers (src/constants/photoStyle.js holds them). */
export type PhotoStyle = {
  ink: string;
  paper: string;
  contrast: number;
  dither: number;
  longSide: number;
  quality: number;
};

/** Where a cutout runs into the sides of its photo (a held bag's hand is cut off there). */
export type CutoutEdges = { top: boolean; right: boolean; bottom: boolean; left: boolean };

/** Where the cutout sat in its photo: shares of the photo's width and height, from the top left. */
export type CutoutBox = { x: number; y: number; width: number; height: number };

/** box is missing from a build made before 2026-11-25 (Add a bag's lift). */
export type CutoutResult = { found: false } | { found: true; width: number; height: number; edges: CutoutEdges; box?: CutoutBox };

export type CutoutOptions = { smallLongSide: number; quality: number; edgeShare: number; fade: number };

type PhotoStyleModule = {
  original(source: string, original: string, longSide: number, quality: number): Promise<{ width: number; height: number }>;
  cutout(original: string, large: string, small: string, options: CutoutOptions): Promise<CutoutResult>;
  render(source: string, original: string, styled: string, style: PhotoStyle): Promise<{ width: number; height: number }>;
  restyle(original: string, styled: string, style: PhotoStyle): Promise<void>;
};

/**
 * Null on web and in a build made before the module was added (a dev client
 * not rebuilt). Photos then can't be added: the caller says so instead of
 * failing quietly (photoStyleMissing).
 */
const native = requireOptionalNativeModule<PhotoStyleModule>('PhotoStyle');

export const photoStyleAvailable = native != null && typeof native.original === 'function';

/** What to tell the user when the module is missing. */
export const photoStyleMissing = 'Photos need a newer build of the app. Rebuild it (npm run ios:device) and try again.';

if (__DEV__ && !native) console.warn(`[photo-style] native module missing. ${photoStyleMissing}`);

/**
 * Functions added after 2026-11-23 (original, cutout) are missing from a
 * build made before them: say so rather than fail with "not a function".
 */
function has(name: keyof PhotoStyleModule) {
  return native != null && typeof native[name] === 'function';
}

/** Write the picked photo as the kept original: upright, long side at most longSide, JPEG. */
export function writeOriginal(source: string, original: string, longSide: number, quality: number) {
  if (!has('original')) return Promise.reject(new Error(photoStyleMissing));
  return native!.original(source, original, longSide, quality);
}

/** Lift the subject out of a kept original into two HEIC cutouts (modules/photo-style/ios/PhotoCutout.swift). */
export function cutOut(original: string, large: string, small: string, options: CutoutOptions) {
  if (!has('cutout')) return Promise.reject(new Error(photoStyleMissing));
  return native!.cutout(original, large, small, options);
}

/**
 * The duotone house style (2026-11-01). Not called by the app since
 * 2026-11-23 (photos are full colour); kept for the filter or outline to
 * come, and for the dev lab (src/dev/pages/PhotoStylePage.js).
 *
 * Write the original (upright, long side style.longSide) and its styled copy. Both or neither.
 */
export function renderPhoto(source: string, original: string, styled: string, style: PhotoStyle) {
  if (!native) return Promise.reject(new Error(photoStyleMissing));
  return native.render(source, original, styled, style);
}

/** Re-make a styled copy from its original, for a changed style. */
export function restylePhoto(original: string, styled: string, style: PhotoStyle) {
  if (!native) return Promise.reject(new Error(photoStyleMissing));
  return native.restyle(original, styled, style);
}
