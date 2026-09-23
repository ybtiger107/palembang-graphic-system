# Palembang Playground (web)

A dependency-free static web app that lets anyone explore the Palembang
Graphic System, recolor its six scene tokens, choose a format, and export
usable SVG/PNG graphics — without Figma, Python, or local tooling.

This is the first browser implementation referenced in the repository root
[`README.md`](../../README.md#using-palembang) as "Web ... future work."

## Architecture

```text
implementations/web/
├── index.html      structure: preview pane, controls, attribution footer
├── styles.css      restrained, dark-first design; responsive layout
├── palembang.js     pure renderer: tokens + palette + W/H -> SVG string
├── app.js           DOM wiring: palette editor, format controls, export
├── package.json     {"type": "module"} so Node treats these .js as ESM
└── test/
    ├── palembang.test.mjs      structural/unit checks (Node's test runner)
    ├── vendor/tiny-xml-parser.mjs  minimal XML element parser used only by tests
    ├── generate-js-svg.mjs      emits representative SVGs for parity checking
    └── parity_check.py          Python vs. JS cross-renderer parity check
```

No build step, bundler, or UI framework. `index.html` loads `app.js` as a
native ES module, which imports `palembang.js`. Everything runs in the
browser as static files, satisfying the GitHub Pages / no-backend
constraint.

## Renderer relationship to the Python SVG reference

`palembang.js`'s `renderSvg()` is a line-for-line port of
[`implementations/svg/render.py`](../svg/render.py)'s `render_svg()`:

- same Figma-matrix-to-SVG-matrix inversion (`inverseAffine` /
  `inverse_affine`);
- same gradient ids (`sky`, `sea-base`, `sea-haze`, `sea-glow`), same
  `objectBoundingBox` gradient space, same radial `cx/cy/r` and linear
  `x1/y1/x2/y2` base geometry before the Figma transform is applied;
  see [`implementations/svg/README.md`](../svg/README.md) for the mapping
  itself — it is not duplicated here to avoid the two renderers drifting
  apart in how they explain (not just implement) the math;
- same layer order (sky, sea base, silver haze, teal glow) and the same
  320×320 haze middle-stop-alpha exception;
- same rejection of non-canonical geometry tokens.

It differs only where the browser context requires it:

- `renderSvg()` accepts a runtime `palette` override (`{ "sky.hot": "#..." }`)
  merged over the token palette, for the palette editor. This does not
  change geometry, transforms, stop positions, opacity, or layer order —
  only the `stop-color` values, per the specification's palette-replacement
  contract (`docs/specification.md` §13).
- Exported SVGs optionally carry a `<metadata>` attribution string
  (`options.attribution`); the Python renderer does not add this.
- Number formatting relies on JS's `Number.prototype.toString()` (shortest
  round-trippable form, matching the intent of Python's trimmed `repr()`)
  rather than reproducing Python's exact string algorithm.

**Do not port new geometry, gradients, or effects into this file without
also updating `render.py` and re-running the parity check below** — the two
renderers are expected to describe the same scene.

## Cross-renderer parity

Run:

```sh
python3 implementations/web/test/parity_check.py
```

This generates SVGs from both renderers for six representative cases
(all four canonical sizes, one arbitrary size, and one palette-override
case), then compares, with numeric tolerance (`1e-6`, relative to
magnitude):

- root `width`/`height`/`viewBox`;
- gradient type (`radialGradient`/`linearGradient`) and `gradientUnits`;
- `gradientTransform` matrix components;
- stop `offset`, `stop-color`, `stop-opacity`;
- rect layer order, geometry, `opacity`, and `fill` reference.

Latest run (see command above to reproduce): **PARITY OK**, 6/6 cases, 0
mismatches. Rasterized pixel comparison was not performed — no PNG
rasterizer (`rsvg-convert`, `cairosvg`, headless browser) was available in
the working environment beyond `librsvg`'s shared library with no Python
bindings, and installing one was avoided per project policy against
installing large system packages for screenshots. The structural/numeric
comparison above is what the task brief lists as the minimum bar and is
what this check provides evidence for; it does not by itself prove
pixel-identical rasterization.

## Usage / local preview

Serve the **repository root** (not just this directory) with any static
file server, then open this directory:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/implementations/web/
```

Serving from the repo root matters only for local development: `palembang.js`
tries `./tokens/palembang.v1.json` first (the path used after deployment,
see below), then falls back to `../../tokens/palembang.v1.json` — the real
repository location — so local dev needs no copy or build step.

## Token loading on GitHub Pages

The Playground reads `tokens/palembang.v1.json` as its single source of
truth (no hard-coded duplicate token values in `palembang.js`). Because the
deployed Pages site's root is this directory (`implementations/web/`), not
the repository root, `tokens/palembang.v1.json` would not otherwise be
reachable from the deployed page. The Pages workflow
(`.github/workflows/pages.yml`) solves this with the smallest reproducible
option: it copies `tokens/palembang.v1.json` into `dist/tokens/` alongside
the deployed page (a build-time copy generated by CI, not a file committed
to git). `loadTokens()` tries the co-located path first and only falls back
to the repository-relative path for local dev.

## Format presets

| Preset | Ratio | Pixel family |
|---|---|---|
| Square | 1:1 | 2560×2560 |
| Medium | 20:13 | 2560×1664 |
| Wide | 64:27 | 2560×1080 |

These match the four canonical source variants in
`tokens/palembang.v1.json`'s `sourceVariants` (320×320 is reachable via
custom width/height). Custom width/height are also accepted (clamped to
16–6000px to keep the browser responsive); the preset selector reflects
"Custom" (no preset highlighted) whenever the current size doesn't exactly
match a preset.

Every size is reconstructed from the canonical normalized transforms
applied to freshly built half-height rectangles — never a cropped or
stretched bitmap — per `docs/specification.md` §7.1.

## Export behavior

- **SVG**: `renderSvg()` output at the exact requested width/height, with
  the current palette and a CC BY 4.0 attribution `<metadata>` element.
  Usable standalone (no external references).
- **PNG**: the exported SVG is rasterized client-side via
  `<canvas>`/`drawImage()` at the requested pixel dimensions and downloaded
  as PNG — no server round-trip. This keeps SVG and PNG visually aligned
  since the PNG is derived from the same SVG markup used for the `.svg`
  download.

## Palette editor

Exposes exactly the six scene tokens from `docs/specification.md` §13.1
(`sky.hot`, `sky.cool`, `sea.light`, `sea.dark`, `sea.haze`, `sea.glow`) via
a color swatch and a synced hex text field, with the original canonical
value shown underneath each. Edits are in-memory runtime overrides —
`tokens/palembang.v1.json` on disk is never modified. "Reset palette to
original" clears overrides; "Restore canonical Palembang" additionally
resets the format to the canonical Wide (2560×1080) preset.

## Licensing

- Code in this directory (`palembang.js`, `app.js`, `styles.css`,
  `index.html`, `test/`) is MIT, per `LICENSE.md` / `VISUAL-LICENSE.md`.
- Graphics generated by this Playground (SVG/PNG export) are CC BY 4.0, per
  `VISUAL-LICENSE.md` §1 ("visual outputs generated by the future official
  Palembang Playground"). The exported SVG includes a short attribution
  notice; the in-page footer provides the same attribution text (with a
  copy button) and a link to `VISUAL-LICENSE.md`.
- No protected canonical asset (`reference/`, `source/`, `assets/canonical/`)
  is bundled into the page or into downloadable output; only the six scene
  color values and the normalized geometry/gradient math are used, which
  `docs/specification.md` §5 identifies as within the open reusable-system
  scope.

## Accessibility / responsive notes

- All controls are native `<input>`/`<button>`/`<label>` elements (color
  pickers, text inputs, radio-button format presets, plain buttons) with
  associated `<label for>` text, so keyboard operation and screen-reader
  labeling come from the platform rather than custom ARIA widgets.
- Format presets are a native radio group (`role` is implicit), so arrow-key
  navigation and `aria-checked` state work without extra script.
- Export/copy status messages use `aria-live="polite"` regions.
- A skip link jumps directly to the controls heading.
- Layout is a single responsive column below 960px width (preview first,
  controls stacked beneath, export buttons immediately reachable) and a
  two-column layout above it (preview sticky alongside controls).
- Dark theme is the default (`color-scheme: dark`); a `prefers-color-scheme:
  light` media query provides a light palette. Contrast follows the
  surrounding site's existing dark palette conventions (`surround.dark`
  `#0B1014` family).

## Known limitations

- **Texture control intentionally omitted.** `docs/specification.md` §14
  reserves a `texture.intensity` token but does not yet define a concrete
  rendering algorithm for it (`canonical_texture_intensity: 0`, no
  implemented effect in `render.py` either). Exposing a control with no
  defined visual behavior would mean inventing new geometry/effect not
  sanctioned by the specification, so this MVP omits it. Add it here only
  after the specification defines the effect and `render.py` implements it
  first, keeping the two renderers in sync.
- No offline/service-worker support; a network request for the token JSON
  is required on load.
- PNG export dimensions are clamped to 6000px per side; very large exports
  are still limited by the browser's canvas memory, which varies by device.
- No automated visual regression screenshot pipeline; this environment had
  no headless browser or SVG rasterizer available (see "Cross-renderer
  parity" above). `node --test implementations/web/test/` and
  `parity_check.py` are the available automated coverage.
