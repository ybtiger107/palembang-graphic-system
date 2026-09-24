import XCTest
@testable import PalembangKit

/// SVGNumber.format is the piece with the most platform risk (see its doc
/// comment): these cases are drawn directly from tokens/palembang.v1.json
/// and from actual @palembang/core output, so a mismatch here means the
/// ECMA-262 Number::toString reimplementation has a bug, independent of
/// whether the wider renderer parity tests also fail.
final class SVGNumberTests: XCTestCase {
    func testWholeNumbersDropDecimal() throws {
        XCTAssertEqual(try SVGNumber.format(1920), "1920")
        XCTAssertEqual(try SVGNumber.format(1080), "1080")
        XCTAssertEqual(try SVGNumber.format(0), "0")
    }

    func testNegativeZeroNormalizesToZero() throws {
        XCTAssertEqual(try SVGNumber.format(-0.0), "0")
    }

    func testHalfIntegerDimension() throws {
        // 577 / 2, from implementations/web parity fixtures (customAspect).
        XCTAssertEqual(try SVGNumber.format(288.5), "288.5")
    }

    func testFloat32AuthoredOpacityValues() throws {
        // tokens/palembang.v1.json sea.haze.opacity / sea.glow.opacity: values
        // authored as ~0.45 / ~0.60 in Figma (float32) and stored as their
        // exact float64 widening, which is not a short decimal.
        XCTAssertEqual(try SVGNumber.format(0.44999998807907104), "0.44999998807907104")
        XCTAssertEqual(try SVGNumber.format(0.6000000238418579), "0.6000000238418579")
    }

    func testStopPositions() throws {
        XCTAssertEqual(try SVGNumber.format(0.20000000298023224), "0.20000000298023224")
        XCTAssertEqual(try SVGNumber.format(0.30000001192092896), "0.30000001192092896")
        XCTAssertEqual(try SVGNumber.format(0.3764832615852356), "0.3764832615852356")
        XCTAssertEqual(try SVGNumber.format(0.09071040898561478), "0.09071040898561478")
    }

    func testTinyMagnitudeUsesExponentialNotation() throws {
        // sea.haze.transform m00/m10, epsilon-scale values from the Figma
        // source (docs/specification.md section 19 "numeric epsilon note").
        XCTAssertEqual(try SVGNumber.format(-3.0531133177191805e-16), "-3.0531133177191805e-16")
        XCTAssertEqual(try SVGNumber.format(-2.7755575615628914e-17), "-2.7755575615628914e-17")
    }

    func testInverseAffineDerivedTinyValue() throws {
        // Captured from @palembang/core's sea-haze gradientTransform on a
        // 1920x1080 render: the inverse-affine of the two epsilon values
        // above.
        XCTAssertEqual(try SVGNumber.format(-1.5287276299123954e-16), "-1.5287276299123954e-16")
        XCTAssertEqual(try SVGNumber.format(-1.6816003929036348e-15), "-1.6816003929036348e-15")
    }

    func testOrdinaryNegativeDecimal() throws {
        XCTAssertEqual(try SVGNumber.format(-0.43281258818896307), "-0.43281258818896307")
    }

    func testNonFiniteThrows() {
        XCTAssertThrowsError(try SVGNumber.format(.infinity))
        XCTAssertThrowsError(try SVGNumber.format(.nan))
    }
}
