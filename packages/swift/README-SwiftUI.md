# PalembangSwiftUI — native SwiftUI presentation layer

**v0.8.0 is under development; it has not been released or tagged.**
`PalembangSwiftUI` is a second Swift library product, built on top of the
released `PalembangKit` (see [`README.md`](README.md)), that adds a native
SwiftUI view for canonical Palembang:

```swift
import SwiftUI
import PalembangSwiftUI

struct ContentView: View {
    var body: some View {
        PalembangView()
            .frame(height: 300)
    }
}
```

```text
canonical tokens / PalembangKit
          ↓
PalembangSwiftUI
          ↓
native SwiftUI View (PalembangView)
          ↓
iPhone / macOS applications (future work — not part of this package)
```

## What this is (and isn't)

`PalembangSwiftUI` draws canonical Palembang directly with Core Graphics —
**no WebKit, no `WKWebView`, no HTML/JavaScript, no Node, no loading the SVG
string into a web view, no rasterizing the canonical PNG masters, no
shipping screenshots, and no stretching/cropping a pre-rendered bitmap.** It
is the Apple-native visual adapter PalembangKit's own README describes as
future work.

This package does not ship a standalone iPhone/macOS application. `Examples/SwiftUIExample.swift`
is a copy-pasteable source file, not an Xcode project.

## Installation

Same repository dependency as PalembangKit, plus the `PalembangSwiftUI`
product:

```swift
.package(url: "https://github.com/ybtiger107/palembang-graphic-system.git", from: "0.7.0")
```

```swift
.target(
    name: "YourTarget",
    dependencies: [
        .product(name: "PalembangSwiftUI", package: "palembang-graphic-system")
    ]
)
```

(`PalembangSwiftUI` depends on `PalembangKit` internally — you don't need to
list `PalembangKit` separately unless you also call `Palembang.renderSVG`
directly.)

## Usage

```swift
PalembangView()
    .aspectRatio(16 / 9, contentMode: .fit)
```

`PalembangView` adopts whatever size SwiftUI proposes — via `.frame`,
`.aspectRatio`, or ordinary parent layout — and reconstructs canonical
Palembang for that exact rectangle, the same "rebuild both half-height
fields for the target aspect ratio" rule `docs/specification.md` section 7.1
requires of every renderer. It redraws correctly on width/height changes,
orientation changes, and palette/haze changes; it holds no cached bitmap and
no global state (see "Rendering lifecycle" below).

### Palette overrides

```swift
PalembangView(
    palette: [
        .skyHot: "#D97706",
        .seaGlow: "#22D3EE",
    ]
)
```

`palette` reuses `PalembangPaletteToken` from PalembangKit — the same six
semantic roles (`.skyHot`, `.skyCool`, `.seaLight`, `.seaDark`, `.seaHaze`,
`.seaGlow`), the same `#RRGGBB`-only validation. There is no second
palette-token type. Geometry, gradient transforms, stop positions, and layer
order are canonical and are not exposed as customization here (see AGENTS.md
"Canonical invariants").

### Haze override

```swift
PalembangView(hazeMiddleAlpha: 0.9)
```

Overrides the silver-haze gradient's middle-stop alpha (`0...1`). Omit it to
get the canonical default, including the 320×320 source exception (see
"320×320 haze behavior" below).

### Palette/configuration validation

`PalembangView.init` never `throws` — a plain SwiftUI view literal like the
examples above can't use `try` — but it does not silently accept invalid
input either. An invalid `#RRGGBB` value or an out-of-range `hazeMiddleAlpha`
passed to `init` is treated as a programmer error and fails fast with a
`precondition`, using the exact same rules PalembangKit's own
`Palembang.renderSVG` enforces (`PalembangValidation`, shared internally —
see "Relationship to PalembangKit" below).

If a palette override comes from **dynamic** data (user input, a remote
config, ...) rather than a literal, validate it first — this throws
PalembangKit's own `PalembangError` instead of trapping:

```swift
do {
    try PalembangView.validate(palette: userPalette)
    view = PalembangView(palette: userPalette)
} catch {
    // handle PalembangError.invalidColor / .invalidHazeMiddleAlpha
}
```

## Native rendering architecture

SwiftUI's high-level gradient shading styles (`RadialGradient`/
`LinearGradient`, or `GraphicsContext`'s `.radialGradient`/`.linearGradient`)
only accept a center/radius or two endpoints, with no documented way to hand
them an arbitrary affine transform. The canonical Figma gradient transforms
(`docs/specification.md` section 6) are arbitrary affines — rotation, shear,
and non-uniform scale — and are a design invariant, not something this
package simplifies away.

Core Graphics' `CGContext.drawRadialGradient`/`drawLinearGradient` are
explicitly documented to paint in the *current user space* established by
the CTM at draw time: concatenating an arbitrary `CGAffineTransform` before
drawing a "circular" radial gradient produces the exact sheared ellipse that
transform implies — precisely how SVG's own
`gradientUnits="objectBoundingBox"` + `gradientTransform` (what
`Palembang.renderSVG` already targets byte-for-byte) is itself defined to
behave. `PalembangSwiftUI` reuses the *same* `CGAffineTransform` numbers
PalembangKit's SVG renderer emits (see "Relationship to PalembangKit"),
against `CGContext`, on this package's `PalembangDrawingView`.

`GraphicsContext.withCGContext`, which would let a SwiftUI `Canvas` reach
this same API, requires iOS 16 / macOS 13 — above this package's iOS 15 /
macOS 12 floor. Rather than raise the deployment target for convenience,
`PalembangCanvas.swift` wraps a small `UIView`/`NSView` subclass
(`PalembangDrawingView`) whose `draw(rect:)` gets a plain `CGContext`
directly — the smallest native stack available at the existing floor that
reproduces the canonical geometry exactly. No Metal, no third-party
rendering dependency, no WebView.

See the doc comments at the top of `Sources/PalembangSwiftUI/NativeRenderer.swift`
for the full chain-of-reasoning and the exact coordinate-space mapping
(Figma normalized gradient space → objectBoundingBox unit square →
target half-rectangle → Core Graphics CTM).

## Relationship to PalembangKit

`PalembangSwiftUI` does not duplicate PalembangKit's canonical dataset or
transform math. PalembangKit's canonical types (`CanonicalTokens`,
`GradientPaint`, `AffineTransform`, ...) and shared math
(`GradientTransform.inverseAffine`, `PalembangPalette.merged`,
`PalembangValidation`) are declared with Swift 5.9's `package` access level
— visible to any target in this Swift package, including
`PalembangSwiftUI`, without becoming part of PalembangKit's `public` API.
`PalembangSwiftUI`'s `NativeRenderer` builds its render plan directly from
these — the same numbers `Renderer.swift` embeds into SVG — rather than
parsing `tokens/palembang.v1.json` at runtime or hand-copying a second set of
transforms/stops/palette defaults.

PalembangKit's existing public API (`Palembang.renderSVG`,
`PalembangPaletteToken`, `PalembangError`, `Palembang.canonicalPalette`) is
unchanged; the v0.7 SVG output and its 10/10 byte-parity contract are
unaffected.

## Canonical geometry guarantee

Every `PalembangView` render preserves the same invariants every Palembang
renderer preserves (`docs/specification.md` sections 3–7, 17; AGENTS.md
"Canonical invariants"):

- horizon exactly at `0.5 × height`, upper/lower fields each exactly 50%;
- right-biased warm sky (no recentered/generic radial gradient);
- 1 sky paint; 3 lower paints in order: sea base, silver haze, teal glow;
- exact canonical gradient stop positions, alpha values, and layer opacities;
- exact affine-transform semantics (see "Native rendering architecture");
- palette-only changes never alter geometry;
- arbitrary aspect-ratio reconstruction — no crop/stretch;
- the 320×320 haze middle-alpha exception, with explicit override semantics
  identical to PalembangKit's `hazeMiddleAlpha`.

No literal sun, clouds, waves, foam, or other painting objects are
introduced.

## Rendering lifecycle

`PalembangDrawingView.draw(rect:)` rebuilds its `RenderPlan` from the view's
current bounds and current palette/haze fields on every draw — there is no
cached bitmap and no stored geometry to go stale across width/height
changes, orientation changes, palette changes, haze changes, or a view
reappearing. `NativeRenderer`'s functions are pure/static; nothing in this
package holds global mutable state.

## Retina / scale behavior

`UIView`/`NSView` drawing is specified in points, not device pixels — the
system supplies a `CGContext` whose CTM already accounts for the view's
backing/content scale factor. `PalembangSwiftUI` never reads or multiplies
by scale itself; this is what makes `PalembangView` render sharply on Retina
displays without a caller supplying pixel dimensions.

## Color handling

Canonical Palembang colors are sRGB `#RRGGBB` hex values
(`docs/specification.md` section 5). `NativeRenderer` builds every `CGColor`
explicitly against `CGColorSpace(name: CGColorSpace.sRGB)`, rather than the
context's default/extended working space, so canonical hues are not
silently reinterpreted under a different color space. Per-stop alpha and
per-layer opacity remain independent of RGB, exactly as in the SVG renderer.

## Accessibility

`PalembangView` is decorative visual content by default and is marked
`.accessibilityHidden(true)` — this package invents no semantic description
for an abstract generated scene. Callers with a meaningful description for a
specific product context can opt back in:

```swift
PalembangView()
    .accessibilityHidden(false)
    .accessibilityLabel("Sunset over the Musi River")
```

## Platform minimums

`macOS 12+` / `iOS 15+` — the same floor `Package.swift` already declares
for PalembangKit. `PalembangSwiftUI` does not raise it. watchOS/tvOS/visionOS
are untested and unsupported.

## Native validation strategy

Native rendering can't be byte-compared to SVG markup, so
`Tests/PalembangSwiftUITests` tests `NativeRenderer`'s intermediate
`RenderPlan` — a deterministic, drawing-API-independent data model — instead
of pixels: exact 50/50 geometry (including odd dimensions), all 4 paints
present in canonical order, gradient-space transform values cross-checked
directly against `GradientTransform.inverseAffine` on PalembangKit's own
`CanonicalTokens`, exact stop positions/opacity, palette overrides, the
320×320 exception vs. the default and an explicit override, and that
repeated plan generation never mutates canonical defaults or leaks state
between calls. No permanent pixel-snapshot fixtures are committed (native
rendering can vary slightly by OS/rendering backend); a `RenderPlan` was also
rendered to temporary local PNGs during development and compared by eye
against `assets/canonical/png/` — see `Examples/SwiftUIExample.swift` for a
source-level, non-application way to do the same.

## Current limitations

- No SwiftUI `Canvas`/`GraphicsContext` path — see "Native rendering
  architecture" for why, and revisit once this package's floor can move past
  iOS 16 / macOS 13.
- No permanent automated pixel/screenshot testing (see "Native validation
  strategy").
- watchOS/tvOS/visionOS are untested.
- No standalone app, and no App Store-facing product — this is a library
  only.

## Licensing

`PalembangSwiftUI`'s Swift source code is MIT-licensed (`LICENSE.md`), same
as PalembangKit. The canonical design values it renders from, and the visual
output it produces on screen, follow `VISUAL-LICENSE.md` (CC BY 4.0) — same
scope as PalembangKit's SVG output; see PalembangKit's own README
"Licensing and package boundary" section. `PalembangSwiftUI` does not
include and does not depend on `reference/`, `source/`, `source/extracted/`,
`assets/canonical/`, `Palembang.fig`, or original artwork imagery.

## Related

- [`README.md`](README.md) — PalembangKit, the canonical Swift SVG/data core this package builds on
- [`docs/specification.md`](../../docs/specification.md) — the canonical design/implementation specification
- [`docs/specification.md` section 16.3](../../docs/specification.md) — "SwiftUI / Apple platforms" rendering contract notes
