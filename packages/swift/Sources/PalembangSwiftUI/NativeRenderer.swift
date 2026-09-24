// Builds a RenderPlan from canonical PalembangKit data, and draws one with
// Core Graphics.
//
// # Chosen rendering path (see docs/specification.md section 16.3 and
//   AGENTS.md "Implementation work")
//
// SwiftUI's high-level gradient shading styles (`GraphicsContext`'s
// `.radialGradient`/`.linearGradient`, or the `RadialGradient`/
// `LinearGradient` views) only accept a center/radius or two endpoints —
// there is no documented way to hand them an arbitrary affine transform, and
// Apple does not document whether the `GraphicsContext.transform` CTM is
// honored anisotropically (i.e. whether a sheared/non-uniform-scale CTM
// turns a "radial" gradient into the ellipse the Figma transform requires,
// as opposed to the API normalizing it back to a circle in device space).
// The Figma transforms in CanonicalTokens are exactly this kind of arbitrary
// affine map (rotation + shear + non-uniform scale; see
// docs/specification.md section 6) — a design invariant, not
// simplifiable — so this renderer does not build on that undocumented
// behavior.
//
// Core Graphics' `CGContext.drawRadialGradient`/`drawLinearGradient`, by
// contrast, are explicitly documented to paint the gradient's family of
// circles/lines in the *current user space* established by the CTM at draw
// time: concatenating an arbitrary `CGAffineTransform` (including shear and
// non-uniform scale) before drawing a "circular" radial gradient produces
// exactly the sheared ellipse the transform implies. That is precisely how
// SVG's own `gradientUnits="objectBoundingBox"` + `gradientTransform`
// (which Renderer.swift already targets, byte-for-byte, in PalembangKit)
// is itself defined to behave. Using the same CGAffineTransform numbers as
// PalembangKit's SVG output (see GradientTransform.swift) against
// `CGContext` therefore reproduces the identical geometry through a
// different, native drawing backend — not an approximation of it.
//
// `GraphicsContext.withCGContext` (which would let a SwiftUI `Canvas` reach
// this same Core Graphics API) requires iOS 16 / macOS 13, above this
// package's iOS 15 / macOS 12 floor (Package.swift). Rather than raise the
// deployment target for convenience (AGENTS.md / task instructions forbid
// this without a release-blocking reason), PalembangCanvas.swift instead
// wraps a small `UIView`/`NSView` subclass whose `draw(rect:)` gets a plain
// `CGContext` directly — the smallest native stack available at the
// existing floor that can reproduce the canonical geometry exactly. No
// Metal, no third-party dependency, no WebView.
import CoreGraphics
import PalembangKit

package enum NativeRenderer {
    /// Builds the render plan for `size` from canonical PalembangKit data
    /// plus palette/haze overrides, mirroring Renderer.renderSVG's own
    /// geometry and haze-alpha rules (docs/specification.md sections 6.3
    /// and 7.1) exactly.
    package static func makePlan(
        size: CGSize,
        palette: [String: String],
        hazeMiddleAlpha: Double?
    ) -> RenderPlan {
        let width = Double(size.width)
        let height = Double(size.height)
        let half = CGFloat(height / 2)

        let upperRect = CGRect(x: 0, y: 0, width: size.width, height: half)
        let lowerRect = CGRect(x: 0, y: half, width: size.width, height: size.height - half)

        let resolvedHazeAlpha: Double
        if let explicit = hazeMiddleAlpha {
            resolvedHazeAlpha = explicit
        } else if width == 320, height == 320 {
            // The 320x320 Figma source exception (docs/specification.md 6.3),
            // same rule Renderer.swift applies for the SVG path.
            resolvedHazeAlpha = CanonicalTokens.seaHazeSmall320MiddleStopAlpha
        } else {
            resolvedHazeAlpha = CanonicalTokens.seaHaze.stops[1].alpha
        }

        let sky = paint(id: "sky", kind: .radial, rect: upperRect, source: CanonicalTokens.sky, palette: palette, middleStopOverride: nil)
        let base = paint(id: "sea-base", kind: .radial, rect: lowerRect, source: CanonicalTokens.seaBase, palette: palette, middleStopOverride: nil)
        let haze = paint(id: "sea-haze", kind: .linear, rect: lowerRect, source: CanonicalTokens.seaHaze, palette: palette, middleStopOverride: resolvedHazeAlpha)
        let glow = paint(id: "sea-glow", kind: .radial, rect: lowerRect, source: CanonicalTokens.seaGlow, palette: palette, middleStopOverride: nil)

        return RenderPlan(size: size, paints: [sky, base, haze, glow])
    }

    /// Executes a RenderPlan against a CGContext. Draw order is the plan's
    /// paint order (canonical layer order); each paint is clipped to its own
    /// half-rectangle so the sky paint can never bleed into the lower half
    /// or vice versa (docs/specification.md section 4).
    package static func draw(_ plan: RenderPlan, in context: CGContext) {
        for paint in plan.paints {
            draw(paint, in: context)
        }
    }

    private static func draw(_ paint: RenderPlanPaint, in context: CGContext) {
        guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) else { return }
        // Colors are built explicitly in the sRGB color space (docs/specification.md
        // section 5 stores sRGB hex values) rather than the context's default/
        // extended working space, so canonical hues are not silently
        // reinterpreted under a different color space (see task notes on
        // color handling).
        let colors = paint.stops.map { stop -> CGColor in
            CGColor(colorSpace: colorSpace, components: [stop.red, stop.green, stop.blue, stop.alpha])!
        }
        let locations = paint.stops.map { CGFloat($0.location) }
        guard let gradient = CGGradient(colorsSpace: colorSpace, colors: colors as CFArray, locations: locations) else {
            return
        }

        context.saveGState()
        // Clip in the view's own (pre-transform) coordinate space, before
        // concatenating the gradient's CTM below.
        context.clip(to: paint.rect)
        context.concatenate(paint.transform)
        // Layer opacity (e.g. haze 0.45, glow 0.6) multiplies with each
        // stop's own alpha exactly as SVG's per-<rect> `opacity` attribute
        // multiplies with `stop-opacity` — same effective-alpha semantics as
        // Renderer.swift's SVG output for the same paint.
        context.setAlpha(CGFloat(paint.opacity))

        let options: CGGradientDrawingOptions = [.drawsBeforeStartLocation, .drawsAfterEndLocation]
        switch paint.kind {
        case .radial:
            // Matches SVG's default radial gradient geometry exactly: a
            // single circle centered at (0.5, 0.5) growing from radius 0 to
            // radius 0.5 in unit (objectBoundingBox) space, with no focal
            // offset (fx/fy default to cx/cy).
            context.drawRadialGradient(
                gradient,
                startCenter: CGPoint(x: 0.5, y: 0.5), startRadius: 0,
                endCenter: CGPoint(x: 0.5, y: 0.5), endRadius: 0.5,
                options: options
            )
        case .linear:
            // Matches SVG's default linear gradient geometry: (0, 0.5) -> (1, 0.5)
            // in unit (objectBoundingBox) space.
            context.drawLinearGradient(
                gradient,
                start: CGPoint(x: 0, y: 0.5),
                end: CGPoint(x: 1, y: 0.5),
                options: options
            )
        }
        context.restoreGState()
    }

    private static func paint(
        id: String,
        kind: NativePaintKind,
        rect: CGRect,
        source: GradientPaint,
        palette: [String: String],
        middleStopOverride: Double?
    ) -> RenderPlanPaint {
        // Should never fail for canonical, fixed, verified-invertible
        // transforms (the same data Renderer.swift inverts successfully for
        // every existing SVG parity fixture). Falling back to identity here
        // is a defensive last resort, analogous to PalembangError
        // .renderingFailed's "should never happen" role in PalembangKit —
        // draw(rect:) itself cannot propagate a thrown error.
        let values = (try? GradientTransform.inverseAffine(source.transform)) ?? [1, 0, 0, 1, 0, 0]
        let gradientSpaceTransform = CGAffineTransform(
            a: CGFloat(values[0]), b: CGFloat(values[1]),
            c: CGFloat(values[2]), d: CGFloat(values[3]),
            tx: CGFloat(values[4]), ty: CGFloat(values[5])
        )

        // objectBoundingBox mapping: unit square -> `rect` (scale by rect
        // size, then translate by rect origin) — see docs/specification.md
        // section 7.1's upper/lower half-rect reconstruction rule.
        let boundingBoxTransform = CGAffineTransform(scaleX: rect.width, y: rect.height)
            .concatenating(CGAffineTransform(translationX: rect.origin.x, y: rect.origin.y))
        let transform = gradientSpaceTransform.concatenating(boundingBoxTransform)

        let stops: [NativeStop] = source.stops.enumerated().map { index, stop in
            let alpha = (index == 1 && middleStopOverride != nil) ? middleStopOverride! : stop.alpha
            let hex = palette[stop.colorToken] ?? CanonicalTokens.palette[stop.colorToken]!
            let (r, g, b) = ColorHex.components(hex)
            return NativeStop(location: stop.position, red: r, green: g, blue: b, alpha: alpha)
        }

        return RenderPlanPaint(
            id: id,
            kind: kind,
            rect: rect,
            gradientSpaceTransform: gradientSpaceTransform,
            transform: transform,
            opacity: source.opacity,
            stops: stops
        )
    }
}
