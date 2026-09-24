/// PalembangSwiftUI's entire public entry point.
///
/// ```swift
/// import SwiftUI
/// import PalembangSwiftUI
///
/// struct ContentView: View {
///     var body: some View {
///         PalembangView()
///             .frame(height: 300)
///     }
/// }
/// ```
///
/// Palette override:
///
/// ```swift
/// PalembangView(
///     palette: [
///         .skyHot: "#D97706",
///         .seaGlow: "#22D3EE",
///     ]
/// )
/// ```
///
/// `PalembangView` reconstructs canonical Palembang natively (Core Graphics
/// under a thin SwiftUI representable — see NativeRenderer.swift) for
/// whatever rectangle SwiftUI proposes: it adopts the size `.frame`,
/// `.aspectRatio`, or the parent layout gives it, redraws on every
/// width/height/orientation change, and never crops or stretches a
/// fixed-size asset (docs/specification.md section 7.1). It performs no
/// WebView/HTML/JS rendering, no filesystem access, and no network access.
///
/// ## Configuration validation
///
/// This initializer never throws (`try` at the call site above would defeat
/// the point of a plain SwiftUI view literal), but it does not silently
/// accept invalid input either: an invalid `#RRGGBB` override or an
/// out-of-range `hazeMiddleAlpha` is a programmer error — the same category
/// PalembangKit's own `Palembang.renderSVG` treats as
/// `PalembangError.invalidColor`/`.invalidHazeMiddleAlpha` — and fails fast
/// via a precondition, using the exact same validation rules
/// (`PalembangValidation`, shared with PalembangKit; see
/// packages/swift/README-SwiftUI.md "Palette validation"). This initializer
/// is meant for literal, compile-time-known overrides.
///
/// If a palette override instead comes from dynamic/runtime data (user
/// input, a remote config, ...), validate it first with
/// ``PalembangView/validate(palette:hazeMiddleAlpha:)``, which throws the
/// same `PalembangError` PalembangKit does, so a bad value can be handled
/// instead of crashing:
///
/// ```swift
/// do {
///     try PalembangView.validate(palette: userPalette)
///     view = PalembangView(palette: userPalette)
/// } catch {
///     // handle PalembangError
/// }
/// ```
import SwiftUI
import PalembangKit

public struct PalembangView: View {
    private let palette: [PalembangPaletteToken: String]
    private let hazeMiddleAlpha: Double?

    /// - Parameters:
    ///   - palette: Partial overrides for any of the six scene-color roles
    ///     (`PalembangPaletteToken`). Unlisted tokens keep their canonical
    ///     color. Values must be `#RRGGBB` — see "Configuration validation"
    ///     above.
    ///   - hazeMiddleAlpha: An explicit override for the silver haze
    ///     gradient's middle-stop alpha, from `0` through `1`. When omitted,
    ///     the canonical behavior applies, including the established
    ///     320x320 source exception (docs/specification.md section 6.3).
    ///
    /// Geometry, gradient transforms, stop positions, and layer order are
    /// canonical and are intentionally not configurable here (AGENTS.md
    /// "Canonical invariants") — only these two color/alpha inputs are.
    public init(
        palette: [PalembangPaletteToken: String] = [:],
        hazeMiddleAlpha: Double? = nil
    ) {
        for (token, value) in palette {
            precondition(
                PalembangValidation.isValidHexColor(value),
                "PalembangView: \(token.rawValue) must be a #RRGGBB color (got \"\(value)\")"
            )
        }
        if let alpha = hazeMiddleAlpha {
            precondition(
                PalembangValidation.isValidHazeMiddleAlpha(alpha),
                "PalembangView: hazeMiddleAlpha must be a finite number from 0 to 1 (got \(alpha))"
            )
        }
        self.palette = palette
        self.hazeMiddleAlpha = hazeMiddleAlpha
    }

    /// Validates a palette/haze override using the exact same rules
    /// `Palembang.renderSVG` and `PalembangView.init` enforce, throwing
    /// `PalembangError` instead of trapping. Use this to check
    /// dynamic/runtime values before constructing a `PalembangView` with
    /// them.
    public static func validate(
        palette: [PalembangPaletteToken: String] = [:],
        hazeMiddleAlpha: Double? = nil
    ) throws {
        for (token, value) in palette {
            guard PalembangValidation.isValidHexColor(value) else {
                throw PalembangError.invalidColor(token: token, value: value)
            }
        }
        if let alpha = hazeMiddleAlpha {
            guard PalembangValidation.isValidHazeMiddleAlpha(alpha) else {
                throw PalembangError.invalidHazeMiddleAlpha(alpha)
            }
        }
    }

    public var body: some View {
        PalembangCanvas(palette: palette, hazeMiddleAlpha: hazeMiddleAlpha)
            // Decorative by default: this is a generated abstract scene, not
            // content with inherent semantic meaning to describe (AGENTS.md
            // doesn't define one, and inventing one is out of scope — see
            // the task's accessibility notes). Callers who do have a
            // meaningful description for a given use (e.g. "sunset over the
            // Musi River" in a specific product context) can opt back in:
            //
            //     PalembangView()
            //         .accessibilityHidden(false)
            //         .accessibilityLabel("...")
            .accessibilityHidden(true)
    }
}
