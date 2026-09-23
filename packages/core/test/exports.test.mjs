import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("public package exports import from a clean temporary consumer", () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), "palembang-core-consumer-"));
  try {
    const packageLink = path.join(temp, "node_modules", "@palembang", "core");
    mkdirSync(path.dirname(packageLink), { recursive: true });
    symlinkSync(PACKAGE_DIR, packageLink, "dir");
    const result = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", 'import { renderPalembangSvg } from "@palembang/core"; const svg = renderPalembangSvg({ width: 320, height: 320 }); if (!svg.includes("<svg") || !svg.includes("<metadata>")) process.exit(1);'],
      { cwd: temp, encoding: "utf8" }
    );
    assert.equal(result.status, 0, result.stderr);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
