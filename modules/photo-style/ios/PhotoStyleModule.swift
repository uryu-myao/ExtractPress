import CoreImage
import CoreImage.CIFilterBuiltins
import ExpoModulesCore
import ImageIO

/**
 * The house style for MoreCoffee's photos (Uryu, 2026-11-01): every photo is
 * kept twice, the original and a styled copy, so that side by side they agree
 * with each other and with the app. Core Image, so nothing is added to the
 * bundle (Skia was weighed and not taken, 2026-11-01).
 *
 * The style's numbers come from JS on every call (src/constants/photoStyle.js,
 * the one place they live): changing them needs no native rebuild. Only a new
 * kind of filter does.
 *
 *   render(source, original, styled, style)
 *     reads the picked photo, turns it upright (EXIF orientation), scales its
 *     long side down to style.longSide, writes it as the original JPEG, then
 *     writes the styled copy. Both or neither: if the styled copy fails, the
 *     original just written is removed. Resolves { width, height }.
 *   restyle(original, styled, style)
 *     re-makes a styled copy from a stored original (already upright and
 *     sized): how every photo follows a changed style.
 *
 * The style: grey (saturation 0) at style.contrast, then a duotone mapping
 * dark to style.ink and light to style.paper (CIFalseColor), then a dither of
 * style.dither (CIDither; 0 = none). Never a posterize: it flattens the
 * mid-tones and small type goes first, and a bag photo is mostly type.
 *
 * Metadata: the original keeps only when it was taken (DateTimeOriginal and
 * its offset), a hint to when the bag was bought. Everything else goes: GPS,
 * the device, the lens, the maker's notes. The styled copy keeps nothing.
 *
 * Paths: file URLs or plain paths. Errors: ERR_PHOTO_READ (the source can't
 * be read as an image), ERR_PHOTO_WRITE (a file couldn't be written).
 */
public final class PhotoStyleModule: Module {
  private let context = CIContext()

  public func definition() -> ModuleDefinition {
    Name("PhotoStyle")

    AsyncFunction("render") { (source: String, original: String, styled: String, style: Style) -> [String: Int] in
      guard let input = CIImage(contentsOf: fileURL(source), options: [.applyOrientationProperty: true]) else {
        throw Exception(name: "ERR_PHOTO_READ", description: "The photo couldn't be read.")
      }
      let sized = scaled(input, longSide: style.longSide).settingProperties(takenAt(input.properties))
      try self.write(sized, to: fileURL(original), quality: style.quality)
      do {
        try self.write(styledCopy(sized, style), to: fileURL(styled), quality: style.quality)
      } catch {
        try? FileManager.default.removeItem(at: fileURL(original))
        throw error
      }
      return ["width": Int(sized.extent.width.rounded()), "height": Int(sized.extent.height.rounded())]
    }

    AsyncFunction("restyle") { (original: String, styled: String, style: Style) in
      guard let input = CIImage(contentsOf: fileURL(original)) else {
        throw Exception(name: "ERR_PHOTO_READ", description: "The original photo couldn't be read.")
      }
      try self.write(styledCopy(input, style), to: fileURL(styled), quality: style.quality)
    }
  }

  private func write(_ image: CIImage, to url: URL, quality: Double) throws {
    let options = [kCGImageDestinationLossyCompressionQuality as CIImageRepresentationOption: quality]
    do {
      try context.writeJPEGRepresentation(of: image, to: url, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!, options: options)
    } catch {
      throw Exception(name: "ERR_PHOTO_WRITE", description: "The photo couldn't be saved: \(error.localizedDescription)")
    }
  }
}

struct Style: Record {
  /** The dark end of the duotone, "#RRGGBB". */
  @Field var ink: String = "#273D22"
  /** The light end. */
  @Field var paper: String = "#F4EDEA"
  /** 1 leaves the grey as it is; above 1 spreads it. */
  @Field var contrast: Double = 1
  /** CIDither's intensity, 0 for none. */
  @Field var dither: Double = 0
  /** The original's long side in pixels. */
  @Field var longSide: Double = 1200
  /** JPEG quality, 0–1. */
  @Field var quality: Double = 0.8
}

private func fileURL(_ path: String) -> URL {
  if let url = URL(string: path), url.isFileURL { return url }
  return URL(fileURLWithPath: path)
}

private func scaled(_ image: CIImage, longSide: Double) -> CIImage {
  let longest = max(image.extent.width, image.extent.height)
  guard longest > CGFloat(longSide) else { return image }
  let filter = CIFilter.lanczosScaleTransform()
  filter.inputImage = image
  filter.scale = Float(CGFloat(longSide) / longest)
  filter.aspectRatio = 1
  return filter.outputImage ?? image
}

/** Only when the photo was taken; nothing else of the source's metadata. */
private func takenAt(_ properties: [String: Any]) -> [String: Any] {
  guard let exif = properties[kCGImagePropertyExifDictionary as String] as? [String: Any] else { return [:] }
  var kept: [String: Any] = [:]
  for key in [kCGImagePropertyExifDateTimeOriginal, kCGImagePropertyExifOffsetTimeOriginal] {
    if let value = exif[key as String] { kept[key as String] = value }
  }
  return kept.isEmpty ? [:] : [kCGImagePropertyExifDictionary as String: kept]
}

private func styledCopy(_ image: CIImage, _ style: Style) -> CIImage {
  let grey = CIFilter.colorControls()
  grey.inputImage = image
  grey.saturation = 0
  grey.contrast = Float(style.contrast)
  let duotone = CIFilter.falseColor()
  duotone.inputImage = grey.outputImage
  duotone.color0 = color(style.ink)
  duotone.color1 = color(style.paper)
  var out = duotone.outputImage ?? image
  if style.dither > 0 {
    let dither = CIFilter.dither()
    dither.inputImage = out
    dither.intensity = Float(style.dither)
    out = dither.outputImage ?? out
  }
  // Filters can grow the extent by a pixel at the edges; keep the original's.
  return out.cropped(to: image.extent).settingProperties([:])
}

private func color(_ hex: String) -> CIColor {
  let value = Int(hex.trimmingCharacters(in: CharacterSet(charactersIn: "#")), radix: 16) ?? 0
  return CIColor(
    red: CGFloat((value >> 16) & 0xFF) / 255,
    green: CGFloat((value >> 8) & 0xFF) / 255,
    blue: CGFloat(value & 0xFF) / 255
  )
}
