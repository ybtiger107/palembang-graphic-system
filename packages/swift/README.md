# PalembangKit — Swift SDK

**Status: planned for v0.7.0, under development. Not yet released or tagged.**

PalembangKit is the canonical Swift foundation for future iPhone and macOS
Palembang apps. It renders canonical Palembang SVG from the same design data
and renderer contract as `implementations/svg/render.py` and
`@palembang/core` (`implementations/web/palembang.js`) — no JavaScript, no
Node, no Python, no DOM, no WebKit, no network access, and no runtime token
fetching.

```swift
import PalembangKit

let svg = try Palembang.renderSVG(width: 1920, height: 1080)
```

## Why this exists

`@palembang/core` (JavaScript) and the Python reference renderer cover web,
Node, terminal, and CI use. Neither is a realistic dependency for a native
iOS/macOS app. PalembangKit exists so a future SwiftUI, UIKit, or AppKit app
can render canonical Palembang without embedding a JavaScript engine or
shelling out to Python — while still being provably the same design, not a
reinterpretation of it (see "Renderer architecture" below).

## Future iOS/macOS/SwiftUI role

PalembangKit v0.7 is a **data and rendering core only**. It deliberately does
not import SwiftUI, UIKit, AppKit, or WebKit, and does not ship a native
visual renderer (Canvas, Core Graphics, Core Image, Metal, or a
`WKWebView`/`UIImage`/`NSImage` wrapper) — see "Non-goals" below. A future
release can add a `PalembangSwiftUI` product, or an Apple-native visual
adapter, on top of this verified core without changing PalembangKit's public
API.

## Installation

Not yet tagged. Once `v0.7.0` is released, the intended Swift Package Manager
dependency is:

```swift
.package(url: "https://github.com/ybtiger107/palembang-graphic-system.git", from: "0.7.0")
```

```swift
.target(
    name: "YourTarget",
    dependencies: [
        .product(name: "PalembangKit", package: "palembang-graphic-system")
    ]
)
```

`Package.swift` lives at the repository root (not under `packages/swift/`)
because SwiftPM's Git-dependency resolution expects the manifest at the
repository root; the Swift sources themselves stay under `packages/swift/`
alongside `packages/core` and `packages/cli`.

## Usage

```swift
import PalembangKit

let svg = try Palembang.renderSVG(width: 1920, height: 1080)
```

### Palette overrides

```swift
let svg = try Palembang.renderSVG(
    width: 1920,
    height: 1080,
    palette: [
        .skyHot: "#D97706",
        .skyCool: "#64748B",
    ]
)
```

`palette` accepts a partial override of any of the six semantic scene-color
tokens (`PalembangPaletteToken`): `.skyHot`, `.skyCool`, `.seaLight`,
`.seaDark`, `.seaHaze`, `.seaGlow`. Unlisted tokens keep their canonical
color. Values must be `#RRGGBB` hex strings — arbitrary CSS/SVG color syntax
is rejected, matching `@palembang/core`.

Geometry, gradient transforms, stop positions, opacities, and layer order are
not exposed as options — they are identity geometry, not theme controls (see
`docs/specification.md` section 23).

### Attribution

```swift
let svg = try Palembang.renderSVG(width: 1920, height: 1080, attribution: false)
```

`attribution` defaults to `true` and embeds a CC BY 4.0 `<metadata>` notice
in the SVG, matching `@palembang/core`. Setting it to `false` removes only
that embedded notice — **it does not remove the CC BY 4.0 attribution
obligation** for the graphic you generate. See `VISUAL-LICENSE.md`.

### Errors

`Palembang.renderSVG` throws `PalembangError` for invalid input: non-finite
or non-positive `width`/`height`, a palette value that isn't `#RRGGBB`, or a
`hazeMiddleAlpha` outside `0...1`.

## Canonical geometry

Every call reconstructs both canonical half-height fields (`docs/specification.md`
section 3) for the requested `width`/`height` from the same normalized
gradient transforms as every other Palembang renderer — it does not crop or
stretch a fixed-size bitmap or SVG asset. The horizon is always at exactly
`0.5 * height`; arbitrary positive dimensions are supported, including the
320×320 source's historical haze-alpha exception.

## Generated canonical token data

`Sources/PalembangKit/CanonicalTokens.generated.swift` is generated
deterministically from `tokens/palembang.v1.json` by
`scripts/generate-swift-tokens.mjs`, the same pattern
`scripts/generate-core-assets.mjs` uses for `@palembang/core`'s
`generated-tokens.js`. `tokens/palembang.v1.json` remains the single
authority; the generated file must never be hand-edited.

```sh
node scripts/generate-swift-tokens.mjs           # regenerate
node scripts/generate-swift-tokens.mjs --check    # fail if stale (CI-friendly)
```

The generated file contains only Swift literals — no JSON parsing, no
`FileManager` access, and no network access happen inside PalembangKit at
render time.

## Renderer architecture

PalembangKit is a Swift **port of the same renderer contract** already
verified in `implementations/svg/render.py` and
`implementations/web/palembang.js` — not a new interpretation of Palembang
geometry. It reproduces:

- the 50/50 horizon and per-target-rectangle upper/lower reconstruction;
- the canonical gradient types (sky/sea-base/sea-glow radial, sea-haze linear);
- the inverse-affine conversion from Figma's shape→gradient transform to
  SVG's gradient→shape `matrix(a b c d e f)`, identical to both existing
  renderers' `inverse_affine`/`inverseAffine`;
- gradient IDs (`sky`, `sea-base`, `sea-haze`, `sea-glow`), stop order,
  opacities, and layer order (sky, sea base, silver haze, teal glow);
- the 320×320 haze-alpha exception;
- arbitrary positive target dimensions;
- the same CC BY 4.0 attribution metadata text as `@palembang/core`.

See `docs/implementation-guide.md` section 4 for why a platform adapter must
convert, not copy, Figma's stored gradient matrices.

## Number formatting

JavaScript's `Number.prototype.toString()` and Python's `repr(float(...))`
both produce a "shortest round-trip" decimal string, but their fixed vs.
exponential formatting rules aren't the same, and Swift's `Double.description`
formatting rules aren't guaranteed to match either. PalembangKit's internal
`SVGNumber` formatter uses Swift's `Double.description` only for what it's
guaranteed to get right — the correct shortest significant-digit string for a
given `Double` — and re-derives the fixed/exponential layout itself using the
ECMA-262 `Number::toString(x, 10)` algorithm (the same one JavaScript's
engines use). This is designed to make PalembangKit's SVG number output
byte-identical to `@palembang/core`'s for every value in the canonical token
set; see the doc comment on `SVGNumber.format` and
`Tests/PalembangKitTests/SVGNumberTests.swift` for the specific cases this
was checked against (including the epsilon-scale gradient-transform values
in `docs/specification.md` section 19). This has not yet been confirmed by
running the Swift test suite (no Swift toolchain was available in the
environment this was developed in) — see "Toolchain availability" below.

## Cross-renderer parity

`Tests/PalembangKitTests/ParityTests.swift` embeds SVG strings captured
verbatim from `@palembang/core` (`renderPalembangSvg`) for representative
cases — canonical wide, square, the 320×320 exception, an arbitrary custom
aspect ratio, partial and multiple palette overrides, attribution on/off, and
an explicit `hazeMiddleAlpha` — and asserts `Palembang.renderSVG` produces
**byte-identical** output for the same options. `CanonicalRenderTests.swift`
adds structural checks (horizon position, layer order, all six palette
tokens) independent of exact byte matching.

## Canonical data safety

`Palembang.canonicalPalette` and all internal canonical token data are
declared as Swift `let` value types — there is no writable singleton or
global rendering state to mutate. Passing a `palette` override to one
`renderSVG` call cannot affect `canonicalPalette` or any other call; see
`Tests/PalembangKitTests/ImmutabilityTests.swift`.

## Toolchain availability

No Swift toolchain was available in the environment PalembangKit was
developed in, so it has not yet been built or test-run by this work. Before
release, validate on a Mac:

```sh
cd ~/projects/palembang-graphic-system
swift --version
swift package describe
swift build
swift test
```

## Non-goals for v0.7

PalembangKit v0.7 intentionally does **not** include:

- SwiftUI, UIKit, AppKit, or WebKit imports;
- a `PalembangSwiftUI` product;
- a native visual renderer (SwiftUI `Canvas`, Core Graphics, Core Image,
  Metal, `WKWebView`, or a `UIImage`/`NSImage` wrapper);
- an Xcode project or a full app.

The goal of v0.7 is to validate the exact Swift data/renderer contract first.
A native Apple visual adapter is future work built on top of this verified
core, not part of this release.

## Relationship to the rest of the system

```text
tokens/palembang.v1.json (canonical)
        ↓
scripts/generate-swift-tokens.mjs
        ↓
CanonicalTokens.generated.swift
        ↓
PalembangKit (Renderer.swift, SVGNumber.swift, Palembang.swift)
        ↓
SVG string
```

PalembangKit does not define its own geometry or gradient semantics — it
reproduces the contract already established by `implementations/svg/render.py`
and `implementations/web/palembang.js`/`@palembang/core`. See
`docs/specification.md` and `docs/implementation-guide.md` for the
authoritative design/implementation rules every Palembang renderer follows.

## Licensing and package boundary

PalembangKit's Swift source code is MIT-licensed (`LICENSE.md`). The
canonical design values it embeds, and the SVG it generates, follow
`VISUAL-LICENSE.md` (CC BY 4.0) — see "Attribution" above. PalembangKit does
not include and does not depend on `reference/`, `source/`, `source/extracted/`,
`assets/canonical/`, `Palembang.fig`, canonical PNGs, original artwork
imagery, or Playground storage/share state; only `Sources/`, `Tests/`, and
`Examples/` under `packages/swift/` and the root `Package.swift` are part of
the PalembangKit package target.

## Stability

This API is pre-1.0 and may change before a 1.0 release. `PalembangKit` is
currently the only public product; `PalembangSwiftUI` and any native visual
adapter are future work, not part of this API.

## Related

- [Palembang Graphic System](https://github.com/ybtiger107/palembang-graphic-system) — repository root
- [`@palembang/core`](../core/README.md) — the JavaScript SDK this Swift port mirrors
- [`implementations/svg/README.md`](../../implementations/svg/README.md) — the Figma → SVG mapping this renderer reproduces
- [`docs/specification.md`](../../docs/specification.md) — the canonical design/implementation specification
