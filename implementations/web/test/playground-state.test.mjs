// Tests for the pure Playground state/preset/persistence logic. No DOM or
// localStorage needed: restoreState() takes the raw string a caller would
// have read from localStorage, so persistence behavior is fully testable
// here even though app.js (untested directly, DOM-dependent) owns the
// actual localStorage.getItem/setItem calls.
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  STANDARD_PRESETS,
  CUSTOM_PRESET_ID,
  CANONICAL_STANDARD_PRESET_ID,
  WALLPAPER_PRESETS,
  DEFAULT_WALLPAPER_PRESET_ID,
  MIN_DIMENSION,
  MAX_DIMENSION,
  clampDimension,
  normalizeHex,
  ratioLabel,
  deriveStandardHeight,
  computeEffectiveDimensions,
  switchToCustomPreset,
  createDefaultState,
  serializeState,
  restoreState,
  STORAGE_KEY,
} from "../playground-state.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = path.resolve(HERE, "../../../tokens/palembang.v1.json");

let canonicalPalette;
before(() => {
  const tokens = JSON.parse(readFileSync(TOKENS_PATH, "utf8"));
  canonicalPalette = { ...tokens.palette };
});

describe("preset catalogs", () => {
  test("standard presets include Square/Medium/Wide with canonical-family resolutions", () => {
    const byId = Object.fromEntries(STANDARD_PRESETS.map((p) => [p.id, p]));
    assert.deepEqual([byId.square.width, byId.square.height], [2560, 2560]);
    assert.deepEqual([byId.medium.width, byId.medium.height], [2560, 1664]);
    assert.deepEqual([byId.wide.width, byId.wide.height], [2560, 1080]);
  });

  test("wallpaper presets cover phone/tablet/desktop and both ultrawide sizes", () => {
    const ids = new Set(WALLPAPER_PRESETS.map((p) => p.id));
    for (const id of [
      "iphone-1290x2796",
      "iphone-1179x2556",
      "ipad-2048x2732",
      "desktop-fhd",
      "desktop-qhd",
      "desktop-4k",
      "ultrawide-3440",
      "ultrawide-5120",
    ]) {
      assert.ok(ids.has(id), `missing wallpaper preset ${id}`);
    }
    assert.ok(WALLPAPER_PRESETS.every((p) => p.width >= MIN_DIMENSION && p.width <= MAX_DIMENSION));
  });

  test("DEFAULT_WALLPAPER_PRESET_ID resolves to a real preset", () => {
    assert.ok(WALLPAPER_PRESETS.some((p) => p.id === DEFAULT_WALLPAPER_PRESET_ID));
  });
});

describe("standard width-only behavior (height derives from width)", () => {
  test("halving the width halves the derived height for a 20:13-family preset", () => {
    assert.equal(deriveStandardHeight("medium", 2560), 1664);
    assert.equal(deriveStandardHeight("medium", 1280), 832);
  });

  test("computeEffectiveDimensions ignores customWidth/customHeight while a standard preset is active", () => {
    const state = createDefaultState(canonicalPalette);
    state.standardPresetId = "wide";
    state.standardWidth = 1280;
    state.customWidth = 999;
    state.customHeight = 999;
    const effective = computeEffectiveDimensions(state);
    assert.equal(effective.width, 1280);
    assert.equal(effective.height, 540); // 1280 * 1080/2560
  });

  test("square preset keeps width === height at any width", () => {
    const state = createDefaultState(canonicalPalette);
    state.standardPresetId = "square";
    state.standardWidth = 777;
    const effective = computeEffectiveDimensions(state);
    assert.equal(effective.width, 777);
    assert.equal(effective.height, 777);
  });
});

describe("custom width/height behavior", () => {
  test("custom mode uses customWidth/customHeight directly, independent of any standard ratio", () => {
    const state = createDefaultState(canonicalPalette);
    state.standardPresetId = CUSTOM_PRESET_ID;
    state.customWidth = 1000;
    state.customHeight = 333;
    const effective = computeEffectiveDimensions(state);
    assert.deepEqual(effective, { width: 1000, height: 333 });
  });

  test("custom dimensions are clamped to [MIN_DIMENSION, MAX_DIMENSION]", () => {
    const state = createDefaultState(canonicalPalette);
    state.standardPresetId = CUSTOM_PRESET_ID;
    state.customWidth = 1; // below MIN_DIMENSION
    state.customHeight = 999999; // above MAX_DIMENSION
    const effective = computeEffectiveDimensions(state);
    assert.equal(effective.width, MIN_DIMENSION);
    assert.equal(effective.height, MAX_DIMENSION);
  });
});

describe("switching to Custom seeds from the size that was on screen", () => {
  test("from a standard preset, Custom inherits that preset's current effective size (not a stale leftover)", () => {
    const state = createDefaultState(canonicalPalette);
    state.standardPresetId = "medium";
    state.standardWidth = 1280; // -> derived height 832
    // A stale value that must NOT leak into the new custom size:
    state.customWidth = 42;
    state.customHeight = 42;

    const next = switchToCustomPreset(state);
    assert.equal(next.standardPresetId, CUSTOM_PRESET_ID);
    assert.equal(next.customWidth, 1280);
    assert.equal(next.customHeight, 832);
    assert.deepEqual(computeEffectiveDimensions(next), { width: 1280, height: 832 });
  });

  test("from wallpaper mode, Custom inherits the wallpaper preset's exact pixels", () => {
    const state = createDefaultState(canonicalPalette);
    state.mode = "wallpaper";
    state.wallpaperPresetId = "desktop-4k";
    const next = switchToCustomPreset(state);
    assert.equal(next.customWidth, 3840);
    assert.equal(next.customHeight, 2160);
  });

  test("is a no-op when already Custom (does not overwrite in-progress custom edits)", () => {
    const state = createDefaultState(canonicalPalette);
    state.standardPresetId = CUSTOM_PRESET_ID;
    state.customWidth = 1500;
    state.customHeight = 500;
    const next = switchToCustomPreset(state);
    assert.equal(next, state); // same reference: genuinely a no-op
    assert.equal(next.customWidth, 1500);
    assert.equal(next.customHeight, 500);
  });
});

describe("wallpaper mode locking", () => {
  test("wallpaper mode is the sole source of truth regardless of leftover standard/custom state", () => {
    const state = createDefaultState(canonicalPalette);
    state.mode = "wallpaper";
    state.wallpaperPresetId = "desktop-4k";
    state.standardPresetId = CUSTOM_PRESET_ID;
    state.customWidth = 111;
    state.customHeight = 222;
    state.standardWidth = 333;
    const effective = computeEffectiveDimensions(state);
    assert.deepEqual(effective, { width: 3840, height: 2160 });
  });

  test("an unknown wallpaperPresetId falls back to the default wallpaper preset", () => {
    const state = createDefaultState(canonicalPalette);
    state.mode = "wallpaper";
    state.wallpaperPresetId = "not-a-real-preset";
    const effective = computeEffectiveDimensions(state);
    const fallback = WALLPAPER_PRESETS.find((p) => p.id === DEFAULT_WALLPAPER_PRESET_ID);
    assert.deepEqual(effective, { width: fallback.width, height: fallback.height });
  });

  test("switching an ultrawide preset yields the exact documented pixel size", () => {
    const state = createDefaultState(canonicalPalette);
    state.mode = "wallpaper";
    state.wallpaperPresetId = "ultrawide-5120";
    assert.deepEqual(computeEffectiveDimensions(state), { width: 5120, height: 1440 });
  });
});

describe("default state", () => {
  test("defaults to Standard mode, canonical Wide preset, and the canonical palette", () => {
    const state = createDefaultState(canonicalPalette);
    assert.equal(state.mode, "standard");
    assert.equal(state.standardPresetId, CANONICAL_STANDARD_PRESET_ID);
    assert.deepEqual(state.palette, canonicalPalette);
    assert.deepEqual(computeEffectiveDimensions(state), { width: 2560, height: 1080 });
  });
});

describe("state persistence / restore", () => {
  test("serializeState round-trips through restoreState for a modified state", () => {
    const original = createDefaultState(canonicalPalette);
    original.mode = "standard";
    original.standardPresetId = "medium";
    original.standardWidth = 1600;
    original.palette["sky.hot"] = "#ff3366";

    const raw = JSON.stringify(serializeState(original, canonicalPalette));
    const restored = restoreState(raw, canonicalPalette);

    assert.equal(restored.mode, "standard");
    assert.equal(restored.standardPresetId, "medium");
    assert.equal(restored.standardWidth, 1600);
    assert.equal(restored.palette["sky.hot"], "#ff3366");
    assert.equal(restored.palette["sea.glow"], canonicalPalette["sea.glow"]); // untouched token stays canonical
  });

  test("serializeState only stores tokens that actually differ from canonical (minimal overrides)", () => {
    const state = createDefaultState(canonicalPalette);
    state.palette["sea.dark"] = "#123456";
    const serialized = serializeState(state, canonicalPalette);
    assert.deepEqual(serialized.paletteOverrides, { "sea.dark": "#123456" });
  });

  test("serializeState records the current effective width/height", () => {
    const state = createDefaultState(canonicalPalette);
    state.mode = "wallpaper";
    state.wallpaperPresetId = "desktop-fhd";
    const serialized = serializeState(state, canonicalPalette);
    assert.equal(serialized.effectiveWidth, 1920);
    assert.equal(serialized.effectiveHeight, 1080);
  });

  test("wallpaper mode and preset survive a round trip", () => {
    const state = createDefaultState(canonicalPalette);
    state.mode = "wallpaper";
    state.wallpaperPresetId = "ipad-2048x2732";
    const restored = restoreState(JSON.stringify(serializeState(state, canonicalPalette)), canonicalPalette);
    assert.equal(restored.mode, "wallpaper");
    assert.equal(restored.wallpaperPresetId, "ipad-2048x2732");
    assert.deepEqual(computeEffectiveDimensions(restored), { width: 2048, height: 2732 });
  });

  test("custom mode round-trips both custom dimensions", () => {
    const state = createDefaultState(canonicalPalette);
    state.standardPresetId = CUSTOM_PRESET_ID;
    state.customWidth = 1500;
    state.customHeight = 500;
    const restored = restoreState(JSON.stringify(serializeState(state, canonicalPalette)), canonicalPalette);
    assert.equal(restored.standardPresetId, CUSTOM_PRESET_ID);
    assert.deepEqual(computeEffectiveDimensions(restored), { width: 1500, height: 500 });
  });

  test("missing localStorage value (null) falls back to canonical defaults", () => {
    const restored = restoreState(null, canonicalPalette);
    assert.deepEqual(restored, createDefaultState(canonicalPalette));
  });

  test("corrupt JSON falls back to canonical defaults instead of throwing", () => {
    const restored = restoreState("{not valid json", canonicalPalette);
    assert.deepEqual(restored, createDefaultState(canonicalPalette));
  });

  test("a non-object JSON value (e.g. a bare number) falls back to canonical defaults", () => {
    const restored = restoreState("42", canonicalPalette);
    assert.deepEqual(restored, createDefaultState(canonicalPalette));
  });

  test("an unknown mode/preset id in otherwise-valid JSON falls back per-field, not for the whole object", () => {
    const raw = JSON.stringify({
      version: 1,
      mode: "time-travel",
      standardPresetId: "nonexistent",
      standardWidth: 1234,
      wallpaperPresetId: "nonexistent",
      paletteOverrides: { "sky.hot": "#00ff00" },
    });
    const restored = restoreState(raw, canonicalPalette);
    assert.equal(restored.mode, "standard"); // invalid -> default
    assert.equal(restored.standardPresetId, CANONICAL_STANDARD_PRESET_ID); // invalid -> default
    assert.equal(restored.standardWidth, 1234); // valid field is still honored
    assert.equal(restored.wallpaperPresetId, DEFAULT_WALLPAPER_PRESET_ID); // invalid -> default
    assert.equal(restored.palette["sky.hot"], "#00ff00"); // valid override still honored
  });

  test("a malformed hex override is ignored, valid ones are kept", () => {
    const raw = JSON.stringify({
      paletteOverrides: { "sky.hot": "not-a-color", "sea.glow": "#ABCDEF" },
    });
    const restored = restoreState(raw, canonicalPalette);
    assert.equal(restored.palette["sky.hot"], canonicalPalette["sky.hot"]);
    assert.equal(restored.palette["sea.glow"], "#abcdef");
  });

  test("an override for a non-scene key is ignored", () => {
    const raw = JSON.stringify({ paletteOverrides: { "not.a.scene.token": "#ffffff" } });
    const restored = restoreState(raw, canonicalPalette);
    assert.deepEqual(restored.palette, canonicalPalette);
  });

  test("out-of-range numeric fields are clamped rather than rejected", () => {
    const raw = JSON.stringify({ standardWidth: 999999, customWidth: -50 });
    const restored = restoreState(raw, canonicalPalette);
    assert.equal(restored.standardWidth, MAX_DIMENSION);
    assert.equal(restored.customWidth, MIN_DIMENSION);
  });

  test("STORAGE_KEY is namespaced and versioned", () => {
    assert.match(STORAGE_KEY, /^palembang-playground:v\d+$/);
  });
});

describe("reset / clear cache behavior", () => {
  test("createDefaultState after simulating a clear reproduces the canonical baseline exactly", () => {
    // fullReset() in app.js calls localStorage.removeItem() then
    // createDefaultState(canonicalPalette); the removeItem() call itself is
    // a trivial DOM/localStorage passthrough, so the meaningful behavior to
    // verify here is that the resulting state is indistinguishable from a
    // first-ever visit with no saved state at all.
    const afterClear = createDefaultState(canonicalPalette);
    const firstVisit = restoreState(null, canonicalPalette);
    assert.deepEqual(afterClear, firstVisit);
  });
});

describe("small helpers", () => {
  test("normalizeHex expands #rgb and lowercases #RRGGBB", () => {
    assert.equal(normalizeHex("#ABC"), "#aabbcc");
    assert.equal(normalizeHex("#AABBCC"), "#aabbcc");
    assert.equal(normalizeHex("not a color"), null);
  });

  test("clampDimension rounds and clamps to [MIN_DIMENSION, MAX_DIMENSION]", () => {
    assert.equal(clampDimension(10.6), 16);
    assert.equal(clampDimension(7000), MAX_DIMENSION);
    assert.equal(clampDimension(NaN), MIN_DIMENSION);
  });

  test("ratioLabel reduces to lowest terms", () => {
    assert.equal(ratioLabel(2560, 1080), "64:27");
    assert.equal(ratioLabel(1000, 1000), "1:1");
  });
});
