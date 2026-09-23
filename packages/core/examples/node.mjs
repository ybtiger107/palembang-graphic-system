import { writeFile } from "node:fs/promises";
import { renderPalembangSvg } from "../src/index.js";

const svg = renderPalembangSvg({
  width: 1920,
  height: 1080,
  palette: { "sky.hot": "#DF8117" },
});

await writeFile("palembang.svg", svg, "utf8");
