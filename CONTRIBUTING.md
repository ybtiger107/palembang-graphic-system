# Contributing

Palembang is a geometry-first graphic system. Changes should make it clear whether they affect the canonical system or add a new optional variant.

## Before changing canonical values

1. Compare against `source/Palembang.fig`.
2. Check `assets/canonical/png/` for expected raster appearance.
3. Check `docs/specification.md` and `tokens/palembang.v1.json`.
4. Preserve exact source values unless the change is an explicit new system version.
5. Do not silently normalize away source exceptions.

## Platform implementations

A new renderer should document:

- the target rendering API;
- how Figma gradient transforms were converted;
- which source dimensions were used for visual validation;
- any known approximation or renderer-specific limitation.

## Palette themes

Palette-only contributions should modify scene color tokens only. Geometry, transforms, stop positions, layer order, opacity, and blend modes should remain unchanged.

## Visual assets and rights

Do not assume that artwork, reference photographs, Figma sources, or other visual assets are covered by the MIT code license. See `LICENSE.md` before contributing or redistributing visual material.


## Canonical raster assets

Files in `assets/canonical/png/` are immutable user-supplied canonical renders. Do not resize, recompress, optimize, recolor, or overwrite them in place. Put derived files under `assets/variants/` and record provenance when useful.
