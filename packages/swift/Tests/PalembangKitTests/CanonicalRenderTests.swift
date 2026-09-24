import XCTest
@testable import PalembangKit

final class CanonicalRenderTests: XCTestCase {
    func testCanonicalWideRenderStructure() throws {
        let svg = try Palembang.renderSVG(width: 1920, height: 1080)
        XCTAssertTrue(svg.contains("width=\"1920\" height=\"1080\" viewBox=\"0 0 1920 1080\""))
        XCTAssertTrue(svg.contains("<title>Palembang Graphic System</title>"))
        // Horizon: both half-height rects sit at exactly H/2.
        XCTAssertTrue(svg.contains("id=\"sky-field\" x=\"0\" y=\"0\" width=\"1920\" height=\"540\""))
        XCTAssertTrue(svg.contains("id=\"sea-base-field\" x=\"0\" y=\"540\" width=\"1920\" height=\"540\""))
        XCTAssertTrue(svg.contains("id=\"sea-haze-field\" x=\"0\" y=\"540\" width=\"1920\" height=\"540\""))
        XCTAssertTrue(svg.contains("id=\"sea-glow-field\" x=\"0\" y=\"540\" width=\"1920\" height=\"540\""))
    }

    func testLayerOrderIsSkyThenSeaBaseThenHazeThenGlow() throws {
        let svg = try Palembang.renderSVG(width: 1920, height: 1080)
        let skyIndex = svg.range(of: "id=\"sky\"")!.lowerBound
        let baseIndex = svg.range(of: "id=\"sea-base\"")!.lowerBound
        let hazeIndex = svg.range(of: "id=\"sea-haze\"")!.lowerBound
        let glowIndex = svg.range(of: "id=\"sea-glow\"")!.lowerBound
        XCTAssertTrue(skyIndex < baseIndex)
        XCTAssertTrue(baseIndex < hazeIndex)
        XCTAssertTrue(hazeIndex < glowIndex)
    }

    func testArbitraryOddDimensions() throws {
        let svg = try Palembang.renderSVG(width: 833, height: 577)
        XCTAssertTrue(svg.contains("width=\"833\" height=\"577\" viewBox=\"0 0 833 577\""))
        XCTAssertTrue(svg.contains("height=\"288.5\""))
    }

    func testSquareRender() throws {
        let svg = try Palembang.renderSVG(width: 1000, height: 1000)
        XCTAssertTrue(svg.contains("width=\"1000\" height=\"1000\" viewBox=\"0 0 1000 1000\""))
        XCTAssertTrue(svg.contains("height=\"500\""))
    }

    func test320x320UsesTheHazeSourceException() throws {
        let svg = try Palembang.renderSVG(width: 320, height: 320)
        XCTAssertTrue(svg.contains("haze middle-stop alpha 1"))
        // The middle haze stop (index 1) must carry alpha 1, not the ~0.8
        // large-variant default.
        XCTAssertFalse(svg.contains("stop-opacity=\"0.800000011920929\""))
    }

    func testNon320SquareUsesTheDefaultHazeAlpha() throws {
        let svg = try Palembang.renderSVG(width: 640, height: 640)
        XCTAssertTrue(svg.contains("haze middle-stop alpha 0.800000011920929"))
    }

    func testExplicitHazeAlphaOverridesEvenAt320() throws {
        let svg = try Palembang.renderSVG(width: 320, height: 320, hazeMiddleAlpha: 0.8)
        XCTAssertTrue(svg.contains("haze middle-stop alpha 0.8<"))
    }

    func testPartialPaletteOverrideChangesOnlyThatToken() throws {
        let svg = try Palembang.renderSVG(width: 1920, height: 1080, palette: [.skyHot: "#D97706"])
        XCTAssertTrue(svg.contains("stop-color=\"#D97706\""))
        XCTAssertTrue(svg.contains("stop-color=\"#8198C4\"")) // sky.cool untouched
        XCTAssertFalse(svg.contains("#DF8117")) // canonical sky.hot no longer present
    }

    func testAllSixPaletteTokensAreOverridable() throws {
        let overrides: [PalembangPaletteToken: String] = [
            .skyHot: "#111111",
            .skyCool: "#222222",
            .seaLight: "#333333",
            .seaDark: "#444444",
            .seaHaze: "#555555",
            .seaGlow: "#666666",
        ]
        let svg = try Palembang.renderSVG(width: 1920, height: 1080, palette: overrides)
        for (_, hex) in overrides {
            XCTAssertTrue(svg.contains("\"\(hex)\""), "expected \(hex) in output")
        }
        for canonical in ["#DF8117", "#8198C4", "#8BA08A", "#516872", "#C0C0C0", "#78B6BA"] {
            XCTAssertFalse(svg.contains(canonical), "canonical color \(canonical) should have been overridden")
        }
    }

    func testAttributionDefaultsOn() throws {
        let svg = try Palembang.renderSVG(width: 1920, height: 1080)
        XCTAssertTrue(svg.contains("<metadata>"))
        XCTAssertTrue(svg.contains("CC BY 4.0"))
    }

    func testAttributionCanBeDisabled() throws {
        let svg = try Palembang.renderSVG(width: 1920, height: 1080, attribution: false)
        XCTAssertFalse(svg.contains("<metadata>"))
    }
}
