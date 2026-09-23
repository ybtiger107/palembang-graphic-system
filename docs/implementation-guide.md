# Implementation Guide

This guide describes how to turn the canonical Palembang data into platform implementations without losing the design rules captured in `docs/specification.md`.

## 1. Choose direct asset use or rendering

If the consumer only needs a raster image at one of the preserved aspect ratios, prefer the completed files in `assets/canonical/png/`. Choose through `assets/canonical/manifest.json`; do not regenerate them unnecessarily.

If the task requires a platform-native/vector renderer, a new aspect ratio or resolution, or a theme/texture variant, use `tokens/palembang.v1.json` as the machine-readable input. `docs/specification.md` remains the human-readable authority when interpretation is required.

Do not derive implementation values by sampling the preview thumbnail or reverse-engineering geometry from raster antialiasing.

## 2. Build the geometry per output rectangle

Given a target rectangle `W × H`:

```text
upper = (0, 0, W, H * 0.5)
lower = (0, H * 0.5, W, H * 0.5)
```

The horizon remains at exactly `0.5H` in vector space.

For raster APIs with an odd number of pixels in height, use a shared seam and resolve a possible 1-pixel antialias artifact as a rasterization issue. Do not redefine the conceptual ratio.

## 3. Render paint layers in order

### Upper half

Render exactly one radial-gradient paint using:

- canonical sky transform;
- `sky.hot` at position `0`;
- `sky.cool` at position `1`;
- opacity `1`;
- normal blending.

### Lower half

Render three paints in this order:

1. sea base radial gradient;
2. silver haze linear gradient;
3. teal glow radial gradient.

Each paint has its own transform, stops, opacity, and alpha data in the token file.

## 4. Convert Figma transforms; do not blindly copy them

The stored matrices are exact Figma normalized gradient transforms. They are canonical data, but target APIs differ in how gradient coordinates and affine transforms are defined.

A platform adapter must:

1. determine the platform's gradient coordinate convention;
2. convert the Figma transform to that convention;
3. render a known source size;
4. compare the result visually against the matching canonical PNG render(s);
5. use the Figma source/specification to diagnose any geometric or transform discrepancy;
6. only then treat the adapter as a reference implementation.

Until that conversion is verified, do not label an implementation pixel-equivalent or canonical.

## 5. Palette themes

For a palette-only theme, replace only:

```text
sky.hot
sky.cool
sea.light
sea.dark
sea.haze
sea.glow
```

Keep geometry, transforms, stop positions, alpha, opacity, blend modes, and layer order unchanged.

The optional `surround.dark` token belongs to the circular presentation rather than the scene itself.

## 6. Texture

Canonical texture intensity is `0`.

If texture is introduced:

- apply it after or alongside the canonical rendering without shifting geometry;
- keep it independently disableable;
- avoid adding literal clouds, waves, foam, or a sun disk in canonical mode;
- verify that setting intensity back to zero reproduces the untextured scene.

## 7. Aspect-ratio variants

The preserved source includes:

- `320 × 320`;
- `2560 × 1080`;
- `2560 × 1664`;
- `2560 × 2560`.

Use these as nominal source-format validation targets for adapters. The corresponding completed raster renders are in `assets/canonical/png/`. Note that the supplied 2560-named PNG files are stored at 2048 px maximum width in this repository; see `assets/canonical/manifest.json`. The variants demonstrate that transforms are normalized to the corresponding half-rectangles rather than to a single fixed-size square.

## 8. Small-source exception

The `320 × 320` Figma source uses a haze middle-stop alpha of `1.0`; the 2560-wide variants use approximately `0.8`.

For new variants, the specification adopts `0.8` as the canonical system default while preserving the 320-specific exception as source history.

## 9. Circular presentation

The circular variant does not alter the internal scene.

1. render the square Palembang scene;
2. clip it to a circle;
3. optionally place it over the source dark surround;
4. do not recenter or recompute gradients for the circular mask.

Exact 320 px source geometry is stored in the token file and specification.

## 10. Validation checklist

Before calling an adapter canonical, verify at minimum:

- horizon is exactly centered;
- sky focal field remains right-biased;
- lower field contains all three paints in the right order;
- source colors match in the original theme;
- wide versions are reconstructed rather than cropped;
- circular masking does not alter internal paint geometry;
- both square and wide validation targets agree visually with Figma;
- the 320 exception is either reproduced explicitly or documented as intentionally normalized.
