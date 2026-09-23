# Agent Instructions — Palembang Graphic System

This file contains **repository-scoped additions** for Palembang. It does not replace user/global agent instructions. Follow applicable global instructions first, then apply these project-specific rules where they do not conflict.

Do not modify, regenerate, copy over, or delete user/global instruction files outside this repository (for example `~/.codex/AGENTS.md`, other home-level `AGENTS.md` files, or global Claude configuration/instruction files) unless the user explicitly asks for that exact change.

## Design authority

Use the following sources according to purpose:

1. `source/Palembang.fig` — preserved editable canonical design source.
2. `assets/canonical/png/` — preserved completed PNG renders supplied by the user; preferred ready-to-use raster assets and visual-validation targets.
3. `docs/specification.md` — complete human-readable canonical specification.
4. `tokens/palembang.v1.json` — machine-readable implementation values.
5. `reference/` — photographs of the physical painting; artistic reference, not a pixel-tracing target.

If these appear to disagree, do not silently normalize them. Identify whether the difference is a source-design value, an export/resampling difference, or an implementation error.

## Canonical PNG assets

When a task only needs an existing Palembang bitmap, use `assets/canonical/png/` directly instead of regenerating the graphic.

Read `assets/canonical/manifest.json` to choose the appropriate asset. Preserve the PNG files byte-for-byte. Their filenames contain the nominal Figma variant dimensions, but several supplied chat-upload bitmaps are stored at 2048 px maximum width; the manifest records both nominal design size and actual stored pixel size.

Do not upscale, recompress, recolor, optimize, or overwrite a canonical PNG in place. Put derived assets in `assets/variants/` or another clearly named output directory.

## Canonical invariants

Preserve unless the user explicitly creates a new system version:

- horizon at normalized `y = 0.5`;
- two half-height fields rebuilt for every target aspect ratio;
- exact Figma gradient types, transforms, stop positions, opacity, and layer order;
- right-biased warm focal structure;
- one sky paint and three lower-field paints;
- source-specific 320 px haze exception as documented history;
- circular presentation as a mask/presentation variant, not a re-centered scene.

A pure palette change changes scene color tokens only.

## Preserved files

Do not edit, optimize, recompress, normalize, replace, or regenerate in place:

- `source/Palembang.fig`;
- files in `source/extracted/`;
- files in `reference/`;
- files in `assets/canonical/png/`.

If a modified visual source is needed, create a clearly named derived file elsewhere and preserve the original.

Run `python3 scripts/verify.py` after any task that could have touched preserved files.

## Implementation work

Put platform renderers under `implementations/<platform>/`.

For visual verification, compare renderers against the canonical PNGs in both a square and a wide format. The Figma source and specification remain authoritative for geometry/transform interpretation.

Do not claim that stored Figma 2×3 gradient matrices can be copied directly into CSS/SVG/SwiftUI/Canvas affine APIs without conversion. Document platform-specific approximations and limitations.

## Design exploration

New palettes, texture treatments, expressive variants, or experimental geometry must not overwrite the canonical source, canonical PNGs, or v1 tokens. Put experiments in a new named theme/variant/version and state which invariants are intentionally relaxed.

## Git behavior

Keep commits focused and use concise English commit messages. Local commits are allowed when work is complete and verified. Do not push, publish, create releases, or change the public license without explicit user authorization for that action and destination.

## Provenance privacy

Public provenance is intentionally minimal.

- The original painting was personally given to the maintainer as a gift by a friend.
- Do not expand the public provenance beyond that statement unless the user explicitly requests it.
- Do not infer, reconstruct, restore, or publish removed provenance details from prior drafts, Git history, conversations, or external sources.
