/**
 * Curated palette presets: reusable data, not duplicated inline in event
 * handlers. A preset changes only the six scene color tokens (sky.hot,
 * sky.cool, sea.light, sea.dark, sea.haze, sea.glow) — never geometry,
 * gradient transforms, stop positions, horizon, dimensions, format, or
 * layer order (docs/specification.md §13, "palette replacement contract").
 *
 * "Original" is special: it has no hard-coded colors of its own (`colors:
 * null`) and resolves to whatever the canonical token palette actually is,
 * so it can never drift from tokens/palembang.v1.json.
 *
 * Every other preset defines a deliberate, complete set of all six roles
 * (see docs/specification.md §13.3 for the role philosophy: sky.hot stays
 * the warm/energetic focal role, sky.cool the surrounding field, sea.light/
 * sea.dark the lower-half depth contrast, sea.haze a neutral separator,
 * sea.glow a secondary translucent atmosphere) rather than picking
 * uncontrolled independent RGB values per token.
 */

import { scenePaletteTokens } from "./palembang.js";

export const ORIGINAL_PALETTE_ID = "original";

export const CURATED_PALETTES = [
  { id: "original", name: "Original", colors: null },
  {
    id: "midnight",
    name: "Midnight",
    colors: {
      "sky.hot": "#c2678d",
      "sky.cool": "#2b2d52",
      "sea.light": "#3a3f6b",
      "sea.dark": "#14162b",
      "sea.haze": "#8892b0",
      "sea.glow": "#4c6fa5",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    colors: {
      "sky.hot": "#e2965a",
      "sky.cool": "#3e7c99",
      "sea.light": "#6fa8a3",
      "sea.dark": "#234e52",
      "sea.haze": "#bfe3de",
      "sea.glow": "#3fa7a0",
    },
  },
  {
    id: "aurora",
    name: "Aurora",
    colors: {
      "sky.hot": "#7ee3b5",
      "sky.cool": "#4a3f7a",
      "sea.light": "#5b7a8c",
      "sea.dark": "#22263f",
      "sea.haze": "#b9c9d6",
      "sea.glow": "#8a5fbe",
    },
  },
  {
    id: "desert",
    name: "Desert",
    colors: {
      "sky.hot": "#e8a23a",
      "sky.cool": "#c9805a",
      "sea.light": "#c2966b",
      "sea.dark": "#7a5236",
      "sea.haze": "#e7d9c0",
      "sea.glow": "#d97b4b",
    },
  },
  {
    id: "rose",
    name: "Rose",
    colors: {
      "sky.hot": "#e8748c",
      "sky.cool": "#b98ca8",
      "sea.light": "#d3a7b5",
      "sea.dark": "#6b4256",
      "sea.haze": "#f2dce3",
      "sea.glow": "#c97aa0",
    },
  },
  {
    id: "monochrome",
    name: "Monochrome",
    colors: {
      "sky.hot": "#e8e8e8",
      "sky.cool": "#8c8c8c",
      "sea.light": "#a6a6a6",
      "sea.dark": "#3a3a3a",
      "sea.haze": "#cfcfcf",
      "sea.glow": "#5c5c5c",
    },
  },
  {
    id: "obsidian",
    name: "Obsidian",
    colors: {
      "sky.hot": "#8a6d4e",
      "sky.cool": "#14171c",
      "sea.light": "#23262e",
      "sea.dark": "#05060a",
      "sea.haze": "#3d4148",
      "sea.glow": "#2e4a52",
    },
  },
];

export function curatedPaletteById(id) {
  return CURATED_PALETTES.find((p) => p.id === id) ?? null;
}

/**
 * Resolve a curated palette to a full six-token color map. "Original"
 * resolves to the actual canonical palette passed in (never a hard-coded
 * copy), so it always exactly matches tokens/palembang.v1.json. Returns
 * null for an unknown id.
 */
export function resolveCuratedPalette(id, canonicalPalette) {
  const preset = curatedPaletteById(id);
  if (!preset) return null;
  const source = preset.colors === null ? canonicalPalette : preset.colors;
  const resolved = {};
  for (const token of scenePaletteTokens()) {
    resolved[token] = source[token];
  }
  return resolved;
}
