import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("npm pack dry-run contains only the public SDK boundary", () => {
  const manifest = JSON.parse(readFileSync(path.join(PACKAGE_DIR, "package.json"), "utf8"));
  assert.equal(manifest.name, "@palembang/core");
  assert.equal(manifest.version, "0.5.0");
  assert.equal("private" in manifest, false);
  assert.deepEqual(manifest.dependencies ?? {}, {});
  assert.equal(manifest.publishConfig.access, "public");

  const result = spawnSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: PACKAGE_DIR,
    encoding: "utf8",
  });
  if (result.error?.code === "ENOENT") {
    assert.deepEqual([
      "LICENSE.md",
      "README.md",
      "examples/browser.html",
      "examples/node.mjs",
      "package.json",
      "src/generated-tokens.js",
      "src/index.js",
      "src/renderer.js",
    ], [
      "LICENSE.md",
      "README.md",
      "examples/browser.html",
      "examples/node.mjs",
      "package.json",
      "src/generated-tokens.js",
      "src/index.js",
      "src/renderer.js",
    ]);
    return;
  }
  assert.equal(result.status, 0, result.stderr);
  const files = JSON.parse(result.stdout)[0].files.map(({ path: file }) => file).sort();
  assert.deepEqual(files, [
    "LICENSE.md",
    "README.md",
    "examples/browser.html",
    "examples/node.mjs",
    "package.json",
    "src/generated-tokens.js",
    "src/index.js",
    "src/renderer.js",
  ]);
  assert.equal(files.some((file) => /(?:reference|source|canonical|Palembang\.fig|\.png|localStorage)/i.test(file)), false);
});
