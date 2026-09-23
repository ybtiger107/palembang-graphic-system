#!/usr/bin/env node

import { realpathSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { renderPalembangSvg, scenePaletteTokens } from "@palembang/core";
import { CliUsageError, parseCli } from "./args.js";

const PACKAGE_JSON = new URL("../package.json", import.meta.url);
const PACKAGE = JSON.parse(await readFile(PACKAGE_JSON, "utf8"));

const TOP_LEVEL_HELP = `Palembang CLI

Usage:
  palembang render [options]
  palembang --help
  palembang --version

Examples:
  palembang render --size 1920x1080 -o palembang.svg
  palembang render --size 1920x1080 > palembang.svg

Run "palembang render --help" for render options.
`;

const RENDER_HELP = `Palembang CLI

Usage:
  palembang render [options]

Dimensions:
  --size WIDTHxHEIGHT       Convenience form, for example 1920x1080
  --width WIDTH             Use with --height
  --height HEIGHT           Use with --width

Output:
  -o, --output PATH         Write UTF-8 SVG to PATH (creates parent directories)
                            Without this option, write only SVG to stdout

Appearance:
  --color TOKEN=#RRGGBB     Repeatable override for the six scene tokens
  --no-attribution          Omit embedded metadata (CC BY 4.0 obligations remain)
  --haze-middle-alpha N     Override haze middle-stop alpha from 0 to 1

Supported color tokens:
  sky.hot  sky.cool  sea.light  sea.dark  sea.haze  sea.glow

Examples:
  palembang render --size 1920x1080 -o palembang.svg
  palembang render --size 1920x1080 --color sky.hot=#D97706 --no-attribution -o custom.svg
`;

function isDirectExecution() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

async function run(argv) {
  const parsed = parseCli(argv, scenePaletteTokens);
  if (parsed.version) {
    process.stdout.write(`${PACKAGE.version}\n`);
    return;
  }
  if (parsed.help || parsed.command === null) {
    process.stdout.write(parsed.command === "render" ? RENDER_HELP : TOP_LEVEL_HELP);
    return;
  }

  const svg = renderPalembangSvg({
    width: parsed.width,
    height: parsed.height,
    palette: parsed.palette,
    attribution: parsed.attribution,
    hazeMiddleAlpha: parsed.hazeMiddleAlpha,
  });

  if (parsed.output === undefined) {
    process.stdout.write(svg);
    return;
  }

  await mkdir(dirname(parsed.output), { recursive: true });
  await writeFile(parsed.output, svg, { encoding: "utf8" });
}

if (isDirectExecution()) {
  try {
    await run(process.argv.slice(2));
  } catch (error) {
    if (error instanceof CliUsageError || error instanceof TypeError || error instanceof RangeError) {
      process.stderr.write(`Error: ${error.message}\n`);
      process.exitCode = 2;
    } else {
      process.stderr.write(`Error: ${error.message}\n`);
      process.exitCode = 1;
    }
  }
}

export { run };
