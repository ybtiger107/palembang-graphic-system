# Changelog

## Unreleased — planned v0.7.0

PalembangKit / Swift SDK Foundation (in development, not yet released or
tagged):

- Added `PalembangKit`, a dependency-free Swift Package foundation for future
  iPhone and macOS Palembang apps — no JavaScript, Node, Python, DOM, WebKit,
  network access, or runtime token fetching.
- Added synchronous canonical SVG generation (`Palembang.renderSVG`) that
  reproduces the same renderer contract as `implementations/svg/render.py`
  and `@palembang/core`/`implementations/web/palembang.js`: 50/50 horizon,
  per-target-rectangle reconstruction, canonical gradient types and inverse-
  affine transform math, gradient IDs, stop order, opacities, layer order,
  the 320×320 haze exception, and arbitrary positive target dimensions.
- Added deterministic generated canonical token data
  (`CanonicalTokens.generated.swift`, via `scripts/generate-swift-tokens.mjs`
  with a `--check` drift mode) compiled in from `tokens/palembang.v1.json` —
  no runtime JSON loading, no filesystem access, no network access inside
  PalembangKit.
- Established this as the foundation a future `PalembangSwiftUI` product and
  native Apple visual adapter (Canvas/Core Graphics/Metal) can build on
  without changing PalembangKit's core API; no SwiftUI/UIKit/AppKit/WebKit
  imports and no native visual renderer are part of this release.
- Added cross-renderer parity tests comparing `Palembang.renderSVG` output
  byte-for-byte against `@palembang/core` for representative cases (wide,
  square, the 320×320 exception, custom aspect ratios, palette overrides,
  attribution on/off, explicit haze alpha).
- `Package.swift` added at the repository root (SwiftPM Git-dependency
  convention) with Swift sources under `packages/swift/`; existing JS
  packages and repository layout otherwise unchanged.

## 0.6.0 — 2026-09-24

CLI & Automation: released the official `@palembang/cli` package with
`palembang render` for exact-dimension SVG output to stdout or files, six-token
palette overrides, preserved attribution metadata, and deterministic terminal,
SSH, shell-script, and CI use through `@palembang/core` rather than a
duplicated renderer.

## 0.5.0 — 2026-09-23

Developer SDK: Palembang can now be rendered directly from JavaScript with the
dependency-free `@palembang/core` package.

## 0.4.0 — 2026-09-23

Shareable Palembang: designs can now be saved, shared, reopened, and remixed directly in the browser — still a fully static, backend-free app (no accounts, no cloud sync, no server, no analytics).

- Added versioned, shareable URL state: "Copy share link" encodes the current design into a compact `#ps=...` link (share schema v1).
- Opening a shared link restores the exact design as an immediately editable fork — a subtle notice confirms it, and it's yours to remix from the first click.
- Added a curated palette gallery (Original, Midnight, Ocean, Aurora, Desert, Rose, Monochrome, Obsidian) alongside manual six-color editing.
- Added multiple named designs saved locally in the browser, with save, load, rename, duplicate, and delete.
- Added `.palembang.json` design export/import, so a design can travel as a small, human-readable file outside the browser.
- Preserved compatibility with existing v0.3.0 local sessions; saved designs use a separate storage key and never overwrite or delete each other.
- Preserved the responsive desktop/mobile layout across all new controls.
- Privacy: share links, saved designs, and exported files contain only Palembang design state — no accounts, device identifiers, or analytics of any kind.
- Python ↔ JS renderer parity preserved; no protected canonical source asset (original artwork, reference photographs, Figma source, canonical master assets) changed.

## 0.3.0 — 2026-09-23

Palembang Playground: the first browser-based interactive release. Palembang can now be explored, customized, and exported directly in the browser at https://ybtiger107.github.io/palembang-graphic-system/.

- Added the live browser Playground (`implementations/web/`) — a dependency-free static web app, no framework, no backend.
- Added a token-driven browser SVG renderer (`palembang.js`) ported line-for-line from `implementations/svg/render.py`'s gradient-transform math, with a cross-renderer parity check confirming both renderers produce matching dimensions, gradient transforms, stops, opacity, and layer order.
- Added live six-color palette editing (hex + swatch inputs, per-token and full reset), applied at render time without modifying `tokens/palembang.v1.json` on disk.
- Added Standard / Custom / Wallpaper output workflows: Standard presets (Square, Medium, Wide) derive height from width automatically; Custom unlocks independent width/height; Wallpaper offers practical device and desktop resolution presets (phone, tablet, desktop FHD/QHD/4K, ultrawide).
- Added a responsive mobile layout (no horizontal overflow, single-column controls, preview tracks the selected aspect ratio with no letterboxing).
- Added client-side SVG export and client-side PNG export (rasterized from the same exported SVG, so the two stay visually aligned) — no server round-trip.
- Added `localStorage` persistence for mode, format/wallpaper selection, dimensions, and palette overrides, so settings survive reloads or an accidental tab close; added a one-click reset to canonical Palembang that also clears saved settings.
- Added GitHub Pages deployment (`.github/workflows/pages.yml`) under the `/palembang-graphic-system/` project path; the Playground is now live.
- Preserved canonical geometry, gradient transforms, layer order, and Python ↔ JS renderer parity throughout. No protected canonical source asset (`reference/`, `source/`, `assets/canonical/`) changed.

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
