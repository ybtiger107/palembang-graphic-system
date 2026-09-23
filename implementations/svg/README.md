# SVG reference renderer

This directory contains the dependency-free reference renderer for the canonical Palembang graphic. It reconstructs the two half-height fields for every requested rectangle; it does not crop or stretch a square master.

## Authority

The renderer reads `tokens/palembang.v1.json`. The interpretation of the normalized geometry and paint layers comes from `docs/specification.md` and `docs/implementation-guide.md`. The preserved PNGs under `assets/canonical/png/` are visual-validation targets, not geometry inputs.

## Usage

```sh
python3 implementations/svg/render.py \
  --width 2560 --height 1080 \
  --output /tmp/palembang-2560x1080.svg
```

Any finite positive width and height are accepted. The canonical source sizes can be generated directly:

```sh
python3 implementations/svg/render.py --width 320  --height 320  --output /tmp/palembang-320.svg
python3 implementations/svg/render.py --width 2560 --height 1080 --output /tmp/palembang-wide.svg
python3 implementations/svg/render.py --width 2560 --height 1664 --output /tmp/palembang-medium.svg
python3 implementations/svg/render.py --width 2560 --height 2560 --output /tmp/palembang-square.svg
```

The 320×320 source exception is selected automatically. Use `--haze-middle-alpha 0.8` or `1.0` when an explicit source choice is needed.

## Figma → SVG gradient mapping

The matrices in the token file are Figma matrices that map normalized shape coordinates to normalized gradient coordinates:

```text
g = FigmaMatrix * shape
```

SVG `gradientTransform` has the opposite direction: it maps the gradient's coordinate system into the target object. The renderer therefore computes the affine inverse for every paint:

```text
shape = inverse(FigmaMatrix) * g
```

For SVG's `matrix(a b c d e f)`, a row-form matrix
`[[m00, m01, m02], [m10, m11, m12]]` is serialized as
`matrix(m00 m10 m01 m11 m02 m12)`. All gradients use `objectBoundingBox`, so the resulting inverse remains normalized for each half-height rectangle. Radial gradients use the canonical unit circle centered at `(0.5, 0.5)`; the haze uses the canonical horizontal unit line centered at `y=0.5` before its inverse transform is applied.

This conversion is the reason the token matrices are not copied verbatim into SVG.

## Layer model and limitations

The SVG contains one sky paint and three lower-field paints in the required order: sky, sea base, silver haze, and teal glow. Paint opacity, stop positions, colors, alpha, and blend mode (`normal`, represented by the SVG default) are read from the tokens. The circular source treatment is a presentation mask around the unchanged 320×320 scene and is intentionally outside this rectangular renderer's output.

The implementation does not add texture, clouds, waves, a sun disk, or a package/runtime dependency. SVG rasterizers can differ in gradient interpolation and edge antialiasing, so exact PNG byte equality is not expected.

## Validation status

`test_render.py` checks XML parsing, dimensions, the exact 50/50 seam, layer order, token-derived structure, the 320 haze exception, arbitrary sizes, and deterministic serialization. `scripts/verify.py` protects all preserved canonical files. Using the already-installed `librsvg-2.so.2` library, rasterized outputs were visually inspected and compared at all four stored canonical bitmap sizes; mean absolute RGB differences were 0.833 (320), 0.426 (wide), 0.449 (medium), and 0.457 (square). Differences are expected from Figma/librsvg interpolation and the medium asset's rounded stored height (`2048×1331`).
