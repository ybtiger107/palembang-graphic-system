# Changelog

## 0.2.0 — 2026-09-23

Canonical Palembang system plus first verified SVG reference renderer.

- Added the dependency-light SVG reference renderer under `implementations/svg/`.
- Added arbitrary target dimensions through token-driven reconstruction rather than bitmap stretching.
- Documented and implemented the Figma → SVG affine gradient mapping.
- Added focused renderer checks for dimensions, normalized 50/50 geometry, token-derived gradients, layer order, deterministic output, and the 320 px haze exception.
- Validated representative SVG rasterizations against all four canonical variants without claiming pixel-perfect equivalence.
- Added all four completed user-supplied Palembang PNG graphics under `assets/canonical/png/`.
- Added `assets/canonical/manifest.json` with actual/nominal dimensions, hashes, aspect ratios, and image metadata.
- Documented that the 2560-named uploads are preserved at their received 2048-pixel-wide bitmap sizes rather than silently upscaled.
- Promoted canonical PNGs to first-class ready-to-use assets and renderer visual-validation targets.
- Added `assets/variants/` for resized/recolored/experimental derivatives.
- Narrowed `AGENTS.md` and `CLAUDE.md` to project-specific supplements and explicitly protected user/global instruction files from modification.
- Updated repository docs, validation rules, and integrity manifest accordingly.
- The canonical v0.1.0 source assets remain unchanged.

## 0.1.0 — 2026-09-23

Initial public-repository scaffold prepared.

- Preserved the original `Palembang.fig` source.
- Preserved an extracted copy of all Figma archive members.
- Added the canonical design/implementation specification.
- Added machine-readable v1 design tokens.
- Added original-artwork reference photographs.
- Documented design philosophy, implementation rules, source inventory, and licensing boundaries.
- Added integrity verification and local Git bootstrap scripts.
