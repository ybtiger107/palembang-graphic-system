# Platform Implementations

This directory is reserved for verified renderers and adapters.

Platform homes:

- `web/` — browser implementation, likely Canvas/WebGL/SVG depending on fidelity.
- `svg/` — dependency-light reference SVG renderer (`render.py`).
- `swiftui/` — Apple-platform implementation.
- `canvas/` — general 2D-canvas reference implementation.

## Acceptance rule

Do not call an implementation "canonical" merely because it looks similar at one size. It must preserve the normalized geometry and be checked against at least one square and one wide Figma source variant.

The exact source transforms are in `tokens/palembang.v1.json` and `docs/specification.md`.
