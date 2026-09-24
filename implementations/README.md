# Platform Implementations

This directory holds Palembang's platform/reference implementations — the
renderers that establish and verify the canonical geometry on a given
target. It is not where the reusable developer-facing packages live; see
"implementations/ vs. packages/" below.

Platform homes:

- `svg/` — the verified, dependency-free Python SVG reference renderer
  (`render.py`). See [`svg/README.md`](svg/README.md).
- `web/` — the deployed browser Playground: a static SVG/PNG app built on a
  line-for-line JavaScript port of the Python renderer. See
  [`web/README.md`](web/README.md).
- `swiftui/`, `canvas/` — reserved for future native Apple/2D-canvas
  implementations; not yet started.

## implementations/ vs. packages/

- `implementations/` holds reference and platform implementations —
  verified renderers (the Python SVG renderer, the web Playground) used to
  define and check the canonical output, plus placeholders for future
  native platforms.
- [`packages/`](../packages/) holds the reusable, published
  developer/user-facing interfaces built from that same canonical data:
  [`packages/core/`](../packages/core/README.md) (`@palembang/core`, a
  JavaScript rendering SDK) and [`packages/cli/`](../packages/cli/README.md)
  (`@palembang/cli`, a terminal/CI command built on `@palembang/core`).

In short: `implementations/` is where Palembang is verified;
`packages/` is what most users and applications should actually install.

## Acceptance rule

Do not call an implementation "canonical" merely because it looks similar at one size. It must preserve the normalized geometry and be checked against at least one square and one wide Figma source variant.

The exact source transforms are in `tokens/palembang.v1.json` and `docs/specification.md`.
