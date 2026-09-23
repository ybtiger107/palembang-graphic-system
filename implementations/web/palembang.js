/**
 * Palembang browser renderer.
 *
 * Pure, DOM-free ES module: given canonical tokens (loaded from
 * tokens/palembang.v1.json), a palette override, and target dimensions, it
 * produces the same SVG structure as implementations/svg/render.py — same
 * gradient ids, layer order, gradientTransform math, and stop data. See
 * implementations/web/README.md for the Figma -> SVG mapping explanation and
 * cross-renderer parity evidence; the mapping itself is documented in
 * implementations/svg/README.md and must not drift between the two renderers.
 *
 * This module has no browser-only dependencies so it can also run under
 * Node for tests and cross-renderer parity checks.
 */

const SCENE_TOKENS = ["sky.hot", "sky.cool", "sea.light", "sea.dark", "sea.haze", "sea.glow"];

const CANDIDATE_TOKEN_URLS = ["./tokens/palembang.v1.json", "../../tokens/palembang.v1.json"];

/**
 * Format a number for SVG output. JS's `Number.prototype.toString()` already
 * produces the shortest round-trippable decimal (or scientific notation for
 * very small/large magnitudes), matching the intent of render.py's
 * `number()` (which trims Python's equally-minimal `repr(float(...))`).
 * SVG's <number> grammar permits exponent notation, so no reformatting is
 * needed beyond normalizing negative zero.
 */
export function formatNumber(value) {
  if (!Number.isFinite(value)) {
    throw new Error(`non-finite number: ${value}`);
  }
  if (value === 0) return "0";
  return String(value);
}

/**
 * Convert a Figma shape->gradient matrix (rows [m00,m01,m02], [m10,m11,m12])
 * into SVG's gradient->shape matrix(a b c d e f), identical to render.py's
 * inverse_affine + svg_matrix.
 */
export function inverseAffine(matrix) {
  const [a, b, c] = matrix[0];
  const [d, e, f] = matrix[1];
  const determinant = a * e - b * d;
  if (Math.abs(determinant) < 1e-15) {
    throw new Error("gradient transform is not invertible");
  }
  const row00 = e / determinant;
  const row01 = -b / determinant;
  const row02 = (b * f - e * c) / determinant;
  const row10 = -d / determinant;
  const row11 = a / determinant;
  const row12 = (d * c - a * f) / determinant;
  return [row00, row10, row01, row11, row02, row12];
}

export function svgMatrix(matrix) {
  return `matrix(${inverseAffine(matrix).map(formatNumber).join(" ")})`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paintColor(palette, token) {
  const value = palette[token];
  if (!value) {
    throw new Error(`unknown palette token: ${token}`);
  }
  return value;
}

function stopXml(stop, palette, alphaOverride) {
  const alpha = alphaOverride === undefined ? stop.alpha : alphaOverride;
  return (
    `      <stop offset="${formatNumber(stop.position)}" ` +
    `stop-color="${escapeXml(paintColor(palette, stop.colorToken))}" ` +
    `stop-opacity="${formatNumber(alpha)}"/>\n`
  );
}

function gradientXml(gradientId, paint, palette, kind, hazeMiddleAlpha) {
  const transform = svgMatrix(paint.transform);
  const stops = paint.stops
    .map((stop, index) =>
      stopXml(stop, palette, index === 1 && hazeMiddleAlpha !== undefined ? hazeMiddleAlpha : undefined)
    )
    .join("");

  const opening =
    kind === "radial"
      ? `    <radialGradient id="${gradientId}" gradientUnits="objectBoundingBox" ` +
        `cx="0.5" cy="0.5" r="0.5" gradientTransform="${transform}">\n`
      : `    <linearGradient id="${gradientId}" gradientUnits="objectBoundingBox" ` +
        `x1="0" y1="0.5" x2="1" y2="0.5" gradientTransform="${transform}">\n`;

  const tag = kind === "radial" ? "radialGradient" : "linearGradient";
  return `${opening}${stops}    </${tag}>\n`;
}

/**
 * Merge a runtime palette override on top of the canonical token palette.
 * Only the six scene tokens are accepted; unknown keys are ignored so a
 * caller can pass a full form-state object without filtering it first.
 */
export function mergePalette(basePalette, override) {
  const merged = { ...basePalette };
  if (!override) return merged;
  for (const token of SCENE_TOKENS) {
    if (override[token]) merged[token] = override[token];
  }
  return merged;
}

export function scenePaletteTokens() {
  return [...SCENE_TOKENS];
}

/**
 * Render the canonical Palembang scene as an SVG string.
 *
 * @param {object} tokens - parsed tokens/palembang.v1.json
 * @param {number} width - target width in CSS px / user units, > 0
 * @param {number} height - target height in CSS px / user units, > 0
 * @param {object} [options]
 * @param {object} [options.palette] - partial scene-token override
 * @param {number} [options.hazeMiddleAlpha] - explicit haze middle-stop alpha override
 * @param {boolean} [options.attribution] - include a CC BY attribution <metadata> block
 */
export function renderSvg(tokens, width, height, options = {}) {
  const geometry = tokens.geometry;
  if (geometry.horizonY !== 0.5 || geometry.upperHeight !== 0.5 || geometry.lowerHeight !== 0.5) {
    throw new Error("renderer requires the canonical 50/50 geometry tokens");
  }
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new Error("width and height must be finite positive numbers");
  }

  const palette = mergePalette(tokens.palette, options.palette);
  const haze = tokens.sea.haze;
  const smallOverride = haze.small320SourceOverride?.middleStopAlpha;
  const hazeMiddleAlpha =
    options.hazeMiddleAlpha !== undefined
      ? options.hazeMiddleAlpha
      : width === 320 && height === 320 && smallOverride !== undefined
      ? smallOverride
      : haze.stops[1].alpha;

  const halfHeight = height / 2;
  const widthText = formatNumber(width);
  const heightText = formatNumber(height);
  const halfText = formatNumber(halfHeight);
  const hazeAlphaText = formatNumber(hazeMiddleAlpha);

  const sky = gradientXml("sky", tokens.sky, palette, "radial");
  const base = gradientXml("sea-base", tokens.sea.base, palette, "radial");
  const hazeXml = gradientXml("sea-haze", tokens.sea.haze, palette, "linear", hazeMiddleAlpha);
  const glow = gradientXml("sea-glow", tokens.sea.glow, palette, "radial");

  const skyOpacity = formatNumber(tokens.sky.opacity);
  const baseOpacity = formatNumber(tokens.sea.base.opacity);
  const hazeOpacity = formatNumber(tokens.sea.haze.opacity);
  const glowOpacity = formatNumber(tokens.sea.glow.opacity);

  const metadata = options.attribution
    ? "  <metadata>Palembang Graphic System — ybtiger107. " +
      "https://github.com/ybtiger107/palembang-graphic-system — CC BY 4.0. " +
      "Generated by the Palembang Playground; see VISUAL-LICENSE.md for scope.</metadata>\n"
    : "";

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" ' +
    `width="${widthText}" height="${heightText}" viewBox="0 0 ${widthText} ${heightText}">\n` +
    "  <title>Palembang Graphic System</title>\n" +
    `  <desc>Canonical normalized SVG renderer; haze middle-stop alpha ${hazeAlphaText}</desc>\n` +
    metadata +
    "  <defs>\n" +
    sky +
    base +
    hazeXml +
    glow +
    "  </defs>\n" +
    `  <rect id="sky-field" x="0" y="0" width="${widthText}" height="${halfText}" ` +
    `fill="url(#sky)" opacity="${skyOpacity}"/>\n` +
    `  <rect id="sea-base-field" x="0" y="${halfText}" width="${widthText}" height="${halfText}" ` +
    `fill="url(#sea-base)" opacity="${baseOpacity}"/>\n` +
    `  <rect id="sea-haze-field" x="0" y="${halfText}" width="${widthText}" height="${halfText}" ` +
    `fill="url(#sea-haze)" opacity="${hazeOpacity}"/>\n` +
    `  <rect id="sea-glow-field" x="0" y="${halfText}" width="${widthText}" height="${halfText}" ` +
    `fill="url(#sea-glow)" opacity="${glowOpacity}"/>\n` +
    "</svg>\n"
  );
}

/**
 * Resolve the token URLs to try, in order, relative to a document/module base
 * URL. Kept as a pure function (no fetch) so the resolution logic is
 * testable under Node without a network stack. See README "Token loading on
 * GitHub Pages" for why there are two candidates.
 */
export function tokenCandidateUrls(baseUrl) {
  return CANDIDATE_TOKEN_URLS.map((path) => new URL(path, baseUrl).href);
}

/**
 * Fetch tokens/palembang.v1.json, trying the deployed co-located copy first
 * and falling back to the canonical repository-relative path for local dev.
 * Throws if neither candidate is reachable.
 */
export async function loadTokens(baseUrl, fetchImpl = fetch) {
  const candidates = tokenCandidateUrls(baseUrl);
  let lastError;
  for (const url of candidates) {
    try {
      const response = await fetchImpl(url);
      if (response.ok) return await response.json();
      lastError = new Error(`${url} responded ${response.status}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`could not load Palembang tokens from any candidate URL: ${candidates.join(", ")}\n${lastError}`);
}
