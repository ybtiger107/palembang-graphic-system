// Focused structural checks for the browser renderer, mirroring
// implementations/svg/test_render.py so both renderers are held to the same
// contract. Run with: node --test implementations/web/test/palembang.test.mjs
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { DOMParser } from "./vendor/tiny-xml-parser.mjs";
import {
  renderSvg,
  mergePalette,
  scenePaletteTokens,
  tokenCandidateUrls,
  loadTokens,
  formatNumber,
  inverseAffine,
} from "../palembang.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = path.resolve(HERE, "../../../tokens/palembang.v1.json");

let tokens;
before(() => {
  tokens = JSON.parse(readFileSync(TOKENS_PATH, "utf8"));
});

function parse(svgText) {
  return new DOMParser().parseFromString(svgText);
}

describe("renderSvg", () => {
  test("dimensions and horizon seam at 2560x1080", () => {
    const root = parse(renderSvg(tokens, 2560, 1080));
    assert.equal(root.attributes.width, "2560");
    assert.equal(root.attributes.height, "1080");
    assert.equal(root.attributes.viewBox, "0 0 2560 1080");

    const fields = Object.fromEntries(root.findAll("rect").map((n) => [n.attributes.id, n.attributes]));
    assert.equal(fields["sky-field"].height, "540");
    assert.equal(fields["sea-base-field"].y, "540");
    assert.equal(fields["sea-base-field"].height, "540");
    assert.equal(fields["sea-haze-field"].opacity, "0.44999998807907104");
    assert.equal(fields["sea-glow-field"].opacity, "0.6000000238418579");
  });

  test("gradient structure, token transforms, and 320 haze exception", () => {
    const small = parse(renderSvg(tokens, 320, 320));
    const gradients = Object.fromEntries(
      small.findAll(["radialGradient", "linearGradient"]).map((n) => [n.attributes.id, n])
    );
    assert.deepEqual(new Set(Object.keys(gradients)), new Set(["sky", "sea-base", "sea-haze", "sea-glow"]));
    assert.equal(gradients["sea-haze"].children[0].attributes["stop-opacity"], "0");
    assert.equal(gradients["sea-haze"].children[1].attributes["stop-opacity"], "1");
    assert.match(gradients["sky"].attributes.gradientTransform, /^matrix\(/);

    const wide = parse(renderSvg(tokens, 2560, 1080));
    const wideGradients = Object.fromEntries(
      wide.findAll(["radialGradient", "linearGradient"]).map((n) => [n.attributes.id, n])
    );
    assert.equal(wideGradients["sea-haze"].children[1].attributes["stop-opacity"], "0.800000011920929");

    const rectIds = small.findAll("rect").map((n) => n.attributes.id);
    assert.deepEqual(rectIds, ["sky-field", "sea-base-field", "sea-haze-field", "sea-glow-field"]);
  });

  test("deterministic output and arbitrary size", () => {
    const first = renderSvg(tokens, 777, 333);
    const second = renderSvg(tokens, 777, 333);
    assert.equal(first, second);
    assert.match(first, /viewBox="0 0 777 333"/);
    assert.match(first, /y="166.5"/);
  });

  test("rejects non-canonical geometry tokens", () => {
    const mutated = JSON.parse(JSON.stringify(tokens));
    mutated.geometry.horizonY = 0.4;
    assert.throws(() => renderSvg(mutated, 100, 100));
  });

  test("rejects non-positive dimensions", () => {
    assert.throws(() => renderSvg(tokens, 0, 100));
    assert.throws(() => renderSvg(tokens, 100, -5));
  });
});

describe("runtime palette overrides", () => {
  test("override changes stop-color but not gradientTransform or geometry", () => {
    const canonical = parse(renderSvg(tokens, 320, 320));
    const overridden = parse(renderSvg(tokens, 320, 320, { palette: { "sky.hot": "#ff0000" } }));

    const skyCanonical = canonical.findAll(["radialGradient"]).find((n) => n.attributes.id === "sky");
    const skyOverridden = overridden.findAll(["radialGradient"]).find((n) => n.attributes.id === "sky");
    assert.equal(skyOverridden.children[0].attributes["stop-color"], "#ff0000");
    assert.notEqual(skyCanonical.children[0].attributes["stop-color"], "#ff0000");
    assert.equal(skyOverridden.attributes.gradientTransform, skyCanonical.attributes.gradientTransform);
  });

  test("unknown override keys are ignored", () => {
    const merged = mergePalette(tokens.palette, { "not.a.scene.token": "#ffffff", "sky.hot": "#00ff00" });
    assert.equal(merged["sky.hot"], "#00ff00");
    assert.equal(merged["not.a.scene.token"], undefined);
  });

  test("scenePaletteTokens matches the six documented scene roles", () => {
    assert.deepEqual(scenePaletteTokens(), ["sky.hot", "sky.cool", "sea.light", "sea.dark", "sea.haze", "sea.glow"]);
  });
});

describe("reset behavior", () => {
  test("re-rendering with no override reproduces the canonical output", () => {
    const overridden = renderSvg(tokens, 320, 320, { palette: { "sky.hot": "#ff0000" } });
    const resetAgain = renderSvg(tokens, 320, 320);
    const canonical = renderSvg(tokens, 320, 320);
    assert.notEqual(overridden, canonical);
    assert.equal(resetAgain, canonical);
  });
});

describe("Pages-relative token path behavior", () => {
  test("co-located candidate resolves next to the deployed page", () => {
    const base = "https://ybtiger107.github.io/palembang-graphic-system/";
    const [first] = tokenCandidateUrls(base);
    assert.equal(first, "https://ybtiger107.github.io/palembang-graphic-system/tokens/palembang.v1.json");
  });

  test("repository-relative fallback resolves two directories up from implementations/web/", () => {
    const base = "file:///repo/implementations/web/index.html";
    const [, second] = tokenCandidateUrls(base);
    assert.equal(second, "file:///repo/tokens/palembang.v1.json");
  });
});

describe("canonical token loading", () => {
  test("loadTokens returns parsed JSON from the co-located candidate when it is reachable", async () => {
    const fakeFetch = async (url) => {
      assert.match(url, /tokens\/palembang\.v1\.json$/);
      return { ok: true, json: async () => ({ loadedFrom: url }) };
    };
    const result = await loadTokens("https://example.invalid/implementations/web/index.html", fakeFetch);
    assert.match(result.loadedFrom, /^https:\/\/example\.invalid\/implementations\/web\/tokens\//);
  });

  test("loadTokens falls back to the repository-relative candidate when the first 404s", async () => {
    let calls = 0;
    const fakeFetch = async (url) => {
      calls += 1;
      if (calls === 1) return { ok: false, status: 404 };
      return { ok: true, json: async () => ({ loadedFrom: url }) };
    };
    const result = await loadTokens("https://example.invalid/implementations/web/index.html", fakeFetch);
    assert.equal(calls, 2);
    assert.equal(result.loadedFrom, "https://example.invalid/tokens/palembang.v1.json");
  });

  test("loadTokens throws with both candidates unreachable", async () => {
    const fakeFetch = async () => ({ ok: false, status: 500 });
    await assert.rejects(() => loadTokens("https://example.invalid/implementations/web/index.html", fakeFetch));
  });

  test("loadTokens on the real tokens file resolves the documented shape", async () => {
    const realTokens = JSON.parse(readFileSync(TOKENS_PATH, "utf8"));
    const fakeFetch = async () => ({ ok: true, json: async () => realTokens });
    const result = await loadTokens("https://example.invalid/implementations/web/index.html", fakeFetch);
    assert.deepEqual(scenePaletteTokens().every((t) => t in result.palette), true);
    assert.equal(result.geometry.horizonY, 0.5);
  });
});

describe("numeric helpers", () => {
  test("formatNumber normalizes negative zero and preserves precision", () => {
    assert.equal(formatNumber(-0), "0");
    assert.equal(formatNumber(2560), "2560");
    assert.equal(formatNumber(166.5), "166.5");
  });

  test("inverseAffine matches a hand-computed 2x2 inverse", () => {
    const [a, b, c, d, e, f] = inverseAffine([
      [2, 0, 1],
      [0, 4, -1],
    ]);
    const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);
    close(a, 0.5);
    close(b, 0);
    close(c, 0);
    close(d, 0.25);
    close(e, -0.5);
    close(f, 0.25);
  });
});
