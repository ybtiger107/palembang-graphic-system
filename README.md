<div align="center">

# Palembang

### Graphic System

A reusable graphic system distilled from a gifted, hand-painted seascape —
its composition, horizon, and light preserved; its palette and texture free to change.

<br>

<img src="assets/canonical/png/Palembang2560x1080.png" alt="Palembang canonical graphic: a calm horizon dividing a warm, right-biased sunset sky from a layered sea" width="100%">

<br><br>

**Playground — coming in v0.3.0** &nbsp;·&nbsp;
[Download v0.2.0](https://github.com/ybtiger107/palembang-graphic-system/releases/tag/v0.2.0) &nbsp;·&nbsp;
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

The [`implementations/svg`](implementations/svg/README.md) directory contains the first verified platform renderer. Web, Canvas, and SwiftUI adapters remain future work.

## Repository map

```text
source/               canonical Figma source and extracted design data
reference/             photographs of the physical painting (artistic reference)
assets/canonical/      preserved, ready-to-use PNG renders
assets/variants/        derived/resized/recolored outputs
docs/                  specification, design philosophy, implementation guide
tokens/                machine-readable design tokens
implementations/        platform renderers (placeholders for now)
```

## Rights & stewardship

This repository uses three licenses: source code is MIT-licensed; the reusable visual system and official-renderer output are CC BY 4.0-licensed (see [Use Palembang](#use-palembang)); the original artwork, photographs, Figma source, and canonical graphic assets are all rights reserved — public visibility here is not permission to reuse them. See [`VISUAL-LICENSE.md`](VISUAL-LICENSE.md), [`LICENSE.md`](LICENSE.md), and [`ARTWORK-RIGHTS.md`](ARTWORK-RIGHTS.md) for the full licensing structure and the maintainer's stewardship commitment toward the original artist.

## Status

**v0.2.0 — canonical system plus first verified SVG reference renderer.**

This release contains the original artwork references, the Figma source, canonical PNG assets, the design specification, machine-readable tokens, and a token-driven SVG renderer for arbitrary dimensions.
