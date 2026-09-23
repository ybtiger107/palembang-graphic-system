#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOKENS_PATH = path.join(ROOT, "tokens", "palembang.v1.json");
const OUTPUT_PATH = path.join(ROOT, "packages", "core", "src", "generated-tokens.js");

const source = readFileSync(TOKENS_PATH, "utf8");
const tokens = JSON.parse(source);
const output = `// GENERATED FILE. Do not edit by hand.\n// Source: tokens/palembang.v1.json\n\nconst data = ${JSON.stringify(tokens, null, 2)};\n\nfunction deepFreeze(value) {\n  if (value && typeof value === "object" && !Object.isFrozen(value)) {\n    Object.freeze(value);\n    for (const child of Object.values(value)) deepFreeze(child);\n  }\n  return value;\n}\n\nexport const canonicalTokens = deepFreeze(data);\n`;

if (process.argv.includes("--check")) {
  const existing = readFileSync(OUTPUT_PATH, "utf8");
  if (existing !== output) {
    console.error(`${path.relative(ROOT, OUTPUT_PATH)} is stale; run node scripts/generate-core-assets.mjs`);
    process.exit(1);
  }
} else {
  writeFileSync(OUTPUT_PATH, output, "utf8");
}
