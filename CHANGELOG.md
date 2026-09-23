# Changelog

## Unreleased — planned v0.3.0

Palembang Playground: a static browser tool to explore, recolor, and export the graphic system.

- Added `implementations/web/`: a dependency-free static web app (HTML/CSS/ES modules, no framework, no backend).
- Added `palembang.js`, a browser-side renderer ported line-for-line from `implementations/svg/render.py`'s gradient-transform math, so both renderers describe the same canonical scene.
- Added a live preview, palette editor (six scene tokens with hex/swatch inputs and per-session reset), format presets (Square/Medium/Wide, matching the canonical source variants) plus custom width/height, client-side SVG export, and client-side PNG export rasterized from the exported SVG.
- Added a cross-renderer parity check (`implementations/web/test/parity_check.py`) comparing Python- and browser-generated SVGs for dimensions, gradient transforms, stops, opacity, and layer order across representative sizes and a palette override.
- Added Node-based unit tests for the browser renderer (`implementations/web/test/`), mirroring the existing Python renderer tests.
- Added a GitHub Actions Pages workflow (`.github/workflows/pages.yml`), prepared but not yet enabled/deployed.
- Runtime palette edits never modify `tokens/palembang.v1.json` on disk; exported SVG/PNG graphics remain CC BY 4.0 per `VISUAL-LICENSE.md`. No protected canonical asset is bundled into the Playground or its exports.
- Updated the root `README.md` with a "Playground — coming in v0.3.0" entry point (not yet a live link).

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
- Defined the public-use licensing model: MIT for software, CC BY 4.0 for the reusable visual system and official-renderer output, all rights reserved for canonical/original materials. Added `VISUAL-LICENSE.md`, updated `LICENSE.md` and `ARTWORK-RIGHTS.md`, and added a license notice to the SVG renderer release archive.

## 0.1.0 — 2026-09-23

Initial public-repository scaffold prepared.

- Preserved the original `Palembang.fig` source.
- Preserved an extracted copy of all Figma archive members.
- Added the canonical design/implementation specification.
- Added machine-readable v1 design tokens.
- Added original-artwork reference photographs.
- Documented design philosophy, implementation rules, source inventory, and licensing boundaries.
- Added integrity verification and local Git bootstrap scripts.
