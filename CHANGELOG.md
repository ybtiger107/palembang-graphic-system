# Changelog

## Unreleased — planned v0.4.0

"Shareable Palembang": designs can now be saved, shared, reopened, and remixed — still a fully static, backend-free app (no accounts, no cloud sync, no server, no analytics).

- Added shareable URL state: "Copy share link" encodes the current design (mode, format/preset/dimensions, palette overrides) into a compact, versioned, URL-safe `#ps=...` fragment (share schema v1, `implementations/web/share.js`). Opening a shared link loads the exact design as an immediately editable fork; a subtle "Shared design loaded" note appears near the preview, and the link does not overwrite your existing last-session design in this browser until you actually change or save something.
- Added URL-state precedence on load: a valid shared link wins over your last local session, which wins over canonical defaults.
- Added a curated palette gallery (`implementations/web/palettes.js`): Original, Midnight, Ocean, Aurora, Desert, Rose, Monochrome, Obsidian — each a deliberately designed, complete six-color set; a preset changes colors only, never geometry.
- Added multiple locally saved Palembang designs ("Saved Designs" section, `implementations/web/designs.js`, stored under the new `palembang-saved:v1` key, separate from the existing `palembang-playground:v1` last-session key): save current, rename, duplicate, delete, and share any saved design.
- Added design export/import as a small, versioned, human-readable JSON file (`*.palembang.json`); malformed or unsupported files are rejected with a clear error and never alter the current design.
- Preserved compatibility with existing v0.3.0 `palembang-playground:v1` sessions; the new saved-designs key is additive and starts empty for existing users.
- Clarified reset semantics: "Reset everything to canonical Palembang" resets only the current working design and its last-session entry — it never deletes saved designs.
- Added extensive unit test coverage for the new share/palette/saved-design/JSON logic, kept pure and DOM-independent; renderer math, tokens, and Python ↔ JS parity are unchanged.
- No protected canonical source asset (`reference/`, `source/`, `assets/canonical/`) is included in share links, saved designs, or exported/imported JSON files.

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
