import { canonicalTokens } from "./generated-tokens.js";
import { renderSvg, scenePaletteTokens as getScenePaletteTokens } from "./renderer.js";

const SCENE_TOKENS = Object.freeze(getScenePaletteTokens());
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function freezeObject(object) {
  return Object.freeze(object);
}

export const scenePaletteTokens = SCENE_TOKENS;
export const canonicalPalette = freezeObject(
  Object.fromEntries(SCENE_TOKENS.map((token) => [token, canonicalTokens.palette[token]]))
);

function validateOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("options must be an object");
  }
  const { width, height } = options;
  if (!Number.isFinite(width) || width <= 0) {
    throw new TypeError("width must be a finite positive number");
  }
  if (!Number.isFinite(height) || height <= 0) {
    throw new TypeError("height must be a finite positive number");
  }

  const palette = options.palette;
  if (palette !== undefined && (!palette || typeof palette !== "object" || Array.isArray(palette))) {
    throw new TypeError("palette must be an object");
  }
  if (palette) {
    for (const [token, value] of Object.entries(palette)) {
      if (!SCENE_TOKENS.includes(token)) {
        throw new RangeError(`unknown palette token: ${token}`);
      }
      if (typeof value !== "string" || !HEX_COLOR.test(value)) {
        throw new TypeError(`${token} must be a #RRGGBB color`);
      }
    }
  }

  if (options.attribution !== undefined && typeof options.attribution !== "boolean") {
    throw new TypeError("attribution must be a boolean");
  }
  if (options.hazeMiddleAlpha !== undefined) {
    if (!Number.isFinite(options.hazeMiddleAlpha) || options.hazeMiddleAlpha < 0 || options.hazeMiddleAlpha > 1) {
      throw new TypeError("hazeMiddleAlpha must be a finite number from 0 to 1");
    }
  }
}

/**
 * Render canonical Palembang as a standalone SVG string.
 *
 * @param {{width: number, height: number, palette?: Record<string, string>, attribution?: boolean, hazeMiddleAlpha?: number}} options
 * @returns {string}
 */
export function renderPalembangSvg(options) {
  validateOptions(options);
  return renderSvg(canonicalTokens, options.width, options.height, {
    palette: options.palette,
    attribution: options.attribution === undefined ? true : options.attribution,
    hazeMiddleAlpha: options.hazeMiddleAlpha,
  });
}
