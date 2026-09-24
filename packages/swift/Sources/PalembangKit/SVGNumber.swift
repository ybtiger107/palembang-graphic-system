// Deterministic SVG number formatting.
//
// implementations/svg/render.py and implementations/web/palembang.js both
// serialize numbers with their host language's own "shortest round-trip"
// double-to-string conversion (Python's repr(float(...)) trimmed of trailing
// zeros; JS's Number.prototype.toString(), which is ECMA-262's
// Number::toString). Swift's Double.description is also a shortest
// round-trip conversion (guaranteed unique per double since Swift 4.2's
// SwiftDtoa), but Swift's own fixed/exponential formatting thresholds are
// not specified to match JavaScript's.
//
// Rather than trust Swift's default text layout, this formatter only trusts
// Swift for the one thing shortest-round-trip conversion guarantees — the
// correct minimal significant-digit string for a given Double — and then
// re-applies ECMA-262's Number::toString(x, 10) formatting rules on top of
// those digits. That reproduces JS's fixed/exponential decision and digit
// placement exactly, which is what implementations/web/palembang.js and
// packages/core rely on for their own SVG output. See packages/swift/README.md
// for the parity rationale and packages/swift/Tests/PalembangKitTests for
// fixtures captured directly from @palembang/core.
enum SVGNumber {
    static func format(_ value: Double) throws -> String {
        guard value.isFinite else {
            throw PalembangError.renderingFailed("non-finite number: \(value)")
        }
        if value == 0 { return "0" } // covers -0.0 too, matching formatNumber() in palembang.js

        let negative = value < 0
        let (digits, exponent) = decompose(abs(value).description)
        let body = render(digits: digits, n: exponent)
        return negative ? "-" + body : body
    }

    /// Parse Swift's own `Double.description` (whatever fixed/exponential
    /// form it happens to choose) into (digits, n) such that the magnitude
    /// equals `0.<digits> * 10^n`, with `digits` having no leading or
    /// trailing zeros — the representation ECMA-262 Number::toString builds
    /// its formatting decision on.
    private static func decompose(_ text: String) -> (digits: String, n: Int) {
        var mantissaText = text
        var exponent = 0
        if let eIndex = text.firstIndex(where: { $0 == "e" || $0 == "E" }) {
            mantissaText = String(text[text.startIndex..<eIndex])
            let expText = String(text[text.index(after: eIndex)...])
            exponent = Int(expText) ?? 0
        }

        let pieces = mantissaText.split(separator: ".", maxSplits: 1, omittingEmptySubsequences: false)
        let intPart = String(pieces[0])
        let fracPart = pieces.count > 1 ? String(pieces[1]) : ""

        var digits = intPart + fracPart
        var e0 = exponent - fracPart.count

        while digits.count > 1, digits.first == "0" {
            digits.removeFirst()
        }
        while digits.count > 1, digits.last == "0" {
            digits.removeLast()
            e0 += 1
        }

        let k = digits.count
        return (digits, k + e0)
    }

    /// ECMA-262 Number::toString(x, 10) formatting, given the shortest
    /// significant-digit string `digits` (length k) and exponent `n` such
    /// that the value equals `0.<digits> * 10^n`.
    private static func render(digits: String, n: Int) -> String {
        let k = digits.count

        if k <= n, n <= 21 {
            return digits + String(repeating: "0", count: n - k)
        }
        if n > 0, n <= 21 {
            let splitIndex = digits.index(digits.startIndex, offsetBy: n)
            return String(digits[..<splitIndex]) + "." + String(digits[splitIndex...])
        }
        if n <= 0, n > -6 {
            return "0." + String(repeating: "0", count: -n) + digits
        }

        let e = n - 1
        var mantissa = String(digits.first!)
        if k > 1 {
            mantissa += "." + String(digits.dropFirst())
        }
        let sign = e >= 0 ? "+" : "-"
        return mantissa + "e" + sign + String(abs(e))
    }
}
