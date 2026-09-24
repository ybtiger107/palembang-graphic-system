// The native renderer's intermediate data model: a deterministic, pure
// description of what to draw for a given target size, independent of any
// drawing API. NativeRenderer.swift turns canonical PalembangKit data into a
// RenderPlan; PalembangCanvas.swift is the only file that actually draws one
// with Core Graphics. Keeping this split lets PalembangSwiftUITests assert
// exact geometry/transform/stop/opacity values (docs/specification.md
// sections 6 and 17) without needing a window, a view hierarchy, or pixel
// comparison — see AGENTS-facing task notes in PalembangSwiftUI's README
// section "Native validation strategy".
import CoreGraphics

package enum NativePaintKind: Equatable {
    case radial
    case linear
}

package struct NativeStop: Equatable {
    package let location: Double
    package let red: Double
    package let green: Double
    package let blue: Double
    package let alpha: Double
}

package struct RenderPlanPaint: Equatable {
    /// Matches the SVG renderer's gradient ids ("sky", "sea-base",
    /// "sea-haze", "sea-glow") purely for readability in tests/debugging.
    package let id: String
    package let kind: NativePaintKind
    /// The half-rectangle this paint is clipped to, in the view's own
    /// (top-left origin, y-down) local coordinate space.
    package let rect: CGRect
    /// The canonical Figma transform, inverted (see GradientTransform.swift)
    /// — independent of `rect`/target size. This is the exact same
    /// [a, b, c, d, e, f] PalembangKit's Renderer.swift embeds as an SVG
    /// `gradientTransform="matrix(...)"` for the same paint, expressed as a
    /// CGAffineTransform (whose (a, b, c, d, tx, ty) fields are the SVG
    /// matrix(a b c d e f) convention verbatim — no reordering needed).
    /// Exposed separately from `transform` so tests can confirm this half of
    /// the math never varies with target size, only `transform` does.
    package let gradientSpaceTransform: CGAffineTransform
    /// `gradientSpaceTransform` composed with the objectBoundingBox mapping
    /// of the unit square onto `rect` (scale by rect size, then translate by
    /// rect origin) — the full CTM a renderer concatenates before drawing
    /// the fixed unit-space gradient geometry (radial: center (0.5, 0.5),
    /// radius 0.5; linear: (0, 0.5) -> (1, 0.5)). See NativeRenderer.swift.
    package let transform: CGAffineTransform
    package let opacity: Double
    package let stops: [NativeStop]
}

package struct RenderPlan: Equatable {
    package let size: CGSize
    /// Always exactly 4 paints, in canonical layer order: sky, sea base,
    /// silver haze, teal glow (docs/specification.md section 4).
    package let paints: [RenderPlanPaint]
}
