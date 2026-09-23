# Palembang Playground (web)

A dependency-free static web app that lets anyone explore the Palembang
Graphic System, pick a format or an exact wallpaper resolution, recolor its
six scene tokens, and export usable SVG/PNG graphics — without Figma,
Python, or local tooling. Settings persist across reloads via
`localStorage`.

This is the first browser implementation referenced in the repository root
[`README.md`](../../README.md#using-palembang) as "Web ... future work."

## Architecture

```text
implementations/web/
├── index.html          structure: format/palette/export controls, preview, attribution footer
├── styles.css          restrained, dark-first design; responsive layout
├── palembang.js         pure renderer: tokens + palette + W/H -> SVG string
├── playground-state.js  pure preset/state/persistence logic (no DOM, no localStorage)
├── app.js               DOM wiring: reads/writes localStorage, builds controls, calls the above
├── package.json         {"type": "module"} so Node treats these .js as ESM
└── test/
    ├── palembang.test.mjs         renderer structural/unit checks (Node's test runner)
    ├── playground-state.test.mjs  preset/derivation/persistence unit checks
    ├── layout.test.mjs            static CSS/JS regression checks for the responsive fixes
    ├── vendor/tiny-xml-parser.mjs  minimal XML element parser used only by tests
    ├── generate-js-svg.mjs         emits representative SVGs for parity checking
    └── parity_check.py             Python vs. JS cross-renderer parity check
```

No build step, bundler, or UI framework. `index.html` loads `app.js` as a
native ES module. `app.js` imports the pure renderer (`palembang.js`) and
the pure state/preset logic (`playground-state.js`); it owns all DOM access
and the two `localStorage.getItem`/`setItem` calls, so the state logic
itself stays testable under Node without a browser or a `localStorage`
shim. Everything runs in the browser as static files, satisfying the
GitHub Pages / no-backend constraint.

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

## Interaction model: Format comes before Palette

Controls are ordered Format → Palette → Export, on the premise that people
usually decide *what the graphic is for* (a square avatar? a desktop
wallpaper?) before they decide *what color it should be*.

### Output mode: Standard vs. Wallpaper

A two-way toggle at the top of Format selects the mode. Only one mode's
controls are shown at a time (the other is `hidden`, not just disabled) —
whichever mode is inactive is fully out of the way rather than visible-but-
greyed-out, per the "should feel clean, not cluttered" requirement.

**Standard mode** — Square / Medium / Wide / Custom:

| Preset | Ratio | Default resolution |
|---|---|---|
| Square | 1:1 | 2560 × 2560 |
| Medium | 20:13 | 2560 × 1664 |
| Wide | 64:27 | 2560 × 1080 |
| Custom | (yours) | whatever you set |

These match the four canonical source variants in
`tokens/palembang.v1.json`'s `sourceVariants` (320×320 is reachable via
Custom). Selecting Square/Medium/Wide sets width *and* height to that
preset's default resolution immediately.

For **Square/Medium/Wide**, only **width** is meant to be edited day-to-day:
the **height field is read-only** (`readOnly`, not `disabled` — still
focusable/selectable/announced correctly by assistive tech, just not
editable) and is recomputed from the preset's canonical ratio every time
width changes, via `deriveStandardHeight()` in `playground-state.js`. This
avoids the old UX where users had to keep two numbers in sync by hand to
avoid accidentally distorting the ratio.

**Custom** is the explicit escape hatch: switching to it unlocks both width
and height as independent fields. Whatever size was on screen a moment ago
(the standard preset's derived size, *or* the wallpaper preset's exact
pixels if you arrived from Wallpaper mode) is copied in as the starting
point (`switchToCustomPreset()`), so switching to Custom never jumps to an
unrelated size.

**Wallpaper mode** replaces the format/custom controls with a single
device/display picker (a grouped `<select>`: Phone / Tablet / Desktop /
Ultrawide). The selected preset is the sole source of truth for both
dimensions — width/height inputs are not shown at all in this mode, so
there is nothing to accidentally type an unmatched value into:

| Group | Presets |
|---|---|
| Phone | iPhone 1290×2796, iPhone 1179×2556 |
| Tablet | iPad 2048×2732 |
| Desktop | FHD 1920×1080, QHD 2560×1440, 4K 3840×2160 |
| Ultrawide | 3440×1440, 5120×1440 |

Every size — Standard, width-adjusted Standard, Custom, or Wallpaper — is
reconstructed from the canonical normalized transforms applied to freshly
built half-height rectangles — never a cropped or stretched bitmap — per
`docs/specification.md` §7.1. `computeEffectiveDimensions(state)` in
`playground-state.js` is the single function that decides "what size is it
right now" for preview and export alike, so the two can't drift apart.

### Persistence (localStorage)

Mode, the active Standard preset and its width, Custom width/height, the
selected Wallpaper preset, and any palette overrides are saved to
`localStorage` under `palembang-playground:v1` after every change
(`serializeState()`/`restoreState()` in `playground-state.js`; `app.js`
does the actual `getItem`/`setItem` calls). Only tokens that differ from
the canonical palette are stored, so the save stays small and immune to
future palette-key additions.

On load, `restoreState()` validates the saved JSON **field by field**: an
individually invalid or unrecognized value (a foreign mode string, an
out-of-range width, a malformed hex color, a future/renamed key) falls back
to the canonical default *for that field only*, rather than discarding the
whole saved session over one bad field. Missing, unparseable, or
non-object JSON falls back to the full canonical default state. This
degrades gracefully across a future settings-schema change instead of
silently losing a user's whole session.

"Reset everything to canonical Palembang" (`fullReset()` in `app.js`) both
clears the saved `localStorage` entry and resets the in-memory state to
`createDefaultState()` — canonical palette, Standard mode, canonical Wide
preset — so a user is never stuck with a corrupted or unwanted saved state.
"Reset palette to original" (in the Palette section) only resets colors,
leaving the current format/mode alone.

If `localStorage` is unavailable (private browsing, disabled storage), both
read and write are wrapped in `try/catch`: the Playground still works for
the current tab, it just won't remember settings across a reload.

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
original" clears only the color overrides; "Reset everything to canonical
Palembang" (see Persistence above) additionally resets format/mode to
canonical Wide and clears the saved `localStorage` session.

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

- All controls are native `<input>`/`<select>`/`<button>`/`<label>` elements
  (color pickers, text inputs, radio-button mode/format presets, a grouped
  `<select>` for wallpaper presets, plain buttons) with associated
  `<label for>` text, so keyboard operation and screen-reader labeling come
  from the platform rather than custom ARIA widgets.
- Output mode and Standard format presets are native radio groups (`role`
  is implicit), so arrow-key navigation and checked state work without
  extra script. The locked height field in Standard mode uses `readOnly`
  (never `disabled`), so it stays focusable/announced as read-only instead
  of being removed from tab order.
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
- Saved settings are per-browser (`localStorage`), not synced across
  devices or browsers, and are cleared if the user clears site data.
- PNG export dimensions are clamped to 6000px per side; very large exports
  are still limited by the browser's canvas memory, which varies by device.
- No automated visual regression screenshot pipeline; this environment had
  no headless browser or SVG rasterizer available (see "Cross-renderer
  parity" above). `node --test implementations/web/test/` and
  `parity_check.py` are the available automated coverage.
