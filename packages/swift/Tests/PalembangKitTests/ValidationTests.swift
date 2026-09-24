import XCTest
@testable import PalembangKit

final class ValidationTests: XCTestCase {
    func testInvalidWidthZero() {
        XCTAssertThrowsError(try Palembang.renderSVG(width: 0, height: 1080)) { error in
            XCTAssertEqual(error as? PalembangError, .invalidWidth(0))
        }
    }

    func testInvalidWidthNegative() {
        XCTAssertThrowsError(try Palembang.renderSVG(width: -100, height: 1080)) { error in
            XCTAssertEqual(error as? PalembangError, .invalidWidth(-100))
        }
    }

    func testInvalidWidthNonFinite() {
        XCTAssertThrowsError(try Palembang.renderSVG(width: .infinity, height: 1080)) { error in
            XCTAssertEqual(error as? PalembangError, .invalidWidth(.infinity))
        }
        XCTAssertThrowsError(try Palembang.renderSVG(width: .nan, height: 1080))
    }

    func testInvalidHeightZero() {
        XCTAssertThrowsError(try Palembang.renderSVG(width: 1920, height: 0)) { error in
            XCTAssertEqual(error as? PalembangError, .invalidHeight(0))
        }
    }

    func testInvalidHeightNegative() {
        XCTAssertThrowsError(try Palembang.renderSVG(width: 1920, height: -1)) { error in
            XCTAssertEqual(error as? PalembangError, .invalidHeight(-1))
        }
    }

    func testInvalidColorMissingHash() {
        XCTAssertThrowsError(
            try Palembang.renderSVG(width: 1920, height: 1080, palette: [.skyHot: "D97706"])
        ) { error in
            XCTAssertEqual(error as? PalembangError, .invalidColor(token: .skyHot, value: "D97706"))
        }
    }

    func testInvalidColorWrongLength() {
        XCTAssertThrowsError(
            try Palembang.renderSVG(width: 1920, height: 1080, palette: [.skyHot: "#FFF"])
        )
    }

    func testInvalidColorNonHexCharacters() {
        XCTAssertThrowsError(
            try Palembang.renderSVG(width: 1920, height: 1080, palette: [.skyHot: "#GGGGGG"])
        )
    }

    func testInvalidColorRejectsCssNamedColor() {
        // Only the canonical #RRGGBB form is accepted, matching
        // @palembang/core — arbitrary CSS/SVG color strings are rejected.
        XCTAssertThrowsError(
            try Palembang.renderSVG(width: 1920, height: 1080, palette: [.skyHot: "orange"])
        )
    }

    func testValidColorAcceptsLowercaseHex() throws {
        XCTAssertNoThrow(
            try Palembang.renderSVG(width: 1920, height: 1080, palette: [.skyHot: "#d97706"])
        )
    }

    func testInvalidHazeMiddleAlphaBelowZero() {
        XCTAssertThrowsError(
            try Palembang.renderSVG(width: 1920, height: 1080, hazeMiddleAlpha: -0.1)
        ) { error in
            XCTAssertEqual(error as? PalembangError, .invalidHazeMiddleAlpha(-0.1))
        }
    }

    func testInvalidHazeMiddleAlphaAboveOne() {
        XCTAssertThrowsError(
            try Palembang.renderSVG(width: 1920, height: 1080, hazeMiddleAlpha: 1.1)
        )
    }

    func testInvalidHazeMiddleAlphaNonFinite() {
        XCTAssertThrowsError(
            try Palembang.renderSVG(width: 1920, height: 1080, hazeMiddleAlpha: .nan)
        )
    }

    func testValidHazeMiddleAlphaBoundariesDoNotThrow() throws {
        XCTAssertNoThrow(try Palembang.renderSVG(width: 1920, height: 1080, hazeMiddleAlpha: 0))
        XCTAssertNoThrow(try Palembang.renderSVG(width: 1920, height: 1080, hazeMiddleAlpha: 1))
    }
}
