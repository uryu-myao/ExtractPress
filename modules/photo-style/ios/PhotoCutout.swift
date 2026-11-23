import CoreImage
import CoreImage.CIFilterBuiltins
import ExpoModulesCore
import ImageIO
import Vision

/**
 * The bag lifted out of its photo (2026-11-23, Design Round 31): Vision's
 * foreground mask (VNGenerateForegroundInstanceMaskRequest, iOS 17, the
 * app's minimum), written as HEIC with alpha. RN's <Image> shows alpha HEIC
 * from a file:// URI (checked on the phone, 2026-11-22); a PNG at this size
 * is 1–2 MB, the HEIC about a tenth of that.
 *
 *   cutout(original, large, small, options)
 *     reads a kept original (already upright and sized), finds its
 *     foreground and writes two cutouts, cropped to it: `large` at the
 *     original's scale, `small` with its long side at options.smallLongSide
 *     (the shelf's). Both or neither. Resolves
 *       { found: false }  no subject (nothing written; the app shows the
 *                         rectangular photo)
 *       { found: true, width, height, edges: { top, right, bottom, left } }
 *     edges: the sides of the PHOTO the cutout runs into, where a held bag's
 *     hand is cut off (Round 31, 2a). A side counts when more than
 *     options.edgeShare of it is inside the mask.
 *
 * The fade (Design Round 31 v2, §6, 37i): the straight line where the photo
 * cut the subject is what reads as a severed hand, so it is faded out, once,
 * here. For each side touched, each run of opaque pixels along that side of
 * the cutout fades toward the side over L = options.fade × the cutout's long
 * side (smoothstep), the fade spread L past either end of the run. Only the
 * cut fades: the bag's own sides elsewhere stay sharp (Code's first try
 * faded the whole edge and took bag bottoms with it). Both files carry it.
 *
 * Every foreground instance is kept: Vision returns a bag and the hand
 * holding it as one instance (14 test photos, 2026-11-23), so picking one
 * would not drop the hand anyway.
 *
 * Errors: ERR_PHOTO_READ, ERR_PHOTO_WRITE as the module's others;
 * ERR_CUTOUT when Vision itself fails (not "no subject": that resolves).
 * Vision may not run on the simulator.
 */
struct CutoutOptions: Record {
  /** The small cutout's long side in pixels. */
  @Field var smallLongSide: Double = 400
  /** HEIC quality, 0–1. */
  @Field var quality: Double = 0.8
  /** The share of a photo's side the mask must cover for `edges` to count it. */
  @Field var edgeShare: Double = 0.02
  /** The fade's length, a share of the cutout's long side (0 for none). */
  @Field var fade: Double = 0.08
}

func makeCutout(_ context: CIContext, original: String, large: String, small: String, options: CutoutOptions) throws -> [String: Any] {
  let source = fileURL(original)
  guard let input = CIImage(contentsOf: source), let cg = context.createCGImage(input, from: input.extent) else {
    throw Exception(name: "ERR_PHOTO_READ", description: "The original photo couldn't be read.")
  }
  let handler = VNImageRequestHandler(cgImage: cg)
  let request = VNGenerateForegroundInstanceMaskRequest()
  let observation: VNInstanceMaskObservation
  do {
    try handler.perform([request])
    guard let first = request.results?.first, !first.allInstances.isEmpty else { return ["found": false] }
    observation = first
  } catch {
    throw Exception(name: "ERR_CUTOUT", description: "The bag couldn't be lifted out: \(error.localizedDescription)")
  }

  let masked: CVPixelBuffer
  let mask: CVPixelBuffer
  do {
    masked = try observation.generateMaskedImage(ofInstances: observation.allInstances, from: handler, croppedToInstancesExtent: true)
    mask = try observation.generateScaledMaskForImage(forInstances: observation.allInstances, from: handler)
  } catch {
    throw Exception(name: "ERR_CUTOUT", description: "The bag couldn't be lifted out: \(error.localizedDescription)")
  }

  let edges = edgesTouched(mask, share: options.edgeShare)
  let cut = faded(CIImage(cvPixelBuffer: masked), alpha: masked, edges: edges, share: options.fade)
  try writeHEIC(context, cut, to: fileURL(large), quality: options.quality)
  do {
    try writeHEIC(context, scaled(cut, longSide: options.smallLongSide), to: fileURL(small), quality: options.quality)
  } catch {
    try? FileManager.default.removeItem(at: fileURL(large))
    throw error
  }
  return [
    "found": true,
    "width": Int(cut.extent.width.rounded()),
    "height": Int(cut.extent.height.rounded()),
    "edges": edges,
  ]
}

private func writeHEIC(_ context: CIContext, _ image: CIImage, to url: URL, quality: Double) throws {
  let options = [kCGImageDestinationLossyCompressionQuality as CIImageRepresentationOption: quality]
  do {
    try context.writeHEIFRepresentation(of: image, to: url, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!, options: options)
  } catch {
    throw Exception(name: "ERR_PHOTO_WRITE", description: "The cutout couldn't be saved: \(error.localizedDescription)")
  }
}

/** Which sides of the photo the mask (one float per pixel, 0–1) runs into. */
private func edgesTouched(_ mask: CVPixelBuffer, share: Double) -> [String: Bool] {
  CVPixelBufferLockBaseAddress(mask, .readOnly)
  defer { CVPixelBufferUnlockBaseAddress(mask, .readOnly) }
  let width = CVPixelBufferGetWidth(mask)
  let height = CVPixelBufferGetHeight(mask)
  let row = CVPixelBufferGetBytesPerRow(mask)
  guard width > 0, height > 0, let base = CVPixelBufferGetBaseAddress(mask) else {
    return ["top": false, "right": false, "bottom": false, "left": false]
  }
  func inside(_ x: Int, _ y: Int) -> Bool {
    base.advanced(by: y * row + x * MemoryLayout<Float>.size).assumingMemoryBound(to: Float.self).pointee > 0.5
  }
  func covers(_ count: Int, of length: Int) -> Bool { Double(count) / Double(length) > share }
  // Buffer rows run top to bottom.
  return [
    "top": covers((0..<width).filter { inside($0, 0) }.count, of: width),
    "bottom": covers((0..<width).filter { inside($0, height - 1) }.count, of: width),
    "left": covers((0..<height).filter { inside(0, $0) }.count, of: height),
    "right": covers((0..<height).filter { inside(width - 1, $0) }.count, of: height),
  ]
}

/**
 * The cut faded out (see the top of this file). `alpha` is the cutout's own
 * BGRA buffer, read for where it is opaque along each touched side. The fade
 * is a grey mask the cutout is blended through, so Core Image handles the
 * premultiplied alpha.
 */
private func faded(_ cut: CIImage, alpha buffer: CVPixelBuffer, edges: [String: Bool], share: Double) -> CIImage {
  let width = CVPixelBufferGetWidth(buffer)
  let height = CVPixelBufferGetHeight(buffer)
  let length = Int((Double(max(width, height)) * share).rounded())
  guard share > 0, length > 1, edges.values.contains(true) else { return cut }

  CVPixelBufferLockBaseAddress(buffer, .readOnly)
  let row = CVPixelBufferGetBytesPerRow(buffer)
  guard let base = CVPixelBufferGetBaseAddress(buffer)?.assumingMemoryBound(to: UInt8.self) else {
    CVPixelBufferUnlockBaseAddress(buffer, .readOnly)
    return cut
  }
  // 32BGRA: alpha is the fourth byte. Rows run top to bottom.
  func opaque(_ x: Int, _ y: Int) -> Bool { base[y * row + x * 4 + 3] > 127 }
  func runs(_ count: Int, _ at: (Int) -> Bool) -> [ClosedRange<Int>] {
    var found: [ClosedRange<Int>] = []
    var start: Int? = nil
    for i in 0...count {
      let on = i < count && at(i)
      if on, start == nil { start = i }
      if !on, let s = start { found.append(s...(i - 1)); start = nil }
    }
    return found
  }
  let sides: [(name: String, along: Int, runs: [ClosedRange<Int>])] = [
    ("top", width, runs(width) { opaque($0, 0) }),
    ("bottom", width, runs(width) { opaque($0, height - 1) }),
    ("left", height, runs(height) { opaque(0, $0) }),
    ("right", height, runs(height) { opaque(width - 1, $0) }),
  ]
  CVPixelBufferUnlockBaseAddress(buffer, .readOnly)

  var factor = [UInt8](repeating: 255, count: width * height)
  for side in sides where edges[side.name] == true {
    for run in side.runs {
      let from = max(0, run.lowerBound - length)
      let to = min(side.along - 1, run.upperBound + length)
      for depth in 0..<min(length, side.name == "top" || side.name == "bottom" ? height : width) {
        let t = Double(depth) / Double(length)
        let value = UInt8((t * t * (3 - 2 * t) * 255).rounded())
        for along in from...to {
          let (x, y): (Int, Int)
          switch side.name {
          case "top": (x, y) = (along, depth)
          case "bottom": (x, y) = (along, height - 1 - depth)
          case "left": (x, y) = (depth, along)
          default: (x, y) = (width - 1 - depth, along)
          }
          let i = y * width + x
          if value < factor[i] { factor[i] = value }
        }
      }
    }
  }

  let data = Data(factor) as CFData
  guard let provider = CGDataProvider(data: data),
        let grey = CGImage(width: width, height: height, bitsPerComponent: 8, bitsPerPixel: 8, bytesPerRow: width,
                           space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue),
                           provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent)
  else { return cut }
  let blend = CIFilter.blendWithMask()
  blend.inputImage = cut
  blend.backgroundImage = CIImage.empty()
  blend.maskImage = CIImage(cgImage: grey)
  return (blend.outputImage ?? cut).cropped(to: cut.extent)
}
