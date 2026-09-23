/**
 * Pure Playground state/preset logic: no DOM, no localStorage access.
 * app.js owns the actual `localStorage.getItem/setItem` calls and DOM
 * wiring; this module only computes what the effective output size should
 * be and how to validate/restore a persisted state object, so that logic
 * can run (and be tested) under Node without a browser. Mirrors the
 * palembang.js (pure renderer) / app.js (DOM) split.
 */

import { scenePaletteTokens } from "./palembang.js";

export const MIN_DIMENSION = 16;
export const MAX_DIMENSION = 6000;

export const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function normalizeHex(value) {
  const trimmed = String(value).trim();
  if (!HEX_RE.test(trimmed)) return null;
  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

export function clampDimension(value) {
  const rounded = Math.round(value);
  if (!Number.isFinite(rounded)) return MIN_DIMENSION;
  return Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, rounded));
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function currentGcd(a, b) {
  return b === 0 ? a : currentGcd(b, a % b);
}

export function ratioLabel(width, height) {
  const g = currentGcd(Math.round(width), Math.round(height)) || 1;
  return `${Math.round(width) / g}:${Math.round(height) / g}`;
}

// --- Standard format presets (Square / Medium / Wide + Custom) ---------

export const STANDARD_PRESETS = [
  { id: "square", label: "Square", width: 2560, height: 2560, ratio: "1:1" },
  { id: "medium", label: "Medium", width: 2560, height: 1664, ratio: "20:13" },
  { id: "wide", label: "Wide", width: 2560, height: 1080, ratio: "64:27" },
];
export const CUSTOM_PRESET_ID = "custom";
export const CANONICAL_STANDARD_PRESET_ID = "wide";

export function standardPresetById(id) {
  return STANDARD_PRESETS.find((p) => p.id === id) ?? null;
}

/** Height derived from a standard preset's canonical ratio at the given width, or null for Custom/unknown presets. */
export function deriveStandardHeight(presetId, width) {
  const preset = standardPresetById(presetId);
  if (!preset) return null;
  return Math.round((width * preset.height) / preset.width);
}

// --- Wallpaper presets ---------------------------------------------------

export const WALLPAPER_GROUPS = [
  {
    label: "Phone",
    presets: [
      { id: "iphone-1290x2796", label: "iPhone", width: 1290, height: 2796 },
      { id: "iphone-1179x2556", label: "iPhone (smaller)", width: 1179, height: 2556 },
    ],
  },
  {
    label: "Tablet",
    presets: [{ id: "ipad-2048x2732", label: "iPad", width: 2048, height: 2732 }],
  },
  {
    label: "Desktop",
    presets: [
      { id: "desktop-fhd", label: "Desktop FHD", width: 1920, height: 1080 },
      { id: "desktop-qhd", label: "Desktop QHD", width: 2560, height: 1440 },
      { id: "desktop-4k", label: "Desktop 4K", width: 3840, height: 2160 },
    ],
  },
  {
    label: "Ultrawide",
    presets: [
      { id: "ultrawide-3440", label: "Ultrawide", width: 3440, height: 1440 },
      { id: "ultrawide-5120", label: "Ultrawide (super)", width: 5120, height: 1440 },
    ],
  },
];
export const WALLPAPER_PRESETS = WALLPAPER_GROUPS.flatMap((g) => g.presets);
export const DEFAULT_WALLPAPER_PRESET_ID = "desktop-qhd";

export function wallpaperPresetById(id) {
  return WALLPAPER_PRESETS.find((p) => p.id === id) ?? null;
}

// --- Output modes ----------------------------------------------------------

export const MODES = ["standard", "wallpaper"];
export const DEFAULT_MODE = "standard";

// --- State shape -------------------------------------------------------

/**
 * @typedef {object} PlaygroundState
 * @property {"standard"|"wallpaper"} mode
 * @property {string} standardPresetId - one of STANDARD_PRESETS ids, or CUSTOM_PRESET_ID
 * @property {number} standardWidth - user-editable width while a non-custom standard preset is active
 * @property {number} customWidth
 * @property {number} customHeight
 * @property {string} wallpaperPresetId
 * @property {Record<string,string>} palette - full six-token scene palette (canonical values merged with overrides)
 */

export function createDefaultState(canonicalPalette) {
  const canonical = standardPresetById(CANONICAL_STANDARD_PRESET_ID);
  return {
    mode: DEFAULT_MODE,
    standardPresetId: CANONICAL_STANDARD_PRESET_ID,
    standardWidth: canonical.width,
    customWidth: canonical.width,
    customHeight: canonical.height,
    wallpaperPresetId: DEFAULT_WALLPAPER_PRESET_ID,
    palette: { ...canonicalPalette },
  };
}

/**
 * The single source of truth for "what size is actually being previewed/exported right now."
 * Wallpaper mode always wins over any standard/custom width state; a non-custom
 * standard preset always derives height from width, never the other way around.
 */
export function computeEffectiveDimensions(state) {
  if (state.mode === "wallpaper") {
    const preset = wallpaperPresetById(state.wallpaperPresetId) ?? wallpaperPresetById(DEFAULT_WALLPAPER_PRESET_ID);
    return { width: clampDimension(preset.width), height: clampDimension(preset.height) };
  }
  if (state.standardPresetId === CUSTOM_PRESET_ID) {
    return { width: clampDimension(state.customWidth), height: clampDimension(state.customHeight) };
  }
  const width = clampDimension(state.standardWidth);
  const derivedHeight = deriveStandardHeight(state.standardPresetId, width);
  const preset = standardPresetById(state.standardPresetId) ?? standardPresetById(CANONICAL_STANDARD_PRESET_ID);
  return { width, height: clampDimension(derivedHeight ?? preset.height) };
}

/**
 * Pure transition for the "switch to Custom" UI action: seeds
 * customWidth/customHeight from the state's *current* effective dimensions
 * (the standard/wallpaper size that was on screen a moment ago) computed
 * against the ORIGINAL state, before standardPresetId flips to "custom" —
 * so switching to Custom starts from what was visible instead of jumping to
 * an unrelated leftover size. Returns the state unchanged if already Custom.
 */
export function switchToCustomPreset(state) {
  if (state.standardPresetId === CUSTOM_PRESET_ID) return state;
  const effective = computeEffectiveDimensions(state);
  return {
    ...state,
    standardPresetId: CUSTOM_PRESET_ID,
    customWidth: effective.width,
    customHeight: effective.height,
  };
}

// --- Persistence ---------------------------------------------------------

export const STORAGE_KEY = "palembang-playground:v1";

export function serializeState(state, canonicalPalette) {
  const overrides = {};
  for (const token of scenePaletteTokens()) {
    if (state.palette[token] !== canonicalPalette[token]) overrides[token] = state.palette[token];
  }
  const effective = computeEffectiveDimensions(state);
  return {
    version: 1,
    mode: state.mode,
    standardPresetId: state.standardPresetId,
    standardWidth: state.standardWidth,
    customWidth: state.customWidth,
    customHeight: state.customHeight,
    wallpaperPresetId: state.wallpaperPresetId,
    effectiveWidth: effective.width,
    effectiveHeight: effective.height,
    paletteOverrides: overrides,
  };
}

/**
 * Reconstruct a PlaygroundState from a raw JSON string (as read from
 * localStorage). Every field is validated independently and falls back to
 * the canonical default for that field alone, so partial corruption (a
 * hand-edited value, a future/foreign schema, a dropped key) degrades
 * gracefully instead of discarding the whole saved session. A value that
 * cannot be parsed as JSON at all, or isn't an object, returns the full
 * canonical default state.
 */
export function restoreState(rawJson, canonicalPalette) {
  const fallback = createDefaultState(canonicalPalette);
  if (typeof rawJson !== "string" || rawJson === "") return fallback;

  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return fallback;
  }
  if (!parsed || typeof parsed !== "object") return fallback;

  const state = createDefaultState(canonicalPalette);

  if (MODES.includes(parsed.mode)) state.mode = parsed.mode;

  const validStandardIds = new Set([...STANDARD_PRESETS.map((p) => p.id), CUSTOM_PRESET_ID]);
  if (validStandardIds.has(parsed.standardPresetId)) state.standardPresetId = parsed.standardPresetId;

  if (isFiniteNumber(parsed.standardWidth)) state.standardWidth = clampDimension(parsed.standardWidth);
  if (isFiniteNumber(parsed.customWidth)) state.customWidth = clampDimension(parsed.customWidth);
  if (isFiniteNumber(parsed.customHeight)) state.customHeight = clampDimension(parsed.customHeight);

  if (wallpaperPresetById(parsed.wallpaperPresetId)) state.wallpaperPresetId = parsed.wallpaperPresetId;

  if (parsed.paletteOverrides && typeof parsed.paletteOverrides === "object") {
    for (const token of scenePaletteTokens()) {
      const value = parsed.paletteOverrides[token];
      const normalized = typeof value === "string" ? normalizeHex(value) : null;
      if (normalized) state.palette[token] = normalized;
    }
  }

  return state;
}
