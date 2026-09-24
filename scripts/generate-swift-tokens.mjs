#!/usr/bin/env node
// Deterministically generate packages/swift/Sources/PalembangKit/CanonicalTokens.generated.swift
// from tokens/palembang.v1.json, the same way scripts/generate-core-assets.mjs
// generates packages/core/src/generated-tokens.js. tokens/palembang.v1.json
// remains the single authority; this script's only job is to embed it as
// Swift literals so PalembangKit needs no runtime JSON loading, no network,
// and no filesystem access at render time.
//
// Usage:
//   node scripts/generate-swift-tokens.mjs           # write the file
//   node scripts/generate-swift-tokens.mjs --check    # fail if stale

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOKENS_PATH = path.join(ROOT, "tokens", "palembang.v1.json");
const OUTPUT_PATH = path.join(
  ROOT,
  "packages",
  "swift",
  "Sources",
  "PalembangKit",
  "CanonicalTokens.generated.swift"
);

const tokens = JSON.parse(readFileSync(TOKENS_PATH, "utf8"));

function swiftNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`expected a finite number in tokens/palembang.v1.json, got ${value}`);
  }
  if (Object.is(value, -0)) return "-0.0";
  return String(value);
}

function swiftString(value) {
  return JSON.stringify(value);
}

function paletteLiteral(palette) {
  const lines = Object.entries(palette)
    .map(([key, value]) => `        ${swiftString(key)}: ${swiftString(value)},`)
    .join("\n");
  return `[\n${lines}\n    ]`;
}

function transformLiteral(transform) {
  const [[m00, m01, m02], [m10, m11, m12]] = transform;
  return (
    `AffineTransform(\n` +
    `            m00: ${swiftNumber(m00)}, m01: ${swiftNumber(m01)}, m02: ${swiftNumber(m02)},\n` +
    `            m10: ${swiftNumber(m10)}, m11: ${swiftNumber(m11)}, m12: ${swiftNumber(m12)}\n` +
    `        )`
  );
}

function stopsLiteral(stops) {
  const lines = stops
    .map(
      (stop) =>
        `            GradientStop(position: ${swiftNumber(stop.position)}, ` +
        `colorToken: ${swiftString(stop.colorToken)}, alpha: ${swiftNumber(stop.alpha)}),`
    )
    .join("\n");
  return `[\n${lines}\n        ]`;
}

function paintLiteral(name, paint, kind) {
  return (
    `    static let ${name} = GradientPaint(\n` +
    `        kind: .${kind},\n` +
    `        opacity: ${swiftNumber(paint.opacity)},\n` +
    `        transform: ${transformLiteral(paint.transform)},\n` +
    `        stops: ${stopsLiteral(paint.stops)}\n` +
    `    )\n`
  );
}

const smallOverride = tokens.sea?.haze?.small320SourceOverride?.middleStopAlpha;
if (smallOverride === undefined) {
  throw new Error("expected sea.haze.small320SourceOverride.middleStopAlpha in tokens/palembang.v1.json");
}

const sky = paintLiteral("sky", tokens.sky, "radial");
const seaBase = paintLiteral("seaBase", tokens.sea.base, "radial");
const seaHaze = paintLiteral("seaHaze", tokens.sea.haze, "linear");
const seaGlow = paintLiteral("seaGlow", tokens.sea.glow, "radial");

const output = `// GENERATED FILE. Do not edit by hand.
// Source: tokens/palembang.v1.json
// Regenerate: node scripts/generate-swift-tokens.mjs
// Verify:     node scripts/generate-swift-tokens.mjs --check
//
// This file embeds the canonical token values as Swift literals so
// PalembangKit needs no runtime JSON loading, no network access, and no
// filesystem dependency to render. tokens/palembang.v1.json remains the
// authoritative source; this file must never be hand-edited.

enum CanonicalTokens {
    static let horizonY: Double = ${swiftNumber(tokens.geometry.horizonY)}
    static let upperHeight: Double = ${swiftNumber(tokens.geometry.upperHeight)}
    static let lowerHeight: Double = ${swiftNumber(tokens.geometry.lowerHeight)}

    static let palette: [String: String] = ${paletteLiteral(tokens.palette)}

${sky}
${seaBase}
${seaHaze}
    static let seaHazeSmall320MiddleStopAlpha: Double = ${swiftNumber(smallOverride)}

${seaGlow}
}
`;

if (process.argv.includes("--check")) {
  let existing;
  try {
    existing = readFileSync(OUTPUT_PATH, "utf8");
  } catch {
    console.error(`${path.relative(ROOT, OUTPUT_PATH)} is missing; run node scripts/generate-swift-tokens.mjs`);
    process.exit(1);
  }
  if (existing !== output) {
    console.error(`${path.relative(ROOT, OUTPUT_PATH)} is stale; run node scripts/generate-swift-tokens.mjs`);
    process.exit(1);
  }
  console.log(`${path.relative(ROOT, OUTPUT_PATH)} is up to date`);
} else {
  writeFileSync(OUTPUT_PATH, output, "utf8");
  console.log(`wrote ${path.relative(ROOT, OUTPUT_PATH)}`);
}
