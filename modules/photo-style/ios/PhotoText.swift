import CoreGraphics
import ExpoModulesCore
import ImageIO
import Vision

/**
 * The text on a bag's photo, for Add a bag's candidates (Uryu's brief,
 * 2026-11-26; src/data/labelText.ts keeps the lines worth offering).
 *
 *   text(original)
 *     reads the kept or pending original (upright, long side 1200: the
 *     photo itself, not the cutout, which garbles letters at its cut) with
 *     VNRecognizeTextRequest: .accurate, ja-JP and en-US named (not left to
 *     detection), language correction on (measured on 8 real bags: it fixes
 *     katakana, プラジル → ブラジル, and leaves the brand names alone).
 *     Resolves [{ text, confidence, height }], one per line Vision found:
 *     its top candidate, that candidate's confidence (0.3 / 0.5 / 1.0 in
 *     practice) and the line's height as a share of the photo's.
 *
 * Its own function, never part of cutout() (PhotoCutout.swift): the app runs
 * the two side by side on the same photo, and this one can be removed alone.
 *
 * Errors: ERR_PHOTO_READ as the module's others; ERR_TEXT when Vision fails.
 */
func readText(_ original: String) throws -> [[String: Any]] {
  guard let source = CGImageSourceCreateWithURL(fileURL(original) as CFURL, nil),
        let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
    throw Exception(name: "ERR_PHOTO_READ", description: "The original photo couldn't be read.")
  }
  let request = VNRecognizeTextRequest()
  request.recognitionLevel = .accurate
  request.recognitionLanguages = ["ja-JP", "en-US"]
  request.usesLanguageCorrection = true
  do {
    try VNImageRequestHandler(cgImage: image).perform([request])
  } catch {
    throw Exception(name: "ERR_TEXT", description: "The text couldn't be read: \(error.localizedDescription)")
  }
  return (request.results ?? []).compactMap { observation in
    guard let best = observation.topCandidates(1).first else { return nil }
    return ["text": best.string, "confidence": Double(best.confidence), "height": Double(observation.boundingBox.height)]
  }
}
