// Shared input-validation rules for the canonical Palembang palette
// contract (docs/specification.md section 13). `package`-visible so
// PalembangSwiftUI's own configuration boundary (packages/swift/README-SwiftUI.md)
// can enforce the exact same #RRGGBB / haze-alpha rules as
// Palembang.renderSVG without reimplementing them — see Palembang.swift.
package enum PalembangValidation {
    /// Strict `#RRGGBB` validation: a `#` followed by exactly six ASCII hex
    /// digits. No CSS named colors, no `#RGB` shorthand, no alpha channel.
    package static func isValidHexColor(_ value: String) -> Bool {
        let bytes = Array(value.utf8)
        guard bytes.count == 7, bytes[0] == UInt8(ascii: "#") else { return false }
        return bytes.dropFirst().allSatisfy { byte in
            (byte >= UInt8(ascii: "0") && byte <= UInt8(ascii: "9"))
                || (byte >= UInt8(ascii: "A") && byte <= UInt8(ascii: "F"))
                || (byte >= UInt8(ascii: "a") && byte <= UInt8(ascii: "f"))
        }
    }

    /// `hazeMiddleAlpha` must be finite and within `0...1`.
    package static func isValidHazeMiddleAlpha(_ value: Double) -> Bool {
        value.isFinite && value >= 0 && value <= 1
    }
}

/// Merges palette overrides onto the canonical palette (docs/specification.md
/// section 13). `package`-visible so PalembangSwiftUI resolves a palette the
/// exact same way Palembang.renderSVG does, from the same
/// CanonicalTokens.palette dictionary, rather than a second copy.
package enum PalembangPalette {
    package static func merged(overrides: [PalembangPaletteToken: String]) -> [String: String] {
        var merged = CanonicalTokens.palette
        for (token, value) in overrides {
            merged[token.rawValue] = value
        }
        return merged
    }
}
