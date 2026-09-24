/// PalembangKit's entire public entry point.
///
/// ```swift
/// import PalembangKit
///
/// let svg = try Palembang.renderSVG(width: 1920, height: 1080)
/// ```
///
/// Palette override:
///
/// ```swift
/// let svg = try Palembang.renderSVG(
///     width: 1920,
///     height: 1080,
///     palette: [
///         .skyHot: "#D97706",
///         .skyCool: "#64748B",
///     ]
/// )
/// ```
///
/// `renderSVG` reconstructs both canonical half-height fields for the given
/// dimensions from the same canonical tokens and gradient math as
/// `implementations/svg/render.py` and `@palembang/core` — it does not crop
/// or stretch a fixed-size asset. It performs no filesystem access, no
/// network access, and no JSON parsing at call time; all canonical data is
/// compiled in from `CanonicalTokens.generated.swift`.
public enum Palembang {
    /// The canonical source palette (docs/specification.md section 5),
    /// keyed by the six replaceable scene-color roles. This is a `let`
    /// dictionary — a Swift value type — so it cannot be mutated in place,
    /// and copying it for a render call never affects this canonical value.
    public static let canonicalPalette: [PalembangPaletteToken: String] = Dictionary(
        uniqueKeysWithValues: PalembangPaletteToken.allCases.map { token in
            (token, CanonicalTokens.palette[token.rawValue]!)
        }
    )

    /// Render canonical Palembang as a standalone SVG string.
    ///
    /// - Parameters:
    ///   - width: Output width in user units. Must be finite and > 0.
    ///   - height: Output height in user units. Must be finite and > 0.
    ///   - palette: Partial overrides for any of the six scene-color roles.
    ///     Unlisted tokens keep their canonical color. Values must be
    ///     `#RRGGBB` hex strings.
    ///   - attribution: When `true` (the default), embeds a CC BY 4.0
    ///     attribution `<metadata>` element in the SVG. Setting this to
    ///     `false` removes only that embedded notice — it does not remove
    ///     the CC BY 4.0 attribution obligation for the generated graphic;
    ///     see VISUAL-LICENSE.md.
    ///   - hazeMiddleAlpha: An explicit override for the silver haze
    ///     gradient's middle-stop alpha, from `0` through `1`. When omitted,
    ///     the canonical behavior applies, including the established
    ///     320x320 source exception (docs/specification.md section 6.3).
    /// - Throws: `PalembangError` for any invalid input.
    public static func renderSVG(
        width: Double,
        height: Double,
        palette: [PalembangPaletteToken: String] = [:],
        attribution: Bool = true,
        hazeMiddleAlpha: Double? = nil
    ) throws -> String {
        guard width.isFinite, width > 0 else {
            throw PalembangError.invalidWidth(width)
        }
        guard height.isFinite, height > 0 else {
            throw PalembangError.invalidHeight(height)
        }
        for (token, value) in palette {
            guard isValidHexColor(value) else {
                throw PalembangError.invalidColor(token: token, value: value)
            }
        }
        if let alpha = hazeMiddleAlpha {
            guard alpha.isFinite, alpha >= 0, alpha <= 1 else {
                throw PalembangError.invalidHazeMiddleAlpha(alpha)
            }
        }

        // CanonicalTokens.palette is copied by value here; overriding a key
        // on `mergedPalette` can never mutate CanonicalTokens.palette or
        // canonicalPalette used by any other call.
        var mergedPalette = CanonicalTokens.palette
        for (token, value) in palette {
            mergedPalette[token.rawValue] = value
        }

        return try Renderer.renderSVG(
            palette: mergedPalette,
            width: width,
            height: height,
            attribution: attribution,
            hazeMiddleAlpha: hazeMiddleAlpha
        )
    }

    private static func isValidHexColor(_ value: String) -> Bool {
        let bytes = Array(value.utf8)
        guard bytes.count == 7, bytes[0] == UInt8(ascii: "#") else { return false }
        return bytes.dropFirst().allSatisfy { byte in
            (byte >= UInt8(ascii: "0") && byte <= UInt8(ascii: "9"))
                || (byte >= UInt8(ascii: "A") && byte <= UInt8(ascii: "F"))
                || (byte >= UInt8(ascii: "a") && byte <= UInt8(ascii: "f"))
        }
    }
}
