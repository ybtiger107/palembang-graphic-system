// Tests for the curated palette gallery (palettes.js).
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { CURATED_PALETTES, ORIGINAL_PALETTE_ID, curatedPaletteById, resolveCuratedPalette } from "../palettes.js";
import { scenePaletteTokens, renderSvg } from "../palembang.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = path.resolve(HERE, "../../../tokens/palembang.v1.json");
const HEX_RE = /^#[0-9a-f]{6}$/i;

let tokens;
let canonicalPalette;
before(() => {
  tokens = JSON.parse(readFileSync(TOKENS_PATH, "utf8"));
  canonicalPalette = { ...tokens.palette };
});

describe("Original preset", () => {
  test("has no hard-coded colors of its own and resolves to exactly the canonical palette", () => {
    const preset = curatedPaletteById(ORIGINAL_PALETTE_ID);
    assert.equal(preset.colors, null);
    const resolved = resolveCuratedPalette(ORIGINAL_PALETTE_ID, canonicalPalette);
    for (const token of scenePaletteTokens()) {
      assert.equal(resolved[token], canonicalPalette[token]);
    }
  });

  test("still matches canonical even if canonicalPalette carries extra non-scene keys", () => {
    const withExtras = { ...canonicalPalette, "surround.dark": "#0B1014" };
    const resolved = resolveCuratedPalette(ORIGINAL_PALETTE_ID, withExtras);
    assert.deepEqual(Object.keys(resolved).sort(), scenePaletteTokens().sort());
  });
});

describe("preset catalog integrity", () => {
  test("includes the expected restrained set, Original first", () => {
    assert.equal(CURATED_PALETTES[0].id, ORIGINAL_PALETTE_ID);
    assert.ok(CURATED_PALETTES.length >= 6 && CURATED_PALETTES.length <= 10, "restrained, not dozens");
    const ids = new Set(CURATED_PALETTES.map((p) => p.id));
    assert.equal(ids.size, CURATED_PALETTES.length, "no duplicate ids");
  });

  test("every non-Original preset defines all six scene tokens with valid hex colors", () => {
    for (const preset of CURATED_PALETTES) {
      if (preset.id === ORIGINAL_PALETTE_ID) continue;
      for (const token of scenePaletteTokens()) {
        const value = preset.colors[token];
        assert.equal(typeof value, "string", `${preset.id}.${token} missing`);
        assert.match(value, HEX_RE, `${preset.id}.${token} not a valid hex color`);
      }
      assert.deepEqual(Object.keys(preset.colors).sort(), scenePaletteTokens().sort(), `${preset.id} has stray/missing keys`);
    }
  });

  test("no two non-Original presets are byte-identical (each is a deliberate, distinct set)", () => {
    const nonOriginal = CURATED_PALETTES.filter((p) => p.id !== ORIGINAL_PALETTE_ID);
    const serialized = nonOriginal.map((p) => JSON.stringify(p.colors));
    assert.equal(new Set(serialized).size, serialized.length);
  });

  test("resolveCuratedPalette returns null for an unknown id", () => {
    assert.equal(resolveCuratedPalette("not-a-real-palette", canonicalPalette), null);
  });
});

describe("presets affect colors only — no geometry/state mutation", () => {
  test("resolveCuratedPalette's output has exactly the six scene-token keys, nothing else", () => {
    for (const preset of CURATED_PALETTES) {
      const resolved = resolveCuratedPalette(preset.id, canonicalPalette);
      assert.deepEqual(Object.keys(resolved).sort(), scenePaletteTokens().sort());
    }
  });

  test("applying a curated palette to renderSvg changes only stop-color, not geometry/gradientTransform/layer order", () => {
    const canonicalSvg = renderSvg(tokens, 2560, 1080);
    for (const preset of CURATED_PALETTES) {
      if (preset.id === ORIGINAL_PALETTE_ID) continue;
      const recolored = renderSvg(tokens, 2560, 1080, { palette: resolveCuratedPalette(preset.id, canonicalPalette) });

      const transformOf = (svg) => [...svg.matchAll(/gradientTransform="([^"]+)"/g)].map((m) => m[1]);
      assert.deepEqual(transformOf(recolored), transformOf(canonicalSvg), `${preset.id} altered a gradientTransform`);

      const idsOf = (svg) => [...svg.matchAll(/id="([a-z-]+)"/g)].map((m) => m[1]);
      assert.deepEqual(idsOf(recolored), idsOf(canonicalSvg), `${preset.id} altered layer/gradient order`);

      const offsetsOf = (svg) => [...svg.matchAll(/offset="([^"]+)"/g)].map((m) => m[1]);
      assert.deepEqual(offsetsOf(recolored), offsetsOf(canonicalSvg), `${preset.id} altered stop positions`);

      assert.match(recolored, /viewBox="0 0 2560 1080"/, `${preset.id} altered dimensions`);
    }
  });

  test("mutating the object resolveCuratedPalette returns does not affect the preset catalog", () => {
    const resolved = resolveCuratedPalette("midnight", canonicalPalette);
    resolved["sky.hot"] = "#000000";
    const resolvedAgain = resolveCuratedPalette("midnight", canonicalPalette);
    assert.notEqual(resolvedAgain["sky.hot"], "#000000");
  });
});
