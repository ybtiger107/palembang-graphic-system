// Internal data model for the canonical Palembang paint definitions.
//
// These types are deliberately not public: PalembangKit's public surface is
// Palembang.renderSVG, PalembangPaletteToken, and PalembangError (see
// Palembang.swift). This file only defines the shapes that
// CanonicalTokens.generated.swift is instantiated with and that Renderer.swift
// consumes.

/// A Figma normalized gradient transform, stored as the exact
/// shape-space -> gradient-space affine matrix rows extracted from
/// Palembang.fig (see docs/specification.md section 6). Row order matches
/// tokens/palembang.v1.json: [m00, m01, m02] and [m10, m11, m12].
struct AffineTransform: Equatable {
    let m00: Double
    let m01: Double
    let m02: Double
    let m10: Double
    let m11: Double
    let m12: Double
}

enum GradientKind: Equatable {
    case radial
    case linear
}

struct GradientStop: Equatable {
    let position: Double
    let colorToken: String
    let alpha: Double
}

struct GradientPaint: Equatable {
    let kind: GradientKind
    let opacity: Double
    let transform: AffineTransform
    let stops: [GradientStop]
}
