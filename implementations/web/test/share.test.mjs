// Tests for the shareable-URL "share schema v1" (share.js). Pure logic,
// no DOM/localStorage/`location` needed — resolveBootState() takes plain
// strings for `hash`/`lastSessionRaw` instead of touching globals, so the
// precedence rule is fully testable here too.
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  SHARE_SCHEMA_VERSION,
  SHARE_PARAM,
  encodeShareState,
  decodeShareState,
  buildShareUrl,
  extractShareValue,
  resolveBootState,
} from "../share.js";
import { createDefaultState, computeEffectiveDimensions, CUSTOM_PRESET_ID } from "../playground-state.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = path.resolve(HERE, "../../../tokens/palembang.v1.json");
const SHARE_SOURCE = readFileSync(path.join(HERE, "../share.js"), "utf8");

let canonicalPalette;
before(() => {
  const tokens = JSON.parse(readFileSync(TOKENS_PATH, "utf8"));
  canonicalPalette = { ...tokens.palette };
});

describe("canonical state round trip", () => {
  test("encode -> decode reproduces the canonical Wide design exactly", () => {
    const state = createDefaultState(canonicalPalette);
    const encoded = encodeShareState(state, canonicalPalette);
    const decoded = decodeShareState(encoded, canonicalPalette);
    assert.equal(decoded.mode, "standard");
    assert.equal(decoded.standardPresetId, "wide");
    assert.deepEqual(computeEffectiveDimensions(decoded), computeEffectiveDimensions(state));
    assert.deepEqual(decoded.palette, canonicalPalette);
  });
});

describe("custom state round trip", () => {
  test("encode -> decode preserves an arbitrary custom width/height", () => {
    const state = createDefaultState(canonicalPalette);
    state.standardPresetId = CUSTOM_PRESET_ID;
    state.customWidth = 1234;
    state.customHeight = 777;
    const decoded = decodeShareState(encodeShareState(state, canonicalPalette), canonicalPalette);
    assert.equal(decoded.standardPresetId, CUSTOM_PRESET_ID);
    assert.deepEqual(computeEffectiveDimensions(decoded), { width: 1234, height: 777 });
  });
});

describe("wallpaper state round trip", () => {
  test("encode -> decode preserves the wallpaper preset and its exact pixels", () => {
    const state = createDefaultState(canonicalPalette);
    state.mode = "wallpaper";
    state.wallpaperPresetId = "ultrawide-5120";
    const decoded = decodeShareState(encodeShareState(state, canonicalPalette), canonicalPalette);
    assert.equal(decoded.mode, "wallpaper");
    assert.equal(decoded.wallpaperPresetId, "ultrawide-5120");
    assert.deepEqual(computeEffectiveDimensions(decoded), { width: 5120, height: 1440 });
  });
});

describe("palette overrides round trip", () => {
  test("only overridden tokens are carried; untouched tokens stay canonical", () => {
    const state = createDefaultState(canonicalPalette);
    state.palette["sky.hot"] = "#ff3366";
    state.palette["sea.glow"] = "#22ffdd";
    const decoded = decodeShareState(encodeShareState(state, canonicalPalette), canonicalPalette);
    assert.equal(decoded.palette["sky.hot"], "#ff3366");
    assert.equal(decoded.palette["sea.glow"], "#22ffdd");
    assert.equal(decoded.palette["sky.cool"], canonicalPalette["sky.cool"]);
  });

  test("a design with no palette overrides omits the color array entirely (compactness)", () => {
    const state = createDefaultState(canonicalPalette);
    const decodedJson = JSON.parse(Buffer.from(encodeShareState(state, canonicalPalette), "base64url").toString("utf8"));
    assert.equal("c" in decodedJson, false);
  });
});

describe("deterministic encoding", () => {
  test("the same state and canonicalPalette always encode identically", () => {
    const a = createDefaultState(canonicalPalette);
    const b = createDefaultState(canonicalPalette);
    b.palette["sea.dark"] = "#101010";
    a.palette["sea.dark"] = "#101010";
    assert.equal(encodeShareState(a, canonicalPalette), encodeShareState(b, canonicalPalette));
  });
});

describe("malformed / unsupported input fails safely", () => {
  test("garbage base64 returns null, not a throw", () => {
    assert.equal(decodeShareState("!!!not-base64!!!", canonicalPalette), null);
  });

  test("valid base64 that isn't JSON returns null", () => {
    const notJson = Buffer.from("hello world", "utf8").toString("base64url");
    assert.equal(decodeShareState(notJson, canonicalPalette), null);
  });

  test("valid JSON that isn't an object (e.g. a bare number) returns null", () => {
    const bareNumber = Buffer.from("42", "utf8").toString("base64url");
    assert.equal(decodeShareState(bareNumber, canonicalPalette), null);
  });

  test("an unsupported share schema version returns null", () => {
    const future = Buffer.from(JSON.stringify({ v: 999, m: "s", p: "wide", w: 2560 }), "utf8").toString("base64url");
    assert.equal(decodeShareState(future, canonicalPalette), null);
  });

  test("empty string and non-string input return null", () => {
    assert.equal(decodeShareState("", canonicalPalette), null);
    assert.equal(decodeShareState(null, canonicalPalette), null);
    assert.equal(decodeShareState(undefined, canonicalPalette), null);
  });

  test("an unrecognized mode field returns null (not silently 'standard')", () => {
    const bad = Buffer.from(JSON.stringify({ v: 1, m: "z", p: "wide", w: 2560 }), "utf8").toString("base64url");
    assert.equal(decodeShareState(bad, canonicalPalette), null);
  });

  test("a tampered preset id inside an otherwise-valid v1 payload degrades to canonical default, not a crash", () => {
    const payload = Buffer.from(JSON.stringify({ v: 1, m: "s", p: "not-a-real-preset" }), "utf8").toString("base64url");
    const decoded = decodeShareState(payload, canonicalPalette);
    assert.notEqual(decoded, null);
    assert.equal(decoded.standardPresetId, "wide"); // canonical default
  });

  test("a malformed color in the palette array is skipped, valid ones are kept", () => {
    const payload = Buffer.from(
      JSON.stringify({ v: 1, m: "s", p: "wide", w: 2560, c: ["not-a-color", null, null, null, null, "#abcdef"] }),
      "utf8"
    ).toString("base64url");
    const decoded = decodeShareState(payload, canonicalPalette);
    assert.equal(decoded.palette["sky.hot"], canonicalPalette["sky.hot"]);
    assert.equal(decoded.palette["sea.glow"], "#abcdef");
  });
});

describe("buildShareUrl / extractShareValue", () => {
  test("buildShareUrl appends #ps=<encoded> and strips any pre-existing hash/query", () => {
    const state = createDefaultState(canonicalPalette);
    const url = buildShareUrl("https://example.invalid/app/?x=1#old", state, canonicalPalette);
    assert.match(url, /^https:\/\/example\.invalid\/app\/#ps=/);
  });

  test("extractShareValue reads ps= out of a location.hash-shaped string", () => {
    assert.equal(extractShareValue("#ps=abc123"), "abc123");
    assert.equal(extractShareValue("#other=1&ps=abc123"), "abc123");
    assert.equal(extractShareValue(""), null);
    assert.equal(extractShareValue("#"), null);
    assert.equal(extractShareValue("#other=1"), null);
  });

  test("a full share URL round-trips through extractShareValue + decodeShareState", () => {
    const state = createDefaultState(canonicalPalette);
    state.mode = "wallpaper";
    state.wallpaperPresetId = "desktop-4k";
    const url = buildShareUrl("https://ybtiger107.github.io/palembang-graphic-system/", state, canonicalPalette);
    const hash = new URL(url).hash;
    const decoded = decodeShareState(extractShareValue(hash), canonicalPalette);
    assert.deepEqual(computeEffectiveDimensions(decoded), { width: 3840, height: 2160 });
  });

  test("SHARE_PARAM and SHARE_SCHEMA_VERSION are the small, stable public contract", () => {
    assert.equal(SHARE_PARAM, "ps");
    assert.equal(SHARE_SCHEMA_VERSION, 1);
  });
});

describe("share URL independence from localStorage", () => {
  test("share.js never calls the localStorage API (this whole suite already runs under Node, which has none)", () => {
    assert.doesNotMatch(SHARE_SOURCE, /localStorage\s*\.\s*(get|set|remove)Item/);
  });

  test("decoding a freshly-built share URL requires nothing but the URL itself", () => {
    const state = createDefaultState(canonicalPalette);
    state.palette["sea.haze"] = "#e0e0e0";
    const url = buildShareUrl("https://example.invalid/", state, canonicalPalette);
    // No localStorage read/write anywhere in this test — if that were
    // required, this environment (plain Node) would throw ReferenceError.
    const decoded = decodeShareState(extractShareValue(new URL(url).hash), canonicalPalette);
    assert.equal(decoded.palette["sea.haze"], "#e0e0e0");
  });
});

describe("URL-state precedence (resolveBootState)", () => {
  test("a valid share value wins over a present last-session value", () => {
    const shareState = createDefaultState(canonicalPalette);
    shareState.mode = "wallpaper";
    shareState.wallpaperPresetId = "desktop-fhd";
    const hash = `#ps=${encodeShareState(shareState, canonicalPalette)}`;

    const sessionState = createDefaultState(canonicalPalette);
    sessionState.standardPresetId = CUSTOM_PRESET_ID;
    sessionState.customWidth = 999;
    sessionState.customHeight = 999;
    const lastSessionRaw = JSON.stringify({
      version: 1,
      mode: "standard",
      standardPresetId: CUSTOM_PRESET_ID,
      standardWidth: 2560,
      customWidth: 999,
      customHeight: 999,
      wallpaperPresetId: "desktop-qhd",
      paletteOverrides: {},
    });

    const result = resolveBootState(canonicalPalette, { hash, lastSessionRaw });
    assert.equal(result.loadedFromShare, true);
    assert.deepEqual(computeEffectiveDimensions(result.state), { width: 1920, height: 1080 });
  });

  test("with no share value, the last local session is used", () => {
    const lastSessionRaw = JSON.stringify({
      version: 1,
      mode: "standard",
      standardPresetId: CUSTOM_PRESET_ID,
      standardWidth: 2560,
      customWidth: 321,
      customHeight: 123,
      wallpaperPresetId: "desktop-qhd",
      paletteOverrides: {},
    });
    const result = resolveBootState(canonicalPalette, { hash: "", lastSessionRaw });
    assert.equal(result.loadedFromShare, false);
    assert.deepEqual(computeEffectiveDimensions(result.state), { width: 321, height: 123 });
  });

  test("with neither a share value nor a session, canonical defaults are used", () => {
    const result = resolveBootState(canonicalPalette, { hash: "", lastSessionRaw: null });
    assert.equal(result.loadedFromShare, false);
    assert.deepEqual(result.state, createDefaultState(canonicalPalette));
  });

  test("a malformed share value falls through to the last session, not to defaults", () => {
    const lastSessionRaw = JSON.stringify({ version: 1, mode: "wallpaper", wallpaperPresetId: "desktop-4k" });
    const result = resolveBootState(canonicalPalette, { hash: "#ps=not-valid-base64!!!", lastSessionRaw });
    assert.equal(result.loadedFromShare, false);
    assert.equal(result.state.wallpaperPresetId, "desktop-4k");
  });
});
