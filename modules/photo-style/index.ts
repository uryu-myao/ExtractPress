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

type PhotoStyleModule = {
  render(source: string, original: string, styled: string, style: PhotoStyle): Promise<{ width: number; height: number }>;
  restyle(original: string, styled: string, style: PhotoStyle): Promise<void>;
};

/**
 * Null on web and in a build made before the module was added (a dev client
 * not rebuilt). Photos then can't be added: the caller says so instead of
 * failing quietly (photoStyleMissing).
 */
const native = requireOptionalNativeModule<PhotoStyleModule>('PhotoStyle');

export const photoStyleAvailable = native != null;

/** What to tell the user when the module is missing. */
export const photoStyleMissing = 'Photos need a newer build of the app. Rebuild it (npm run ios:device) and try again.';

if (__DEV__ && !native) console.warn(`[photo-style] native module missing. ${photoStyleMissing}`);

/** Write the original (upright, long side style.longSide) and its styled copy. Both or neither. */
export function renderPhoto(source: string, original: string, styled: string, style: PhotoStyle) {
  if (!native) return Promise.reject(new Error(photoStyleMissing));
  return native.render(source, original, styled, style);
}

/** Re-make a styled copy from its original, for a changed style. */
export function restylePhoto(original: string, styled: string, style: PhotoStyle) {
  if (!native) return Promise.reject(new Error(photoStyleMissing));
  return native.restyle(original, styled, style);
}
