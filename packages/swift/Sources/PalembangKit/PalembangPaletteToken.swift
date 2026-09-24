/// The six replaceable scene-color roles of the canonical Palembang system
/// (docs/specification.md section 5/13). Geometry, gradient transforms, stop
/// positions, opacities, and layer order are never exposed here — only the
/// color roles a palette theme is allowed to change.
public enum PalembangPaletteToken: String, CaseIterable, Hashable, Sendable {
    case skyHot = "sky.hot"
    case skyCool = "sky.cool"
    case seaLight = "sea.light"
    case seaDark = "sea.dark"
    case seaHaze = "sea.haze"
    case seaGlow = "sea.glow"
}
