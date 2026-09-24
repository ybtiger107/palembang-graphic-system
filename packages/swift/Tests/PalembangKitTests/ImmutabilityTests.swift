import XCTest
@testable import PalembangKit

/// Palembang.canonicalPalette and the internal CanonicalTokens are declared
/// as `let` value types (see Palembang.swift / CanonicalData.swift doc
/// comments), so there is no writable singleton/global rendering state to
/// begin with — these tests exist to make that guarantee explicit and to
/// catch a future regression (e.g. someone changing a `let` to a `var`, or
/// introducing a shared mutable cache) rather than to work around a bug
/// found here.
final class ImmutabilityTests: XCTestCase {
    func testCanonicalPaletteMatchesSourceTokens() {
        XCTAssertEqual(Palembang.canonicalPalette[.skyHot], "#DF8117")
        XCTAssertEqual(Palembang.canonicalPalette[.skyCool], "#8198C4")
        XCTAssertEqual(Palembang.canonicalPalette[.seaLight], "#8BA08A")
        XCTAssertEqual(Palembang.canonicalPalette[.seaDark], "#516872")
        XCTAssertEqual(Palembang.canonicalPalette[.seaHaze], "#C0C0C0")
        XCTAssertEqual(Palembang.canonicalPalette[.seaGlow], "#78B6BA")
    }

    func testPaletteOverrideDoesNotMutateCanonicalDefaults() throws {
        let before = Palembang.canonicalPalette
        _ = try Palembang.renderSVG(
            width: 1920,
            height: 1080,
            palette: [.skyHot: "#000000", .seaGlow: "#FFFFFF"]
        )
        XCTAssertEqual(Palembang.canonicalPalette, before)
        XCTAssertEqual(Palembang.canonicalPalette[.skyHot], "#DF8117")
    }

    func testOverriddenRenderDoesNotLeakIntoTheNextDefaultRender() throws {
        _ = try Palembang.renderSVG(width: 1920, height: 1080, palette: [.skyHot: "#123456"])
        let next = try Palembang.renderSVG(width: 1920, height: 1080)
        XCTAssertFalse(next.contains("#123456"))
        XCTAssertTrue(next.contains("#DF8117"))
    }

    func testRepeatedRendersAreDeterministic() throws {
        let first = try Palembang.renderSVG(width: 1920, height: 1080)
        let second = try Palembang.renderSVG(width: 1920, height: 1080)
        XCTAssertEqual(first, second)
    }
}
