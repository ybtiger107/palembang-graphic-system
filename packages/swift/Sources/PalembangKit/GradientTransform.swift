// Shared gradient-transform math (docs/specification.md section 6;
// docs/implementation-guide.md section 4).
//
// This inverts a canonical Figma shape-space -> gradient-space affine matrix
// into the gradient-space -> shape-space matrix that a renderer applies on
// top of the unit gradient definition (SVG's objectBoundingBox radial/linear
// gradient, or an equivalent native CTM). Renderer.swift uses this to build
// an SVG `gradientTransform="matrix(...)"`; PalembangSwiftUI's NativeRenderer
// uses the exact same six numbers as a CGAffineTransform(a:b:c:d:tx:ty:)
// concatenated onto a CGContext before drawing the same unit-space gradient
// with Core Graphics. Both call sites share this one implementation instead
// of maintaining separate transform math (see AGENTS.md "Implementation
// work").
package enum GradientTransform {
    /// Inverts `t` and returns `[a, b, c, d, e, f]` such that
    /// `x' = a*x + c*y + e` and `y' = b*x + d*y + f` — SVG's
    /// `matrix(a b c d e f)` convention, which is also exactly
    /// `CGAffineTransform`'s `(a, b, c, d, tx, ty)` field order.
    package static func inverseAffine(_ t: AffineTransform) throws -> [Double] {
        let a = t.m00, b = t.m01, c = t.m02
        let d = t.m10, e = t.m11, f = t.m12
        let determinant = a * e - b * d
        guard abs(determinant) >= 1e-15 else {
            throw PalembangError.renderingFailed("gradient transform is not invertible")
        }

        let row00 = e / determinant
        let row01 = -b / determinant
        let row02 = (b * f - e * c) / determinant
        let row10 = -d / determinant
        let row11 = a / determinant
        let row12 = (d * c - a * f) / determinant
        return [row00, row10, row01, row11, row02, row12]
    }
}
