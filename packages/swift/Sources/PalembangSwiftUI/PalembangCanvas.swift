// The SwiftUI <-> Core Graphics bridge. See NativeRenderer.swift for why
// this is a plain UIView/NSView `draw(rect:)` rather than a SwiftUI `Canvas`.
//
// Retina/scale behavior: UIView/NSView drawing is specified in points, not
// device pixels — the system supplies a CGContext whose CTM already accounts
// for the view's backing/contentScaleFactor, so this file never reads or
// multiplies by scale itself. That is what makes the view render sharply on
// Retina displays without a caller supplying pixel dimensions (see
// docs/specification.md section 16.3 and the task's Retina/scale notes).
//
// No cached bitmap is kept across resizes/palette changes: every draw(rect:)
// rebuilds the RenderPlan from the view's current bounds and current
// palette/haze fields, so there is no stale-dimension or stale-color state
// to leak (see NativeRenderer.makePlan, which allocates no shared/global
// state of its own).
import SwiftUI
import PalembangKit

#if canImport(UIKit)
import UIKit

final class PalembangDrawingView: UIView {
    var resolvedPalette: [String: String] = CanonicalTokens.palette
    var hazeMiddleAlpha: Double?

    override init(frame: CGRect) {
        super.init(frame: frame)
        contentMode = .redraw // redraw on every bounds change instead of stretching a cached bitmap
        // The sky and sea-base paints both use pad-extended, fully opaque
        // stops that cover their entire half-rect, so the whole view is
        // always fully painted before the haze/glow layers composite on top.
        isOpaque = true
    }

    required init?(coder: NSCoder) { fatalError("PalembangDrawingView does not support Interface Builder") }

    override func draw(_ rect: CGRect) {
        guard let context = UIGraphicsGetCurrentContext() else { return }
        let plan = NativeRenderer.makePlan(size: bounds.size, palette: resolvedPalette, hazeMiddleAlpha: hazeMiddleAlpha)
        NativeRenderer.draw(plan, in: context)
    }
}

struct PalembangCanvas: UIViewRepresentable {
    let palette: [PalembangPaletteToken: String]
    let hazeMiddleAlpha: Double?

    func makeUIView(context: Context) -> PalembangDrawingView {
        let view = PalembangDrawingView()
        apply(to: view)
        return view
    }

    func updateUIView(_ uiView: PalembangDrawingView, context: Context) {
        apply(to: uiView)
    }

    private func apply(to view: PalembangDrawingView) {
        view.resolvedPalette = PalembangPalette.merged(overrides: palette)
        view.hazeMiddleAlpha = hazeMiddleAlpha
        view.setNeedsDisplay()
    }
}

#elseif canImport(AppKit)
import AppKit

final class PalembangDrawingView: NSView {
    var resolvedPalette: [String: String] = CanonicalTokens.palette
    var hazeMiddleAlpha: Double?

    // Top-left origin, y-down — matches this renderer's rect math
    // (upper/lower half rects, docs/specification.md section 7.1) and
    // PalembangDrawingView's UIKit counterpart, so NativeRenderer's geometry
    // needs no platform-specific flip.
    override var isFlipped: Bool { true }

    override func draw(_ dirtyRect: NSRect) {
        guard let context = NSGraphicsContext.current?.cgContext else { return }
        let plan = NativeRenderer.makePlan(size: bounds.size, palette: resolvedPalette, hazeMiddleAlpha: hazeMiddleAlpha)
        NativeRenderer.draw(plan, in: context)
    }

    override func setFrameSize(_ newSize: NSSize) {
        super.setFrameSize(newSize)
        needsDisplay = true
    }
}

struct PalembangCanvas: NSViewRepresentable {
    let palette: [PalembangPaletteToken: String]
    let hazeMiddleAlpha: Double?

    func makeNSView(context: Context) -> PalembangDrawingView {
        let view = PalembangDrawingView()
        apply(to: view)
        return view
    }

    func updateNSView(_ nsView: PalembangDrawingView, context: Context) {
        apply(to: nsView)
    }

    private func apply(to view: PalembangDrawingView) {
        view.resolvedPalette = PalembangPalette.merged(overrides: palette)
        view.hazeMiddleAlpha = hazeMiddleAlpha
        view.needsDisplay = true
    }
}

#else
#error("PalembangSwiftUI requires UIKit or AppKit (iOS 15+ / macOS 12+).")
#endif
