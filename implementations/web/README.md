# Palembang Playground (web)

A dependency-free static web app that lets anyone explore the Palembang
Graphic System, pick a format or an exact wallpaper resolution, recolor its
six scene tokens (by hand or from a curated palette), and export usable
SVG/PNG graphics — without Figma, Python, or local tooling. A design can be
copied as a share link, saved locally under a name, duplicated, or
exported/imported as a small JSON file; settings and saved designs persist
across reloads via `localStorage`.

This is the first browser implementation, deployed as of v0.3.0. See the
repository root [`README.md`](../../README.md#playground) for the public
entry point and the [`README.md`](../../README.md#using-palembang)
implementation-status table.

## Architecture

```text
implementations/web/
├── index.html          structure: format/palette/saved-designs/share/export controls, preview, attribution footer
├── styles.css          restrained, dark-first design; responsive layout
├── palembang.js         pure renderer: tokens + palette + W/H -> SVG string
├── playground-state.js  pure format/mode/dimension logic + last-session persistence (no DOM)
├── palettes.js           pure curated-palette data + resolver (no DOM)
├── share.js              pure share-URL schema v1 + boot-precedence logic (no DOM)
├── designs.js            pure saved-designs CRUD + JSON file envelope (no DOM)
├── app.js                DOM wiring: reads/writes localStorage, builds controls, calls the above
├── package.json         {"type": "module"} so Node treats these .js as ESM
└── test/
    ├── palembang.test.mjs          renderer structural/unit checks (Node's test runner)
    ├── playground-state.test.mjs   preset/derivation/persistence unit checks
    ├── palettes.test.mjs           curated-palette data/behavior checks
    ├── share.test.mjs              share-schema encode/decode/precedence checks
    ├── designs.test.mjs            saved-designs CRUD + JSON import/export checks
    ├── layout.test.mjs             static CSS/JS regression checks for responsive/overflow fixes
    ├── vendor/tiny-xml-parser.mjs  minimal XML element parser used only by tests
    ├── generate-js-svg.mjs         emits representative SVGs for parity checking
    └── parity_check.py             Python vs. JS cross-renderer parity check
```

No build step, bundler, or UI framework. `index.html` loads `app.js` as a
native ES module. `app.js` imports four pure, DOM-free modules —
`palembang.js` (the renderer), `playground-state.js` (format/mode/dimension
logic and last-session persistence), `palettes.js` (curated palettes), and
`share.js` + `designs.js` (sharing and saved designs) — and owns all DOM
access and every `localStorage`/`location`/`File` call itself, so all the
actual state logic stays testable under Node without a browser or any
shim. Everything runs in the browser as static files, satisfying the
GitHub Pages / no-backend constraint. No new runtime dependency was added
for any of this — `btoa`/`atob`, `crypto.randomUUID`, `URLSearchParams`,
`<dialog>`, and the Clipboard API are all standard, already-available
platform features.

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

### Last-session persistence (localStorage)

Mode, the active Standard preset and its width, Custom width/height, the
selected Wallpaper preset, and any palette overrides are saved to
`localStorage` under `palembang-playground:v1` after every change
(`serializeState()`/`restoreState()` in `playground-state.js`; `app.js`
does the actual `getItem`/`setItem` calls). Only tokens that differ from
the canonical palette are stored, so the save stays small and immune to
future palette-key additions.

This is the *current working design* only — one slot, overwritten on every
change, restored automatically on your next visit unless a share link takes
precedence (see "Sharing" below). For multiple named designs you keep on
purpose, see "Saved designs" below, which uses a separate storage key
(`palembang-saved:v1`) and is never touched by this key or by "Reset
everything to canonical Palembang."

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

## Sharing

"Copy share link" (Share & Export section) encodes the *current* design —
mode, format/preset/dimensions, and any palette overrides — into the page's
URL, so a recipient who opens it sees the exact same design, immediately
editable. Sharing does not require `localStorage` at all: everything needed
to reconstruct the design is in the URL itself.

### Share schema v1 (`share.js`)

The link looks like `https://.../palembang-graphic-system/#ps=<encoded>`.
`<encoded>` is a small JSON object, base64url-encoded (`+`/`/` → `-`/`_`,
no `=` padding) so it needs no further percent-encoding in a URL:

```json
{ "v": 1, "m": "s", "p": "wide", "w": 2560, "c": ["#ff3366", null, null, null, null, null] }
```

| Key | Meaning |
|---|---|
| `v` | share schema version (this build only understands `1`) |
| `m` | mode: `"s"` (standard) or `"w"` (wallpaper) |
| `p` | preset id — a `STANDARD_PRESETS` id or `"custom"` for mode `s`; a `WALLPAPER_PRESETS` id for mode `w` |
| `w`, `h` | width (mode `s`, always) and height (only when `p` is `"custom"`); omitted for mode `w`, whose preset already fixes both dimensions |
| `c` | optional palette-override array, positionally matching `scenePaletteTokens()` order (`sky.hot, sky.cool, sea.light, sea.dark, sea.haze, sea.glow`); `null` per slot means "use the canonical color"; the whole key is omitted when nothing is overridden (the common case, and all of "Original") |

Nothing else is in the payload: no saved-design ids, timestamps, device
info, or analytics — see "Privacy" below. The full field-by-field contract
and failure policy are documented in `share.js`'s module doc comment; treat
that as the source of truth if this table and the code ever disagree.

**Failure policy:** `decodeShareState()` never throws. A value that isn't
recoverably a v1 payload at all (bad base64, bad JSON, a non-object, an
unrecognized `v`) returns `null`. Individual bad *fields* inside an
otherwise-valid v1 payload (a tampered preset id, a malformed hex color)
fall back to the canonical default for that field alone — the same
graceful, field-by-field policy `restoreState()` already uses for the
last-session key.

### URL-state precedence

On load (`resolveBootState()` in `share.js`, called from `app.js`'s
`init()`):

1. a valid shared URL state (`#ps=...`) — if present and decodable, wins;
2. otherwise, the last local session (`palembang-playground:v1`);
3. otherwise, canonical defaults.

Opening a shared link does **not** immediately overwrite your last local
session in `localStorage` — it's loaded as the active design and shown with
a subtle "Shared design loaded — now yours to edit" note near the preview,
but nothing is persisted until you actually change something (edit a
color, change format, switch mode, etc.) or explicitly save/export it. This
is `applyEffective({ skipPersist: true })`'s only use: it covers exactly
the first render after a share load, so clicking someone's link can never
silently discard your own in-progress design. Every subsequent action
persists normally, because by then it's a genuine change you made.

**Shared designs are forks, not immutable documents** — the moment you
touch anything, you're editing your own copy; save it or copy a new share
link from it like any other design.

### Building and copying a link

"Copy share link" builds the URL from `location.origin + location.pathname`
(never a hard-coded production URL), so it works correctly both at
`https://ybtiger107.github.io/palembang-graphic-system/` and when this
Playground is self-hosted from any other static base path. The link is
placed in a visible, selectable read-only text field as a fallback in
addition to the `navigator.clipboard.writeText()` call, so a clipboard
permission failure still leaves the user with a link they can select and
copy by hand. Each saved design's row also has its own "Share" action,
which builds a link for *that* design without first loading it into the
live working state.

No link-shortening service is used or contacted.

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

## Curated palettes

`palettes.js` exports a restrained, deliberately-designed gallery
(`CURATED_PALETTES`) shown as a row of small gradient swatches above the
six-token editor: **Original, Midnight, Ocean, Aurora, Desert, Rose,
Monochrome, Obsidian**. Clicking one replaces all six scene colors at once;
the six-token editor below it still lets you fine-tune from there.

A palette preset changes **only** `sky.hot`, `sky.cool`, `sea.light`,
`sea.dark`, `sea.haze`, `sea.glow` — never geometry, gradient transforms,
stop positions, the horizon, dimensions, format, or layer order (enforced
by construction: `resolveCuratedPalette()` only ever reads/returns those
six keys, and `palettes.test.mjs` verifies applying every preset leaves a
rendered SVG's `gradientTransform`/layer-order/stop-offsets/dimensions
byte-identical to canonical, changing only `stop-color`).

**Original** has no hard-coded colors of its own (`colors: null` in the
data table) — it resolves to whatever the canonical token palette actually
is at runtime, so it can never drift from `tokens/palembang.v1.json`. Every
other preset defines a complete, deliberate set for all six roles, per the
role philosophy in `docs/specification.md` §13.3 (`sky.hot` stays the
warm/energetic focal role even when recolored, `sky.cool` the surrounding
field, `sea.light`/`sea.dark` the lower-half depth contrast, `sea.haze` a
neutral separator, `sea.glow` a secondary translucent atmosphere) — not
independent, uncontrolled RGB values per token.

## Saved designs

The "Saved Designs" section extends persistence from "one current working
design" to multiple named designs, stored under the separate localStorage
key `palembang-saved:v1` (`designs.js`; deliberately independent of
`palembang-playground:v1` so the two can't corrupt each other and so a
"Reset everything" never touches your saved list — see "Reset semantics"
below).

**Save current** creates a new entry immediately — no name prompt required
— defaulting to `Palembang 1`, `Palembang 2`, etc. (`nextDefaultName()`,
collision-avoiding). Each entry stores:

```json
{
  "id": "<crypto.randomUUID(), or a timestamp+random fallback>",
  "name": "Blue Night",
  "design": { /* exactly playground-state.js's serializeState() shape */ },
  "createdAt": "<ISO 8601>",
  "updatedAt": "<ISO 8601>"
}
```

The `design` field deliberately reuses the *exact same shape* as the
last-session key and the JSON export file below — one schema for "what a
Palembang design is," not three parallel formats to keep in sync.
Resolving a saved entry back into a live, validated state
(`loadSavedDesignState()`) simply calls `restoreState()` on it, so it gets
the same graceful field-by-field degradation as everything else.

Each row exposes **Open, Rename, Duplicate, Share, Delete**:

- **Open** loads that design as the current working design (persists
  normally afterward, like any other change).
- **Rename** opens a small native `<dialog>` (not a custom modal
  framework) with a text field.
- **Duplicate** copies the design under a disambiguated name (`"<name>
  copy"`, `"<name> copy 2"`, …).
- **Share** builds a share link for that design without loading it first.
- **Delete** asks for confirmation (`window.confirm`) before removing —
  simple, native protection against an accidental click, deliberately not
  a custom dialog.

**Storage safety:** `restoreSavedDesigns()` validates the *container*
(must be an object with a `designs` array) and each entry's shape
individually (`id`/`name` present as non-empty strings, `design` present
as an object); a malformed entry is silently dropped, not fatal — the rest
of the list still loads. A design's *inner* contents are validated later,
the same way as any other design, only when it's actually opened. The list
is capped at `MAX_SAVED_DESIGNS` (50) — generous enough for real use
without unbounded storage growth; `addSavedDesign()`/`duplicateSavedDesign()`
throw a plain, catchable error at the cap, shown as a status message rather
than crashing.

## Design file export/import (JSON)

"Export design JSON" downloads the current design as a small, human-readable,
versioned file (`<slug>.palembang.json`):

```json
{
  "format": "palembang-design",
  "version": 1,
  "name": "Blue Night",
  "design": { /* same serializeState() shape as above */ }
}
```

"Import design JSON" opens a file picker (`accept="application/json,.json"`);
the selected file's text is parsed and validated strictly
(`parseDesignFilePayload()` in `designs.js`) before anything changes:

- invalid JSON, a missing/wrong `format`, an unsupported `version`, or a
  missing/invalid `design` field are all rejected with a short, specific,
  human-readable error shown in the status line;
- **the current design is never touched unless validation fully passes** —
  a failed import is a no-op on live state, by construction (the function
  only returns a new state on success; `app.js` only assigns it then);
- a successful import loads the design as the current working design (an
  editable fork, exactly like opening a share link or a saved design), and
  reports the imported design's name.

Imported files are treated as data only — parsed with `JSON.parse()`, never
evaluated or otherwise executed.

## Compatibility with v0.3.0

v0.3.0 users' existing `palembang-playground:v1` entries continue to load
unchanged: this release adds new *optional* fields to that schema
(nothing was renamed or repurposed), and `restoreState()`'s existing
field-by-field validation already ignores fields it doesn't recognize
rather than failing, so an old (or a newer, future) entry still restores
whatever it does recognize. `palembang-saved:v1` is an entirely new,
separate key — existing users simply start with an empty saved-designs
list; nothing is migrated away from or deleted.

## Reset semantics

"Reset everything to canonical Palembang" resets the *current working
design only* — canonical palette, Standard mode, canonical Wide preset —
and clears the `palembang-playground:v1` last-session entry. It does
**not** touch `palembang-saved:v1`: your saved designs are never deleted
by this action. There is deliberately no separate "clear all saved
designs" action in this release — deleting one at a time (each with its
own confirmation) is the only bulk-destructive path, so there's no single
button that can wipe every saved design by accident.

## Privacy

A share link, a saved design, and an exported JSON file all contain
**only** Palembang design state — mode, preset/dimensions, and palette
overrides. None of them include a username, device identifier, browsing
history, analytics identifier, localStorage id, or provenance information.
Saved-design timestamps (`createdAt`/`updatedAt`) exist only inside your
own browser's `palembang-saved:v1` entry for *your own* list ordering/
display; they are never included in a share link or an exported JSON file.
There is no telemetry, no analytics, and no network request other than the
one-time fetch of `tokens/palembang.v1.json` on load.

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
- The same applies to share links, saved designs, and exported/imported
  JSON files: all three carry only palette/format/dimension state, per
  "Privacy" above — none of them can reference or transfer a canonical
  PNG, the Figma source, or reference photographs.
- Curated palettes (`palettes.js`) are new color data, not new visual
  outputs in themselves; graphics rendered using them fall under the same
  CC BY 4.0 terms as any other Playground output.

## Accessibility / responsive notes

- All controls are native `<input>`/`<select>`/`<button>`/`<label>`/
  `<dialog>` elements (color pickers, text inputs, radio-button mode/format
  presets, a grouped `<select>` for wallpaper presets, plain buttons, a
  native rename dialog) with associated `<label for>` text, so keyboard
  operation and screen-reader labeling come from the platform rather than
  custom ARIA widgets. `<dialog>` provides built-in focus trapping and
  Escape-to-close.
- Output mode and Standard format presets are native radio groups (`role`
  is implicit), so arrow-key navigation and checked state work without
  extra script. The locked height field in Standard mode uses `readOnly`
  (never `disabled`), so it stays focusable/announced as read-only instead
  of being removed from tab order.
- Curated-palette swatches are `<button>` elements with an explicit
  `aria-label` ("Apply Midnight palette") and a `title`, since their
  accessible name shouldn't depend on parsing a gradient background.
- Saved-design row actions (Open/Rename/Duplicate/Share/Delete) are plain
  labeled buttons; Delete additionally requires a native `confirm()`
  before anything is removed.
- Export/copy/share status messages use `aria-live="polite"` regions.
- The "Shared design loaded" notice is a small, static, `aria-live` text
  line near the preview — not a dismissible banner or modal — so it can't
  block or interrupt interaction with the (already editable) loaded design.
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
- Saved settings and saved designs are per-browser (`localStorage`), not
  synced across devices or browsers, and are cleared if the user clears
  site data. There is no account system and none is planned for this
  format — see the repository CHANGELOG for what v0.4.0 deliberately does
  not add (accounts, cloud sync, public galleries, etc.).
- Share links encode the whole design in the URL; there is no server-side
  shortener (deliberately — this stays a static, backend-free app). A
  share URL with several palette overrides is still short in practice
  (well under typical browser/URL-bar length limits), but it will always
  be somewhat longer than a shortened link would be.
- `crypto.randomUUID()` (used for saved-design ids) requires a secure
  context (HTTPS, or `localhost` in local dev); both GitHub Pages and
  `python3 -m http.server` on `localhost` satisfy this. A non-secure-context
  fallback id generator is included for robustness but isn't the normal path.
- `MAX_SAVED_DESIGNS` (50) is enforced by this app's own logic, not by
  `localStorage` itself; a browser's actual per-origin storage quota is a
  separate, browser-defined limit this app doesn't try to detect or report.
- PNG export dimensions are clamped to 6000px per side; very large exports
  are still limited by the browser's canvas memory, which varies by device.
- No automated visual regression screenshot pipeline; this environment had
  no headless browser or SVG rasterizer available (see "Cross-renderer
  parity" above). `node --test implementations/web/test/` and
  `parity_check.py` are the available automated coverage. This also means
  the new sharing/saved-designs UI (dialog, palette gallery, saved-design
  rows) was verified through pure-logic unit tests, static CSS/JS
  regression checks, and manual code review — not an actual rendered
  browser session.
