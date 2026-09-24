// Converts a validated `#RRGGBB` hex string into sRGB unit-interval
// components. This is a rendering-format detail specific to
// PalembangSwiftUI's Core Graphics path — it is not canonical Palembang
// data (the canonical data stays hex strings, exactly as
// CanonicalTokens.palette and tokens/palembang.v1.json store it; see
// AGENTS.md "Canonical invariants"). Every caller is expected to pass an
// already-validated string (either a canonical constant, or a value that
// has passed PalembangValidation.isValidHexColor via PalembangView's
// boundary — see PalembangView.swift), so this does not re-validate.
package enum ColorHex {
    /// Parses `#RRGGBB` into `(red, green, blue)` in `0...1`.
    package static func components(_ hex: String) -> (red: Double, green: Double, blue: Double) {
        let chars = Array(hex.utf8)
        // chars[0] is "#"; guarded by the precondition below.
        precondition(
            chars.count == 7 && chars[0] == UInt8(ascii: "#"),
            "ColorHex.components requires an already-validated #RRGGBB string (got \"\(hex)\")"
        )
        func byte(_ hi: UInt8, _ lo: UInt8) -> Double {
            Double(nibble(hi) * 16 + nibble(lo)) / 255.0
        }
        func nibble(_ ascii: UInt8) -> Int {
            switch ascii {
            case UInt8(ascii: "0")...UInt8(ascii: "9"): return Int(ascii - UInt8(ascii: "0"))
            case UInt8(ascii: "A")...UInt8(ascii: "F"): return Int(ascii - UInt8(ascii: "A")) + 10
            case UInt8(ascii: "a")...UInt8(ascii: "f"): return Int(ascii - UInt8(ascii: "a")) + 10
            default:
                preconditionFailure("ColorHex.components requires an already-validated #RRGGBB string")
            }
        }
        let r = byte(chars[1], chars[2])
        let g = byte(chars[3], chars[4])
        let b = byte(chars[5], chars[6])
        return (r, g, b)
    }
}
