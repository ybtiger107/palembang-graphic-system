/**
 * Shareable URL state — "share schema v1".
 *
 * A public format, versioned independently of the internal localStorage
 * session schema (playground-state.js's STORAGE_KEY) so the two can evolve
 * separately. Pure, DOM-free: no `location`/`history` access here — app.js
 * reads/writes the URL and calls these functions with plain strings.
 *
 * ## Wire format
 *
 * `encodeShareState()` builds a small plain object, JSON-stringifies it,
 * and base64url-encodes the result (RFC 4648 §5: `+`/`/` -> `-`/`_`, no
 * padding) so it is safe to place directly after `#ps=` in a URL with no
 * further percent-encoding. All values a payload can legally contain are
 * ASCII (preset ids we define, digits, `#rrggbb` hex colors), so plain
 * `btoa`/`atob` (not a UTF-8-aware encoder) is sufficient and avoids extra
 * code for multi-byte text this format never needs to carry.
 *
 * Decoded JSON shape (keys kept short — this string lives in a URL):
 *
 *   v: 1                        share schema version (this module only understands 1)
 *   m: "s" | "w"                mode: standard | wallpaper
 *   p: string                   preset id:
 *                                 - mode "s": one of STANDARD_PRESETS ids, or "custom"
 *                                 - mode "w": a WALLPAPER_PRESETS id
 *   w: number  (optional)       width — present for mode "s" (always; the
 *                                 user-editable width for a standard preset,
 *                                 or the custom width) and absent for mode "w"
 *                                 (the wallpaper preset already fixes both
 *                                 dimensions)
 *   h: number  (optional)       height — present only when p === "custom"
 *                                 (a non-custom standard preset derives it
 *                                 from the ratio; wallpaper mode fixes it)
 *   c: (string|null)[6] (optional) palette override array, positionally
 *                                 matching scenePaletteTokens() order; a
 *                                 null entry means "use the canonical color
 *                                 for that role." Omitted entirely when the
 *                                 palette exactly matches canonical (the
 *                                 common case, and the whole of "Original").
 *
 * Nothing else is included: no localStorage ids, timestamps, device info,
 * or provenance. See implementations/web/README.md "Sharing" for the
 * privacy statement this format is designed to satisfy.
 *
 * ## Decoding failure policy
 *
 * `decodeShareState()` returns `null` (never throws) for anything that
 * isn't recoverably a share payload: malformed base64/JSON, a non-object
 * payload, or an unrecognized `v`. Callers are expected to fall through to
 * the next state source (last local session, then canonical defaults) when
 * they get `null` — see app.js's boot sequence.
 *
 * Individual out-of-range or unrecognized *fields* inside an otherwise
 * valid v1 payload (e.g. a tampered preset id, a malformed hex color)
 * degrade field-by-field to the canonical default for that field, mirroring
 * playground-state.js's restoreState() so a partially-corrupted-but-still-
 * v1 link still opens as *something* sensible instead of failing outright.
 */

import { scenePaletteTokens } from "./palembang.js";
import {
  CUSTOM_PRESET_ID,
  CANONICAL_STANDARD_PRESET_ID,
  DEFAULT_WALLPAPER_PRESET_ID,
  standardPresetById,
  wallpaperPresetById,
  createDefaultState,
  computeEffectiveDimensions,
  clampDimension,
  normalizeHex,
  isFiniteNumber,
  restoreState,
} from "./playground-state.js";

export const SHARE_SCHEMA_VERSION = 1;
export const SHARE_PARAM = "ps";

function base64UrlEncode(text) {
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(text) {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const paddingNeeded = (4 - (padded.length % 4)) % 4;
  return atob(padded + "=".repeat(paddingNeeded));
}

/**
 * Encode the visual design a state represents into a compact, URL-safe
 * string (the part after `ps=`). Deterministic: the same state and
 * canonicalPalette always produce the same string, since object key
 * insertion order (and therefore JSON.stringify's key order) is fixed here.
 */
export function encodeShareState(state, canonicalPalette) {
  const payload = { v: SHARE_SCHEMA_VERSION };

  if (state.mode === "wallpaper") {
    payload.m = "w";
    payload.p = wallpaperPresetById(state.wallpaperPresetId) ? state.wallpaperPresetId : DEFAULT_WALLPAPER_PRESET_ID;
  } else {
    payload.m = "s";
    if (state.standardPresetId === CUSTOM_PRESET_ID) {
      payload.p = CUSTOM_PRESET_ID;
      const effective = computeEffectiveDimensions(state);
      payload.w = effective.width;
      payload.h = effective.height;
    } else {
      const preset = standardPresetById(state.standardPresetId) ?? standardPresetById(CANONICAL_STANDARD_PRESET_ID);
      payload.p = preset.id;
      payload.w = clampDimension(state.standardWidth);
    }
  }

  const colors = scenePaletteTokens().map((token) =>
    state.palette[token] !== canonicalPalette[token] ? state.palette[token] : null
  );
  if (colors.some((color) => color !== null)) payload.c = colors;

  return base64UrlEncode(JSON.stringify(payload));
}

/**
 * Decode a share-link value back into a full PlaygroundState (built on
 * createDefaultState so every field is always present). Returns null if
 * the value isn't a recoverable v1 share payload at all; degrades
 * individual unrecognized fields to their canonical default otherwise. See
 * the module doc comment above for the exact policy.
 */
export function decodeShareState(value, canonicalPalette) {
  if (typeof value !== "string" || value === "") return null;

  let parsed;
  try {
    parsed = JSON.parse(base64UrlDecode(value));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  if (parsed.v !== SHARE_SCHEMA_VERSION) return null;

  const state = createDefaultState(canonicalPalette);

  if (parsed.m === "w") {
    state.mode = "wallpaper";
    if (wallpaperPresetById(parsed.p)) state.wallpaperPresetId = parsed.p;
  } else if (parsed.m === "s") {
    state.mode = "standard";
    if (parsed.p === CUSTOM_PRESET_ID) {
      state.standardPresetId = CUSTOM_PRESET_ID;
      if (isFiniteNumber(parsed.w)) state.customWidth = clampDimension(parsed.w);
      if (isFiniteNumber(parsed.h)) state.customHeight = clampDimension(parsed.h);
    } else if (standardPresetById(parsed.p)) {
      state.standardPresetId = parsed.p;
      state.standardWidth = isFiniteNumber(parsed.w) ? clampDimension(parsed.w) : standardPresetById(parsed.p).width;
    }
    // An unrecognized preset id leaves state at createDefaultState's canonical Wide preset.
  } else {
    return null; // m must be "s" or "w" for a v1 payload to mean anything.
  }

  const tokens = scenePaletteTokens();
  if (Array.isArray(parsed.c) && parsed.c.length === tokens.length) {
    tokens.forEach((token, index) => {
      const raw = parsed.c[index];
      const normalized = typeof raw === "string" ? normalizeHex(raw) : null;
      if (normalized) state.palette[token] = normalized;
    });
  }

  return state;
}

/**
 * Build a full shareable URL from a base URL (typically
 * `location.origin + location.pathname`, i.e. with no pre-existing query
 * string or hash — app.js is responsible for that) and the current design.
 * Any existing query string or hash on `baseUrl` is stripped first, so
 * calling this with the page's current full `location.href` is also safe.
 */
export function buildShareUrl(baseUrl, state, canonicalPalette) {
  const trimmed = String(baseUrl).split("#")[0].split("?")[0];
  return `${trimmed}#${SHARE_PARAM}=${encodeShareState(state, canonicalPalette)}`;
}

/**
 * Pull the share value out of a `location.hash`-shaped string (e.g.
 * `"#ps=abc123"`, `""`, or `"#other=1&ps=abc123"`). Pure string parsing —
 * no `location` access — so it's testable without a DOM/URL environment.
 */
export function extractShareValue(hash) {
  if (!hash) return null;
  const clean = hash.startsWith("#") ? hash.slice(1) : hash;
  if (clean === "") return null;
  return new URLSearchParams(clean).get(SHARE_PARAM);
}

/**
 * The page-load precedence rule, as a pure function so it's directly
 * testable without a DOM: a valid shared URL state wins over the last
 * local session, which wins over canonical defaults. `restoreState()`
 * already falls back to canonical defaults on its own when
 * `lastSessionRaw` is missing/invalid, so this only has one real decision
 * to make (share vs. not). `loadedFromShare` tells the caller whether to
 * show the subtle "Shared design loaded" notice and skip the first
 * auto-persist (see app.js's applyEffective `skipPersist`).
 */
export function resolveBootState(canonicalPalette, { hash, lastSessionRaw } = {}) {
  const shareValue = extractShareValue(hash);
  const sharedState = shareValue ? decodeShareState(shareValue, canonicalPalette) : null;
  if (sharedState) return { state: sharedState, loadedFromShare: true };
  return { state: restoreState(lastSessionRaw ?? null, canonicalPalette), loadedFromShare: false };
}
