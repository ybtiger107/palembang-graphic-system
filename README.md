<div align="center">

# Palembang

### Graphic System

A reusable graphic system distilled from a gifted, hand-painted seascape —
its composition, horizon, and light preserved; its palette and texture free to change.

<br>

<img src="assets/canonical/png/Palembang2560x1080.png" alt="Palembang canonical graphic: a calm horizon dividing a warm, right-biased sunset sky from a layered sea" width="100%">

<br><br>

[**Try Playground**](https://ybtiger107.github.io/palembang-graphic-system/) &nbsp;·&nbsp;
[`@palembang/cli`](packages/cli/README.md) &nbsp;·&nbsp;
[`@palembang/core`](packages/core/README.md) &nbsp;·&nbsp;
[Latest Release](https://github.com/ybtiger107/palembang-graphic-system/releases/latest) &nbsp;·&nbsp;
[Read Specification](docs/specification.md)

</div>

<br>

## What is Palembang?

Palembang is a reusable graphic system derived from an original hand-painted seascape. It is **not a literal reproduction of the painting**. It translates the artwork's composition, horizon, light distribution, atmosphere, and spatial proportions into a simplified digital visual language — one that can be re-rendered at any size or aspect ratio while still reading as Palembang.

## Origin

The source painting was hand-painted by a friend of the repository maintainer and given to them personally as a gift.

The artist's identity and personal details are intentionally not published.

Palembang exists to preserve and carry forward the visual memory of that gift while translating it into a reusable digital graphic system.

## Get started

There are three ways to use Palembang, depending on what you're building:

**No install — just want a graphic?**
Open the [**Playground**](https://ybtiger107.github.io/palembang-graphic-system/) in a browser: pick a size, recolor it, export SVG or PNG. See [`implementations/web/README.md`](implementations/web/README.md).

**Terminal, servers, CI?**
Install [`@palembang/cli`](packages/cli/README.md) (public on npm):

```sh
npm install -g @palembang/cli
palembang render --size 1920x1080 -o palembang.svg
```

**Building a JavaScript app?**
Install [`@palembang/core`](packages/core/README.md) (public on npm):

```sh
npm install @palembang/core
```

```js
import { renderPalembangSvg } from "@palembang/core";
```

**Building an Apple app?**
Add [`PalembangSwiftUI`](packages/swift/README-SwiftUI.md), the released
SwiftPM native SwiftUI presentation layer, or [`PalembangKit`](packages/swift/README.md),
the Swift SVG/data core. Both are available from the v0.8.0 SwiftPM release;
see their package READMEs for product-specific installation examples.

Both packages render from the same canonical tokens as every other implementation — see [Using Palembang](#using-palembang) below for how they relate to each other and to the reference renderer.

## Canonical system

Palembang separates what must stay fixed from what is free to change:

| | |
|---|---|
| **Geometry / composition** | canonical — preserved exactly |
| **Palette** | variable by design |
| **Texture intensity** | variable, optional |
| **Aspect ratio** | adaptable, per the specification's reconstruction rule |

New aspect ratios are rebuilt from the canonical rules, not cropped or stretched from a single master bitmap.

Full detail lives in:

- [`docs/specification.md`](docs/specification.md) — the complete design and implementation specification
- [`docs/design-philosophy.md`](docs/design-philosophy.md) — why the system preserves what it preserves
- [`docs/implementation-guide.md`](docs/implementation-guide.md) — how to turn the canonical data into a new platform implementation
- [`docs/source-inventory.md`](docs/source-inventory.md) — preserved source, canonical assets, and reference-material inventory
- [`tokens/palembang.v1.json`](tokens/palembang.v1.json) — machine-readable geometry, gradients, and color values

## Use Palembang

Palembang is meant to be used — in apps, websites, backgrounds, games, publications, and other creative work, including commercial projects.

Graphics you generate — with the [Playground](#playground), [`@palembang/cli`](packages/cli/README.md), [`@palembang/core`](packages/core/README.md), the [SVG reference renderer](implementations/svg/README.md), or SVG/PNG assets downloaded from a GitHub Release — are licensed under **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)**: free to use, copy, redistribute, recolor, and adapt, commercially or non-commercially, with attribution. See [`VISUAL-LICENSE.md`](VISUAL-LICENSE.md) for the full scope and examples.

Attribution example:

```
Palembang Graphic System — ybtiger107
https://github.com/ybtiger107/palembang-graphic-system
CC BY 4.0
```

This CC BY 4.0 grant covers **outputs you generate**. It does not extend to the **original painting, the reference photographs in `reference/`, the Figma master (`source/Palembang.fig`), or the preserved canonical master files in `assets/canonical/`** — those stay all rights reserved. They are visible in this public repository as reference and validation material, not as reusable assets; browsing or downloading them here does not itself grant reuse rights. If you want a Palembang graphic you can actually reuse, generate one yourself (see [Get started](#get-started)) rather than using a canonical file directly. See [`VISUAL-LICENSE.md`](VISUAL-LICENSE.md) and [`ARTWORK-RIGHTS.md`](ARTWORK-RIGHTS.md) for the full boundary.

## Playground

Try it live: **[ybtiger107.github.io/palembang-graphic-system](https://ybtiger107.github.io/palembang-graphic-system/)**

The browser [Playground](implementations/web/README.md) lets you explore, customize, and export Palembang without installing anything:

- live Palembang preview, generated directly from the canonical tokens;
- Standard / Custom / Wallpaper output modes, with practical resolution presets (Square, Medium, Wide, common device and desktop wallpaper sizes);
- full palette customization across all six scene colors, including a curated palette gallery (Midnight, Ocean, Aurora, Desert, Rose, Monochrome, Obsidian, and more) alongside manual hex/swatch editing;
- copyable share links that reproduce an exact design — open one to load and immediately remix it, no account or backend involved;
- multiple named designs saved locally in your browser (save, rename, duplicate, delete);
- design export/import as a small, human-readable JSON file;
- SVG export and client-side PNG export;
- settings and saved designs persist in your browser (`localStorage`), so they survive reloads or an accidental tab close;
- one-click reset back to canonical Palembang for the design you're currently editing (saved designs are untouched).

Playground exports and shared designs follow the same [CC BY 4.0](#use-palembang) terms as every other official renderer. See [`implementations/web/README.md`](implementations/web/README.md) for the full sharing/saved-designs model and privacy details.

## The reference renderer

Alongside the packages above, Palembang ships a dependency-free **Python SVG reference renderer** — the implementation the rest of the system is verified against:

```sh
python3 implementations/svg/render.py \
  --width 2560 \
  --height 1080 \
  --output Palembang.svg
```

It reconstructs each target rectangle from the canonical tokens instead of stretching a bitmap. The renderer's source code is MIT-licensed; the SVG it generates is a usable output under CC BY 4.0 (see [Use Palembang](#use-palembang) above). Most users building an app or running automation should prefer [`@palembang/core`](packages/core/README.md) or [`@palembang/cli`](packages/cli/README.md) instead — see [`implementations/svg/README.md`](implementations/svg/README.md) for when the Python renderer itself is the right choice (e.g. verifying a new platform implementation).

## Canonical reference assets

`assets/canonical/png/` holds the completed PNG renders supplied by the maintainer. They are **preserved, all-rights-reserved reference and validation material** — the appearance every renderer is checked against — not a source of reusable graphics:

- [`assets/canonical/png/Palembang.png`](assets/canonical/png/Palembang.png) — small square
- [`assets/canonical/png/Palembang2560x1080.png`](assets/canonical/png/Palembang2560x1080.png) — wide
- [`assets/canonical/png/Palembang2560x1664.png`](assets/canonical/png/Palembang2560x1664.png) — medium-wide
- [`assets/canonical/png/Palembang2560x2560.png`](assets/canonical/png/Palembang2560x2560.png) — large square

Filenames reflect the nominal Figma design size, not necessarily the encoded pixel size of the file — see [`assets/canonical/manifest.json`](assets/canonical/manifest.json) for the authoritative dimensions, hashes, and metadata of each asset. These files are preserved byte-for-byte and are not licensed for reuse (see [Use Palembang](#use-palembang)); if you need a graphic you can actually use, generate one at [Get started](#get-started). Resized, recolored, or otherwise derived images belong in `assets/variants/`, never in place of a canonical file.

## Using Palembang

Implementations follow a single authority chain:

```text
original artwork reference
        ↓
canonical design specification
        ↓
Figma / source implementation
        ↓
canonical assets
        ↓
reference renderer, packages, and platform implementations
```

New platform implementations should be built from [`docs/specification.md`](docs/specification.md) and [`tokens/palembang.v1.json`](tokens/palembang.v1.json) — not approximated from screenshots of the canonical PNGs.

Implementation and package status:

| Component | Status |
|---|---|
| [SVG reference renderer](implementations/svg/README.md) | implemented and verified |
| [Web Playground](implementations/web/README.md) | implemented and deployed |
| [`@palembang/core`](packages/core/README.md) — JavaScript SDK | public on npm |
| [`@palembang/cli`](packages/cli/README.md) — CLI & automation | public on npm |
| [PalembangKit](packages/swift/README.md) — Swift SVG/data core | public in v0.7.0 |
| [PalembangSwiftUI](packages/swift/README-SwiftUI.md) — native Apple presentation layer | released in v0.8.0 |
| Standalone iPhone/macOS apps | future work |

## Repository map

```text
source/                 canonical Figma source and extracted design data
reference/               photographs of the physical painting (artistic reference)
assets/canonical/        preserved, all-rights-reserved reference PNG renders
assets/variants/          derived/resized/recolored outputs
docs/                    specification, design philosophy, implementation guide
tokens/                  machine-readable design tokens
implementations/svg/      verified Python SVG reference renderer
implementations/web/      deployed browser Playground (Standard/Custom/Wallpaper, palette, SVG/PNG export)
implementations/          canvas/, swiftui/ remain placeholders for future work
packages/core/            @palembang/core — public JavaScript rendering SDK
packages/cli/             @palembang/cli — public terminal/automation CLI
packages/swift/           PalembangKit (public Swift SVG/data core) and PalembangSwiftUI (released native Apple presentation layer, v0.8.0)
Package.swift             SwiftPM manifest for PalembangKit/PalembangSwiftUI (repository root, per SwiftPM convention)
```

## Contributing

New palettes, platform implementations, and packages are welcome. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md) for how canonical-value changes, new renderers, and palette-only contributions are reviewed, and [`docs/implementation-guide.md`](docs/implementation-guide.md) for how to build a new platform implementation from the canonical tokens. See [`CHANGELOG.md`](CHANGELOG.md) for release history.

## Rights & stewardship

This repository uses three licenses: source code is MIT-licensed; the reusable visual system and official-renderer output are CC BY 4.0-licensed (see [Use Palembang](#use-palembang)); the original artwork, photographs, Figma source, and canonical graphic assets are all rights reserved — public visibility here is not permission to reuse them. See [`VISUAL-LICENSE.md`](VISUAL-LICENSE.md), [`LICENSE.md`](LICENSE.md), and [`ARTWORK-RIGHTS.md`](ARTWORK-RIGHTS.md) for the full licensing structure and the maintainer's stewardship commitment toward the original artist.

## Status

**Current release: v0.8.0 — PalembangSwiftUI / Apple Native Presentation.**

Palembang can be rendered in the browser Playground, from terminals, servers,
shell scripts, and CI with `@palembang/cli`, from JavaScript with
`@palembang/core`, or from Swift with `PalembangKit`.

`PalembangKit` remains the Swift SVG/data core. `PalembangSwiftUI` provides
native Apple presentation on top of it. Standalone iPhone/macOS apps remain
future work.
See [`packages/swift/README.md`](packages/swift/README.md) and
[`packages/swift/README-SwiftUI.md`](packages/swift/README-SwiftUI.md).
