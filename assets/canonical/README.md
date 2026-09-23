# Canonical Raster Assets

This directory contains the **completed Palembang PNG graphics supplied by the user**. They are first-class canonical raster assets, not previews.

Use these files directly whenever an application, website, document, mockup, or design task only needs an existing bitmap. Re-render from the specification only when a platform-native/vector implementation, a new aspect ratio, a palette variant, or an exact target resolution is required.

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
