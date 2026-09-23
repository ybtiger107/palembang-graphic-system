# Palembang JavaScript Core SDK

This is the provisional, dependency-free JavaScript rendering core for the
Palembang Graphic System. It renders canonical Palembang SVG directly from
JavaScript in modern browsers and Node.js ES modules — without the Playground,
DOM, Figma, Python, or a runtime token fetch.

The package name and public registry identity are intentionally provisional for
v0.5.0 development. It is private and is not published to npm.

## Usage

```js
import { renderPalembangSvg } from "@palembang-graphic-system/core-local";

const svg = renderPalembangSvg({
  width: 1920,
  height: 1080,
  palette: { "sky.hot": "#DF8117" },
});
```

`renderPalembangSvg(options)` requires positive finite numeric `width` and
`height`. It supports arbitrary aspect ratios and reconstructs both canonical
half-height fields; it does not crop or stretch a bitmap.

Supported options:

- `palette` — partial overrides for exactly `sky.hot`, `sky.cool`, `sea.light`,
  `sea.dark`, `sea.haze`, and `sea.glow`. Values must be `#RRGGBB` strings;
  unknown keys throw.
- `attribution` — defaults to `true` and embeds CC BY metadata in the SVG.
  Setting it to `false` removes only that metadata; it does not remove the
  user's CC BY 4.0 attribution obligation.
- `hazeMiddleAlpha` — optional finite alpha from `0` through `1`; the normal
  canonical behavior includes the established 320×320 exception.

The stable read APIs `scenePaletteTokens` and `canonicalPalette` are frozen.
Mutating either exported value is rejected and cannot alter later renders.

## Node

The complete example is in [`examples/node.mjs`](examples/node.mjs):

```js
import { writeFile } from "node:fs/promises";
import { renderPalembangSvg } from "@palembang-graphic-system/core-local";

const svg = renderPalembangSvg({ width: 1920, height: 1080 });
await writeFile("palembang.svg", svg, "utf8");
```

The SDK itself does not use `fs`, `fetch`, or the DOM. File-system access is
only needed by an application example that chooses to save the returned text.

## Browser

Use the same import from a native ES module. A short copy/paste example is in
[`examples/browser.html`](examples/browser.html):

```html
<script type="module">
  import { renderPalembangSvg } from "@palembang-graphic-system/core-local";
  document.querySelector("#preview").innerHTML = renderPalembangSvg({
    width: 1920,
    height: 1080,
  });
</script>
```

## Canonical data and renderer relationship

`tokens/palembang.v1.json` remains authoritative. A checked-in generated module
embeds the exact token JSON for synchronous, offline access; the generator and
equivalence test fail if it drifts. The SDK renderer is also a generated,
synchronized copy of the already verified pure renderer in
`implementations/web/palembang.js`. `scripts/sync-core-renderer.mjs --check`
detects renderer drift, while the SDK tests compare SVG structure and output
against that Playground renderer and the Python parity suite.

## Licensing and stability

The SDK code is MIT-licensed. The embedded Palembang visual-system data and
generated SVG output remain under CC BY 4.0. See [`LICENSE.md`](LICENSE.md),
the repository [`VISUAL-LICENSE.md`](../../VISUAL-LICENSE.md), and the
attribution metadata behavior above. This API is pre-1.0 and may change before
the public package name and registry publication are selected.

There are zero runtime dependencies. The package does not include reference
photographs, original artwork, Figma source, extracted source assets,
canonical PNG masters, or Playground persistence/share state.
