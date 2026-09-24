// GENERATED FILE. Do not edit by hand.
// Source: tokens/palembang.v1.json
// Regenerate: node scripts/generate-swift-tokens.mjs
// Verify:     node scripts/generate-swift-tokens.mjs --check
//
// This file embeds the canonical token values as Swift literals so
// PalembangKit needs no runtime JSON loading, no network access, and no
// filesystem dependency to render. tokens/palembang.v1.json remains the
// authoritative source; this file must never be hand-edited.

enum CanonicalTokens {
    static let horizonY: Double = 0.5
    static let upperHeight: Double = 0.5
    static let lowerHeight: Double = 0.5

    static let palette: [String: String] = [
        "sky.hot": "#DF8117",
        "sky.cool": "#8198C4",
        "sea.light": "#8BA08A",
        "sea.dark": "#516872",
        "sea.haze": "#C0C0C0",
        "sea.glow": "#78B6BA",
        "surround.dark": "#0B1014",
        "boolean.input.gray": "#D9D9D9",
        "utility.hidden.purple": "#5B295D",
        "page.background": "#FFFFFF",
    ]

    static let sky = GradientPaint(
        kind: .radial,
        opacity: 1,
        transform: AffineTransform(
            m00: -0.23465590178966522, m01: -0.4919448792934418, m02: 1.135002613067627,
            m10: 1.0074560642242432, m11: -0.11458345502614975, m12: 0.00038877970655448735
        ),
        stops: [
            GradientStop(position: 0, colorToken: "sky.hot", alpha: 1),
            GradientStop(position: 1, colorToken: "sky.cool", alpha: 1),
        ]
    )

    static let seaBase = GradientPaint(
        kind: .radial,
        opacity: 1,
        transform: AffineTransform(
            m00: -0.5384021401405334, m01: -0.29897022247314453, m02: 1.2772572040557861,
            m10: 0.29897022247314453, m11: -0.12837707996368408, m12: 0.3539741635322571
        ),
        stops: [
            GradientStop(position: 0, colorToken: "sea.light", alpha: 1),
            GradientStop(position: 1, colorToken: "sea.dark", alpha: 1),
        ]
    )

    static let seaHaze = GradientPaint(
        kind: .linear,
        opacity: 0.44999998807907104,
        transform: AffineTransform(
            m00: -3.0531133177191805e-16, m01: -0.4260985553264618, m02: 0.5246338248252869,
            m10: 0.4260985553264618, m11: -2.7755575615628914e-17, m12: 0.3342210352420807
        ),
        stops: [
            GradientStop(position: 0.20000000298023224, colorToken: "sea.haze", alpha: 0),
            GradientStop(position: 0.30000001192092896, colorToken: "sea.haze", alpha: 0.800000011920929),
            GradientStop(position: 0.3764832615852356, colorToken: "sea.haze", alpha: 0),
        ]
    )

    static let seaHazeSmall320MiddleStopAlpha: Double = 1

    static let seaGlow = GradientPaint(
        kind: .radial,
        opacity: 0.6000000238418579,
        transform: AffineTransform(
            m00: 0.770240843296051, m01: -0.6885483860969543, m02: 0.9014222025871277,
            m10: 0.6885483860969543, m11: 0.19256021082401276, m12: 0.13915027678012848
        ),
        stops: [
            GradientStop(position: 0.09071040898561478, colorToken: "sea.glow", alpha: 1),
            GradientStop(position: 1, colorToken: "sea.glow", alpha: 0),
        ]
    )

}
