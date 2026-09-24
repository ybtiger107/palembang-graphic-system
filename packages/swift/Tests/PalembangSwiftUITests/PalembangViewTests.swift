import XCTest
import PalembangKit
@testable import PalembangSwiftUI

final class PalembangViewTests: XCTestCase {
    func testDefaultConfigurationDoesNotCrash() {
        _ = PalembangView()
    }

    func testValidPaletteOverrideDoesNotCrash() {
        _ = PalembangView(palette: [.skyHot: "#D97706", .seaGlow: "#22D3EE"])
    }

    func testValidHazeOverrideDoesNotCrash() {
        _ = PalembangView(hazeMiddleAlpha: 0.9)
    }

    func testValidateAcceptsValidPalette() throws {
        try PalembangView.validate(palette: [.skyHot: "#D97706"], hazeMiddleAlpha: 0.5)
    }

    func testValidateRejectsInvalidColorMissingHash() {
        XCTAssertThrowsError(try PalembangView.validate(palette: [.skyHot: "D97706"])) { error in
            XCTAssertEqual(error as? PalembangError, .invalidColor(token: .skyHot, value: "D97706"))
        }
    }

    func testValidateRejectsShortHex() {
        XCTAssertThrowsError(try PalembangView.validate(palette: [.skyHot: "#FFF"]))
    }

    func testValidateRejectsOutOfRangeHazeAlpha() {
        XCTAssertThrowsError(try PalembangView.validate(hazeMiddleAlpha: 1.5)) { error in
            XCTAssertEqual(error as? PalembangError, .invalidHazeMiddleAlpha(1.5))
        }
    }

    func testValidateRejectsNonFiniteHazeAlpha() {
        XCTAssertThrowsError(try PalembangView.validate(hazeMiddleAlpha: .nan))
    }

    func testValidateUsesTheSamePalembangErrorTypeAsPalembangKit() throws {
        // Reuse, not a parallel error type (task's "Palette/configuration
        // validation" requirement).
        do {
            try PalembangView.validate(palette: [.seaGlow: "orange"])
            XCTFail("expected a throw")
        } catch let error as PalembangError {
            XCTAssertEqual(error, .invalidColor(token: .seaGlow, value: "orange"))
        }
    }
}
