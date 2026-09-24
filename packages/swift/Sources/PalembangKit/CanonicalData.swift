// Internal data model for the canonical Palembang paint definitions.
//
// PalembangKit's public surface remains just Palembang.renderSVG,
// PalembangPaletteToken, and PalembangError (see Palembang.swift). These
// shapes are `package`-visible (Swift 5.9 package access control), not
// `public`: that lets PalembangSwiftUI (packages/swift/Sources/PalembangSwiftUI),
// which shares this Swift package/manifest, consume the exact same canonical
// data and transform math as this file's Renderer.swift consumer, without
// widening PalembangKit's public API surface or duplicating a second copy of
// the canonical dataset. See docs/implementation-guide.md section 4 and
// packages/swift/README-SwiftUI.md for the sharing rationale.

/// A Figma normalized gradient transform, stored as the exact
/// shape-space -> gradient-space affine matrix rows extracted from
/// Palembang.fig (see docs/specification.md section 6). Row order matches
/// tokens/palembang.v1.json: [m00, m01, m02] and [m10, m11, m12].
package struct AffineTransform: Equatable {
    package let m00: Double
    package let m01: Double
    package let m02: Double
    package let m10: Double
    package let m11: Double
    package let m12: Double
}

package enum GradientKind: Equatable {
    case radial
    case linear
}

package struct GradientStop: Equatable {
    package let position: Double
    package let colorToken: String
    package let alpha: Double
}

package struct GradientPaint: Equatable {
    package let kind: GradientKind
    package let opacity: Double
    package let transform: AffineTransform
    package let stops: [GradientStop]
}
