<div align="center">

# Palembang

### Graphic System

A reusable graphic system distilled from a gifted, hand-painted seascape —
its composition, horizon, and light preserved; its palette and texture free to change.

<br>

<img src="assets/canonical/png/Palembang2560x1080.png" alt="Palembang canonical graphic: a calm horizon dividing a warm, right-biased sunset sky from a layered sea" width="100%">

<br><br>

[**Try Playground**](https://ybtiger107.github.io/palembang-graphic-system/) &nbsp;·&nbsp;
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
- [`tokens/palembang.v1.json`](tokens/palembang.v1.json) — machine-readable geometry, gradients, and color values

## Use Palembang

Palembang is meant to be used — in apps, websites, backgrounds, games, publications, and other creative work, including commercial projects.

Graphics you generate with the [SVG reference renderer](implementations/svg/README.md), or download as SVG/PNG assets from a GitHub Release, are licensed under **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)**: free to use, copy, redistribute, recolor, and adapt, commercially or non-commercially, with attribution. See [`VISUAL-LICENSE.md`](VISUAL-LICENSE.md) for the full scope and examples.

Attribution example:

```
Palembang Graphic System — ybtiger107
https://github.com/ybtiger107/palembang-graphic-system
CC BY 4.0
```

This is different from the **original painting, the reference photographs in `reference/`, the Figma master (`source/Palembang.fig`), and the canonical master assets in `assets/canonical/`** — those remain all rights reserved; publishing this repository does not grant reuse rights to them. See [`VISUAL-LICENSE.md`](VISUAL-LICENSE.md) and [`ARTWORK-RIGHTS.md`](ARTWORK-RIGHTS.md).

## Playground

Try it live: **[ybtiger107.github.io/palembang-graphic-system](https://ybtiger107.github.io/palembang-graphic-system/)**

The browser [Playground](implementations/web/README.md) lets you explore, customize, and export Palembang without installing anything:

- live Palembang preview, generated directly from the canonical tokens;
- Standard / Custom / Wallpaper output modes, with practical resolution presets (Square, Medium, Wide, common device and desktop wallpaper sizes);
- full palette customization across all six scene colors, including a curated palette gallery (Midnight, Ocean, Aurora, Desert, Rose, Monochrome, Obsidian, and more) alongside manual hex/swatch editing;
- copyable share links that reproduce an exact design — no account or backend involved;
- multiple named designs saved locally in your browser (save, rename, duplicate, delete);
- design export/import as a small, human-readable JSON file;
- SVG export and client-side PNG export;
- settings and saved designs persist in your browser (`localStorage`), so they survive reloads or an accidental tab close;
- one-click reset back to canonical Palembang for the design you're currently editing (saved designs are untouched).

Playground exports and shared designs follow the same [CC BY 4.0](#use-palembang) terms as the SVG reference renderer. See [`implementations/web/README.md`](implementations/web/README.md) for the full sharing/saved-designs model and privacy details.

## Generate Palembang

The canonical PNGs are the right choice when a ready-made raster is sufficient. For a different resolution or aspect ratio, or for scalable vector output, use the [SVG reference renderer](implementations/svg/README.md):

```sh
python3 implementations/svg/render.py \
  --width 2560 \
  --height 1080 \
  --output Palembang.svg
```

It reconstructs each target rectangle from the canonical tokens instead of stretching a bitmap. The renderer's source code is MIT-licensed; the SVG it generates is a usable output under CC BY 4.0 (see [Use Palembang](#use-palembang) above).

## Canonical assets

If you just need the official Palembang graphic, use these directly rather than recreating them:

- [`assets/canonical/png/Palembang.png`](assets/canonical/png/Palembang.png) — small square
- [`assets/canonical/png/Palembang2560x1080.png`](assets/canonical/png/Palembang2560x1080.png) — wide
- [`assets/canonical/png/Palembang2560x1664.png`](assets/canonical/png/Palembang2560x1664.png) — medium-wide
- [`assets/canonical/png/Palembang2560x2560.png`](assets/canonical/png/Palembang2560x2560.png) — large square

Filenames reflect the nominal Figma design size, not necessarily the encoded pixel size of the file — see [`assets/canonical/manifest.json`](assets/canonical/manifest.json) for the authoritative dimensions, hashes, and metadata of each asset.

These files are preserved byte-for-byte. Resized, recolored, or otherwise derived images belong in `assets/variants/`, never in place of a canonical file.

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
SVG / Web / Canvas / SwiftUI implementations
```

New platform implementations should be built from [`docs/specification.md`](docs/specification.md) and [`tokens/palembang.v1.json`](tokens/palembang.v1.json) — not approximated from screenshots of the canonical PNGs.

Implementation status:

| Platform | Status |
|---|---|
| [SVG reference renderer](implementations/svg/README.md) | implemented and verified |
| [Web Playground](implementations/web/README.md) | implemented and deployed |
| Canvas / SwiftUI | future work |

## Repository map

```text
source/               canonical Figma source and extracted design data
reference/             photographs of the physical painting (artistic reference)
assets/canonical/      preserved, ready-to-use PNG renders
assets/variants/        derived/resized/recolored outputs
docs/                  specification, design philosophy, implementation guide
tokens/                machine-readable design tokens
implementations/svg/    verified Python SVG reference renderer
implementations/web/    deployed browser Playground (Standard/Custom/Wallpaper, palette, SVG/PNG export)
implementations/        canvas/, swiftui/ remain placeholders for future work
```

## Rights & stewardship

This repository uses three licenses: source code is MIT-licensed; the reusable visual system and official-renderer output are CC BY 4.0-licensed (see [Use Palembang](#use-palembang)); the original artwork, photographs, Figma source, and canonical graphic assets are all rights reserved — public visibility here is not permission to reuse them. See [`VISUAL-LICENSE.md`](VISUAL-LICENSE.md), [`LICENSE.md`](LICENSE.md), and [`ARTWORK-RIGHTS.md`](ARTWORK-RIGHTS.md) for the full licensing structure and the maintainer's stewardship commitment toward the original artist.

## Status

**v0.3.0 — Palembang Playground: the first browser-based interactive release.**

Palembang can now be explored, customized, and exported directly in the browser at [ybtiger107.github.io/palembang-graphic-system](https://ybtiger107.github.io/palembang-graphic-system/) — no Figma, Python, or local tooling required. This release builds on v0.2.0's canonical system and verified SVG reference renderer, adding a deployed, dependency-free web Playground with cross-renderer parity against the Python implementation.
