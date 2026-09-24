# Canonical Raster Assets

This directory contains the **completed Palembang PNG graphics supplied by the user**. They are first-class canonical raster assets, not previews — the authoritative appearance every renderer is validated against.

## Rights

These files are **all rights reserved**, not CC BY 4.0 (see [`VISUAL-LICENSE.md`](../../VISUAL-LICENSE.md)). Their presence in this public repository is for reference and validation, not reuse — publishing them here does not grant permission to use them in an application, website, document, or design. Repository tooling and tasks may read them directly as a ready-made bitmap source (see the root [`CLAUDE.md`](../../CLAUDE.md)/[`AGENTS.md`](../../AGENTS.md)); that is a workflow convenience, not a license. If you need a Palembang graphic you can actually reuse, generate your own with the [Playground](https://ybtiger107.github.io/palembang-graphic-system/), [`@palembang/cli`](../../packages/cli/README.md), [`@palembang/core`](../../packages/core/README.md), or the [SVG reference renderer](../../implementations/svg/README.md) — those outputs are CC BY 4.0. See the root [`README.md`](../../README.md#use-palembang) for the full explanation.

Re-render from the specification instead of using a file here directly when a platform-native/vector implementation, a new aspect ratio, a palette variant, or an exact target resolution is required.

## Preserved files

| File | Nominal Figma variant | Actual stored bitmap | Role |
|---|---:|---:|---|
| `png/Palembang.png` | `320 × 320` | `320 × 320` | small square canonical render |
| `png/Palembang2560x1080.png` | `2560 × 1080` | `2048 × 864` | wide canonical render |
| `png/Palembang2560x1664.png` | `2560 × 1664` | `2048 × 1331` | medium-wide canonical render |
| `png/Palembang2560x2560.png` | `2560 × 2560` | `2048 × 2048` | large square canonical render |

The non-square/square 2560-named uploads were received in this project at 2048 px maximum width. Their **filenames and visual content are preserved unchanged**. Do not rename them to pretend the stored pixel dimensions are 2560.

See `manifest.json` for machine-readable dimensions, aspect ratios, hashes, and intended use.

## Mutation policy

Do not overwrite these files. Derived exports belong under `assets/variants/` (or a task-specific output directory) with clear provenance.
