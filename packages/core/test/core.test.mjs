import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  canonicalPalette,
  renderPalembangSvg,
  scenePaletteTokens,
} from "../src/index.js";
import { canonicalTokens } from "../src/generated-tokens.js";
import { renderSvg as renderPlaygroundSvg } from "../../../implementations/web/palembang.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = path.resolve(HERE, "../../../tokens/palembang.v1.json");
const tokensFromJson = JSON.parse(readFileSync(TOKENS_PATH, "utf8"));

describe("canonical SDK rendering", () => {
  test("renders canonical wide SVG with default attribution", () => {
    const svg = renderPalembangSvg({ width: 1920, height: 1080 });
    assert.match(svg, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    assert.match(svg, /width="1920" height="1080" viewBox="0 0 1920 1080"/);
    assert.match(svg, /<metadata>Palembang Graphic System/);
    assert.match(svg, /id="sky-field"/);
    assert.match(svg, /id="sea-glow-field"/);
  });

  test("supports arbitrary dimensions and square output", () => {
    const arbitrary = renderPalembangSvg({ width: 777, height: 333, attribution: false });
    const square = renderPalembangSvg({ width: 800, height: 800, attribution: false });
    assert.match(arbitrary, /width="777" height="333" viewBox="0 0 777 333"/);
    assert.match(arbitrary, /y="166\.5" width="777" height="166\.5"/);
    assert.match(square, /width="800" height="800" viewBox="0 0 800 800"/);
  });

  test("preserves the 320x320 haze exception", () => {
    const svg = renderPalembangSvg({ width: 320, height: 320, attribution: false });
    assert.match(svg, /haze middle-stop alpha 1/);
    assert.match(svg, /offset="0\.30000001192092896" stop-color="#C0C0C0" stop-opacity="1"/);
  });

  test("partial and all-six palette overrides only change colors", () => {
    const base = renderPalembangSvg({ width: 1000, height: 500, attribution: false });
    const all = Object.fromEntries(scenePaletteTokens.map((token, index) => [token, `#${String(index + 1).repeat(6)}`]));
    const overridden = renderPalembangSvg({ width: 1000, height: 500, palette: all, attribution: false });
    assert.match(renderPalembangSvg({ width: 1000, height: 500, palette: { "sky.hot": "#123456" }, attribution: false }), /stop-color="#123456"/);
    assert.equal((overridden.match(/stop-color=/g) ?? []).length, (base.match(/stop-color=/g) ?? []).length);
    assert.match(overridden, /stop-color="#111111"/);
    assert.match(overridden, /stop-color="#666666"/);
    assert.match(overridden, /gradientTransform="matrix\(/);
  });

  test("matches the existing Playground renderer byte-for-byte when attribution is disabled", () => {
    const cases = [
      [2560, 1080],
      [2560, 1664],
      [2560, 2560],
      [320, 320],
      [777, 333],
    ];
    for (const [width, height] of cases) {
      assert.equal(
        renderPalembangSvg({ width, height, attribution: false }),
        renderPlaygroundSvg(tokensFromJson, width, height, { attribution: false }),
        `${width}x${height}`
      );
    }
  });
});

describe("public validation", () => {
  test("rejects invalid dimensions", () => {
    for (const options of [
      { width: 0, height: 100 },
      { width: -1, height: 100 },
      { width: Infinity, height: 100 },
      { width: 100, height: 0 },
      { width: 100, height: NaN },
      { width: "100", height: 100 },
    ]) {
      assert.throws(() => renderPalembangSvg(options), /finite positive/);
    }
    assert.throws(() => renderPalembangSvg({ width: 100 }), /height/);
  });

  test("rejects unknown palette keys and non-hex colors", () => {
    assert.throws(() => renderPalembangSvg({ width: 100, height: 100, palette: { unknown: "#ffffff" } }), /unknown palette token/);
    assert.throws(() => renderPalembangSvg({ width: 100, height: 100, palette: { "sky.hot": "red" } }), /#RRGGBB/);
    assert.throws(() => renderPalembangSvg({ width: 100, height: 100, palette: { "sky.hot": "#12345" } }), /#RRGGBB/);
  });

  test("validates attribution and haze alpha", () => {
    assert.throws(() => renderPalembangSvg({ width: 100, height: 100, attribution: "yes" }), /attribution/);
    assert.throws(() => renderPalembangSvg({ width: 100, height: 100, hazeMiddleAlpha: 1.1 }), /hazeMiddleAlpha/);
    assert.match(renderPalembangSvg({ width: 100, height: 100, attribution: false, hazeMiddleAlpha: 0.25 }), /haze middle-stop alpha 0\.25/);
  });

  test("false attribution removes metadata but not rendering", () => {
    const svg = renderPalembangSvg({ width: 100, height: 100, attribution: false });
    assert.doesNotMatch(svg, /<metadata>/);
    assert.match(svg, /<title>Palembang Graphic System<\/title>/);
  });
});

describe("canonical data safety", () => {
  test("generated token module is exactly equivalent to canonical JSON", () => {
    assert.deepEqual(canonicalTokens, tokensFromJson);
    assert.equal(JSON.stringify(canonicalTokens), JSON.stringify(tokensFromJson));
  });

  test("exported palette and token names cannot be mutated", () => {
    assert.ok(Object.isFrozen(canonicalPalette));
    assert.ok(Object.isFrozen(scenePaletteTokens));
    assert.throws(() => {
      canonicalPalette["sky.hot"] = "#000000";
    }, TypeError);
    assert.throws(() => {
      scenePaletteTokens.push("unknown");
    }, TypeError);
    assert.equal(canonicalPalette["sky.hot"], tokensFromJson.palette["sky.hot"]);
    assert.equal(renderPalembangSvg({ width: 100, height: 100, attribution: false }).includes("#DF8117"), true);
  });
});
