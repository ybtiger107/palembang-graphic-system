import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { renderPalembangSvg, scenePaletteTokens } from "@palembang/core";

const PACKAGE_DIR = resolve(import.meta.dirname, "..");
const CLI = join(PACKAGE_DIR, "src", "cli.js");

function invoke(...args) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd: PACKAGE_DIR,
    encoding: "utf8",
  });
}

function assertFailure(result, message) {
  assert.notEqual(result.status, 0, message);
  assert.equal(result.stdout, "", message);
  assert.match(result.stderr, /^Error: /, message);
}

test("help and version are concise and successful", () => {
  const help = invoke("--help");
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Palembang CLI/);
  assert.match(help.stdout, /palembang render \[options\]/);
  assert.equal(help.stderr, "");

  const renderHelp = invoke("render", "--help");
  assert.equal(renderHelp.status, 0);
  assert.match(renderHelp.stdout, /--color TOKEN=#RRGGBB/);
  assert.match(renderHelp.stdout, /CC BY 4\.0 obligations remain/);

  const version = invoke("-v");
  assert.equal(version.status, 0);
  assert.equal(version.stdout, "0.6.0\n");
  assert.equal(version.stderr, "");
});

test("stdout rendering is byte-identical to @palembang/core", () => {
  const result = invoke("render", "--size", "777x333");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout, renderPalembangSvg({ width: 777, height: 333 }));
});

test("explicit dimensions, all palette overrides, haze, and attribution map to core", () => {
  const palette = Object.fromEntries(scenePaletteTokens.map((token, index) => [token, `#${index + 1}${index + 1}${index + 1}${index + 1}${index + 1}${index + 1}`]));
  const args = ["render", "--width", "1000", "--height", "500", "--haze-middle-alpha", "0.25", "--no-attribution"];
  for (const token of scenePaletteTokens) args.push("--color", `${token}=${palette[token]}`);
  const result = invoke(...args);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, renderPalembangSvg({
    width: 1000,
    height: 500,
    palette,
    hazeMiddleAlpha: 0.25,
    attribution: false,
  }));
  assert.doesNotMatch(result.stdout, /<metadata>/);
});

test("file output creates parents, handles spaces, and overwrites deterministically", () => {
  const directory = mkdtempSync(join(tmpdir(), "palembang-cli-"));
  try {
    const output = join(directory, "nested path", "palembang.svg");
    const first = invoke("render", "--size", "320x320", "-o", output);
    assert.equal(first.status, 0, first.stderr);
    assert.equal(first.stdout, "");
    assert.equal(readFileSync(output, "utf8"), renderPalembangSvg({ width: 320, height: 320 }));

    writeFileSync(output, "stale output", "utf8");
    const second = invoke("render", "--width", "320", "--height", "320", "--output", output);
    assert.equal(second.status, 0, second.stderr);
    assert.equal(readFileSync(output, "utf8"), renderPalembangSvg({ width: 320, height: 320 }));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("dimension validation rejects ambiguous and malformed input", () => {
  assertFailure(invoke("render", "--size", "1920x1080", "--width", "1000", "--height", "500"), "dimension conflict");
  assert.match(invoke("render", "--size", "1920").stderr, /--size must use WIDTHxHEIGHT/);
  assertFailure(invoke("render", "--width", "0", "--height", "100"), "zero width");
  assertFailure(invoke("render", "--width", "-1", "--height", "100"), "negative width");
  assertFailure(invoke("render", "--width", "100"), "missing height");
});

test("palette validation rejects unknown and malformed overrides", () => {
  const unknown = invoke("render", "--size", "100x100", "--color", "sky.foo=#ffffff");
  assertFailure(unknown, "unknown token");
  assert.match(unknown.stderr, /unknown palette token "sky\.foo"/);

  const shortHex = invoke("render", "--size", "100x100", "--color", "sky.hot=#fff");
  assertFailure(shortHex, "short color");
  assert.match(shortHex.stderr, /#RRGGBB/);

  assertFailure(invoke("render", "--size", "100x100", "--color", "invalid"), "malformed color");
});

test("the package has only the core runtime dependency", () => {
  const packageJson = JSON.parse(readFileSync(join(PACKAGE_DIR, "package.json"), "utf8"));
  assert.deepEqual(Object.keys(packageJson.dependencies), ["@palembang/core"]);
  assert.equal(packageJson.bin.palembang, "./src/cli.js");
  assert.equal("private" in packageJson, false);
  assert.equal(packageJson.engines.node, ">=20");
});
