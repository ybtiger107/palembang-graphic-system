import XCTest
import CoreGraphics
import PalembangKit
@testable import PalembangSwiftUI

/// Structural/math tests for NativeRenderer's RenderPlan — the deterministic
/// contract this package tests, per the task's "native rendering cannot be
/// byte-compared to SVG markup" guidance (docs/specification.md section 17;
/// AGENTS.md "Implementation work"). Where practical these compare directly
/// against PalembangKit's own canonical data/math (CanonicalTokens,
/// GradientTransform) rather than hardcoded literals, so both sides can
/// never silently drift apart.
final class RenderPlanTests: XCTestCase {
    private func plan(width: Double, height: Double, palette: [PalembangPaletteToken: String] = [:], hazeMiddleAlpha: Double? = nil) -> RenderPlan {
        NativeRenderer.makePlan(
            size: CGSize(width: width, height: height),
            palette: PalembangPalette.merged(overrides: palette),
            hazeMiddleAlpha: hazeMiddleAlpha
        )
    }

    // MARK: Geometry

    func testExact50_50GeometryForWideCanvas() {
        let p = plan(width: 1920, height: 1080)
        XCTAssertEqual(p.paints[0].rect, CGRect(x: 0, y: 0, width: 1920, height: 540)) // sky / upper
        for paint in p.paints[1...] { // sea base, haze, glow / lower
            XCTAssertEqual(paint.rect, CGRect(x: 0, y: 540, width: 1920, height: 540))
        }
    }

    func testExact50_50GeometryForSquareCanvas() {
        let p = plan(width: 1000, height: 1000)
        XCTAssertEqual(p.paints[0].rect, CGRect(x: 0, y: 0, width: 1000, height: 500))
        XCTAssertEqual(p.paints[1].rect, CGRect(x: 0, y: 500, width: 1000, height: 500))
    }

    func testArbitraryOddDimensions() {
        let p = plan(width: 833, height: 577)
        XCTAssertEqual(p.paints[0].rect, CGRect(x: 0, y: 0, width: 833, height: 288.5))
        XCTAssertEqual(p.paints[1].rect, CGRect(x: 0, y: 288.5, width: 833, height: 288.5))
        // Upper + lower must reconstruct the full height with no seam gap.
        XCTAssertEqual(p.paints[0].rect.maxY, p.paints[1].rect.minY)
        XCTAssertEqual(p.paints[1].rect.maxY, 577, accuracy: 1e-9)
    }

    func testUpperAndLowerEachOccupyExactlyHalfForManySizes() {
        for (w, h) in [(1920.0, 1080.0), (320.0, 320.0), (2560.0, 1664.0), (833.0, 577.0), (1.0, 1.0)] {
            let p = plan(width: w, height: h)
            XCTAssertEqual(p.paints[0].rect.height, h / 2, accuracy: 1e-9, "upper half at \(w)x\(h)")
            XCTAssertEqual(p.paints[1].rect.height, h - h / 2, accuracy: 1e-9, "lower half at \(w)x\(h)")
        }
    }

    // MARK: Paints present / layer order

    func testAllFourPaintsPresentInCanonicalOrder() {
        let p = plan(width: 1920, height: 1080)
        XCTAssertEqual(p.paints.map(\.id), ["sky", "sea-base", "sea-haze", "sea-glow"])
        XCTAssertEqual(p.paints.map(\.kind), [.radial, .radial, .linear, .radial])
    }

    // MARK: Transform values — cross-checked against PalembangKit's own math

    func testGradientSpaceTransformMatchesSharedInverseAffineForEachPaint() throws {
        let p = plan(width: 1920, height: 1080)
        let sources: [(String, GradientPaint)] = [
            ("sky", CanonicalTokens.sky),
            ("sea-base", CanonicalTokens.seaBase),
            ("sea-haze", CanonicalTokens.seaHaze),
            ("sea-glow", CanonicalTokens.seaGlow),
        ]
        for (id, source) in sources {
            let expectedValues = try GradientTransform.inverseAffine(source.transform)
            let expected = CGAffineTransform(
                a: CGFloat(expectedValues[0]), b: CGFloat(expectedValues[1]),
                c: CGFloat(expectedValues[2]), d: CGFloat(expectedValues[3]),
                tx: CGFloat(expectedValues[4]), ty: CGFloat(expectedValues[5])
            )
            let actual = p.paints.first { $0.id == id }!.gradientSpaceTransform
            XCTAssertEqual(actual, expected, "gradientSpaceTransform for \(id)")
        }
    }

    func testGradientSpaceTransformIsIndependentOfTargetSize() {
        let wide = plan(width: 1920, height: 1080)
        let square = plan(width: 833, height: 577)
        for i in 0..<4 {
            XCTAssertEqual(wide.paints[i].gradientSpaceTransform, square.paints[i].gradientSpaceTransform, "paint \(i)")
            // Only the full (bbox-composed) transform should differ across sizes.
            XCTAssertNotEqual(wide.paints[i].transform, square.paints[i].transform, "paint \(i)")
        }
    }

    func testFullTransformComposesGradientSpaceTransformWithObjectBoundingBox() {
        let p = plan(width: 1920, height: 1080)
        let sky = p.paints[0]
        // Manually reconstruct the objectBoundingBox mapping the same way
        // NativeRenderer does, and confirm composition order.
        let bbox = CGAffineTransform(scaleX: sky.rect.width, y: sky.rect.height)
            .concatenating(CGAffineTransform(translationX: sky.rect.origin.x, y: sky.rect.origin.y))
        let expected = sky.gradientSpaceTransform.concatenating(bbox)
        XCTAssertEqual(sky.transform, expected)

        // And a concrete point check: the gradient's own unit-space center
        // (0.5, 0.5) must land inside the sky's target rect once both
        // transforms are applied — not at some point unrelated to `rect`.
        let mapped = CGPoint(x: 0.5, y: 0.5).applying(sky.transform)
        XCTAssertTrue(sky.rect.insetBy(dx: -1, dy: -1).contains(mapped))
    }

    // MARK: Stops / opacity / palette

    func testCanonicalStopPositionsAndOpacityMatchCanonicalTokens() {
        let p = plan(width: 1920, height: 1080)
        let sky = p.paints[0]
        XCTAssertEqual(sky.opacity, CanonicalTokens.sky.opacity)
        XCTAssertEqual(sky.stops.map(\.location), CanonicalTokens.sky.stops.map(\.position))

        let haze = p.paints[2]
        XCTAssertEqual(haze.opacity, CanonicalTokens.seaHaze.opacity)
        XCTAssertEqual(haze.stops.map(\.location), CanonicalTokens.seaHaze.stops.map(\.position))
    }

    func testPartialPaletteOverrideChangesOnlyThatToken() {
        let overridden = plan(width: 1920, height: 1080, palette: [.skyHot: "#D97706"])
        let canonical = plan(width: 1920, height: 1080)
        let overriddenSky = overridden.paints[0]
        let canonicalSky = canonical.paints[0]
        XCTAssertNotEqual(overriddenSky.stops[0], canonicalSky.stops[0]) // sky.hot changed
        XCTAssertEqual(overriddenSky.stops[1], canonicalSky.stops[1]) // sky.cool untouched
        // Geometry/opacity must never change from a palette-only override.
        XCTAssertEqual(overriddenSky.rect, canonicalSky.rect)
        XCTAssertEqual(overriddenSky.transform, canonicalSky.transform)
        XCTAssertEqual(overriddenSky.opacity, canonicalSky.opacity)
    }

    func testAllSixPaletteRolesAreResolvable() {
        let overrides: [PalembangPaletteToken: String] = [
            .skyHot: "#111111", .skyCool: "#222222",
            .seaLight: "#333333", .seaDark: "#444444",
            .seaHaze: "#555555", .seaGlow: "#666666",
        ]
        let p = plan(width: 1920, height: 1080, palette: overrides)
        XCTAssertEqual(p.paints[0].stops[0], NativeStop(location: 0, red: 0x11 / 255.0, green: 0x11 / 255.0, blue: 0x11 / 255.0, alpha: 1))
        XCTAssertEqual(p.paints[0].stops[1], NativeStop(location: 1, red: 0x22 / 255.0, green: 0x22 / 255.0, blue: 0x22 / 255.0, alpha: 1))
        XCTAssertEqual(p.paints[1].stops[0].red, 0x33 / 255.0)
        XCTAssertEqual(p.paints[1].stops[1].red, 0x44 / 255.0)
        XCTAssertEqual(p.paints[2].stops[0].red, 0x55 / 255.0)
        XCTAssertEqual(p.paints[3].stops[0].red, 0x66 / 255.0)
    }

    // MARK: 320x320 haze exception

    func test320x320UsesTheHazeSourceException() {
        let p = plan(width: 320, height: 320)
        XCTAssertEqual(p.paints[2].stops[1].alpha, CanonicalTokens.seaHazeSmall320MiddleStopAlpha)
        XCTAssertEqual(p.paints[2].stops[1].alpha, 1)
    }

    func testNonSquareAndNon320SquareUseTheDefaultHazeAlpha() {
        for (w, h) in [(1920.0, 1080.0), (640.0, 640.0)] {
            let p = plan(width: w, height: h)
            XCTAssertEqual(p.paints[2].stops[1].alpha, CanonicalTokens.seaHaze.stops[1].alpha, "\(w)x\(h)")
        }
    }

    func testExplicitHazeOverrideWinsEvenAt320() {
        let p = plan(width: 320, height: 320, hazeMiddleAlpha: 0.42)
        XCTAssertEqual(p.paints[2].stops[1].alpha, 0.42)
    }

    func testExplicitHazeOverrideAppliesAtAnySize() {
        let p = plan(width: 1920, height: 1080, hazeMiddleAlpha: 0.9)
        XCTAssertEqual(p.paints[2].stops[1].alpha, 0.9)
        // Only the middle stop is affected.
        XCTAssertEqual(p.paints[2].stops[0].alpha, CanonicalTokens.seaHaze.stops[0].alpha)
        XCTAssertEqual(p.paints[2].stops[2].alpha, CanonicalTokens.seaHaze.stops[2].alpha)
    }

    // MARK: No shared/global mutable state

    func testRepeatedPlanGenerationDoesNotMutateCanonicalDefaults() {
        let before = CanonicalTokens.palette
        _ = plan(width: 1920, height: 1080, palette: [.skyHot: "#000000", .seaGlow: "#FFFFFF"])
        XCTAssertEqual(CanonicalTokens.palette, before)
        let next = plan(width: 1920, height: 1080)
        XCTAssertEqual(next.paints[0].stops[0].red, ColorHexTestHelper.rgb(CanonicalTokens.palette["sky.hot"]!).red)
    }

    func testDynamicSizePlanGenerationProducesIndependentPlans() {
        let a = plan(width: 100, height: 100)
        let b = plan(width: 4000, height: 3000)
        XCTAssertNotEqual(a.size, b.size)
        XCTAssertNotEqual(a.paints[0].rect, b.paints[0].rect)
        // Re-requesting the first size again gives the identical plan (no
        // leaked state from having built `b` in between).
        let aAgain = plan(width: 100, height: 100)
        XCTAssertEqual(a, aAgain)
    }
}

private enum ColorHexTestHelper {
    static func rgb(_ hex: String) -> (red: Double, green: Double, blue: Double) {
        ColorHex.components(hex)
    }
}
