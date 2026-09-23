// Generates SVGs with the browser renderer for the same representative
// sizes/options used by the Python parity check, so the two outputs can be
// diffed structurally. See implementations/web/test/parity_check.py.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { renderSvg } from "../palembang.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const TOKENS_PATH = path.join(ROOT, "tokens/palembang.v1.json");
const OUT_DIR = process.argv[2] || path.join(ROOT, "implementations/web/test/.parity-out");

const CASES = [
  { name: "320x320", width: 320, height: 320 },
  { name: "2560x1080", width: 2560, height: 1080 },
  { name: "2560x1664", width: 2560, height: 1664 },
  { name: "2560x2560", width: 2560, height: 2560 },
  { name: "777x333-arbitrary", width: 777, height: 333 },
  {
    name: "palette-override",
    width: 1200,
    height: 800,
    options: { palette: { "sky.hot": "#ff3366", "sea.glow": "#22ffdd" } },
  },
];

const tokens = JSON.parse(readFileSync(TOKENS_PATH, "utf8"));
mkdirSync(OUT_DIR, { recursive: true });

for (const { name, width, height, options } of CASES) {
  const svg = renderSvg(tokens, width, height, options);
  writeFileSync(path.join(OUT_DIR, `${name}.svg`), svg, "utf8");
}

console.log(`Wrote ${CASES.length} JS-rendered SVGs to ${OUT_DIR}`);
