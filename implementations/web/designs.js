/**
 * Named, portable Palembang designs: multiple locally saved designs
 * (localStorage) and the human-readable JSON file export/import envelope.
 * Both wrap the exact same inner "design" shape that playground-state.js's
 * last-session persistence already uses (serializeState()/restoreState()),
 * so there is one schema for "what a Palembang design is," reused across
 * the last-session key, saved designs, and exported files — not three
 * parallel formats to keep in sync.
 *
 * Pure and DOM-free: app.js owns the localStorage.getItem/setItem calls and
 * File/Blob handling; every function here takes and returns plain data.
 */

import { serializeState, restoreState } from "./playground-state.js";

export const SAVED_DESIGNS_STORAGE_KEY = "palembang-saved:v1";
export const SAVED_DESIGNS_SCHEMA_VERSION = 1;
export const MAX_SAVED_DESIGNS = 50;
export const MAX_DESIGN_NAME_LENGTH = 60;

export const DESIGN_FILE_FORMAT = "palembang-design";
export const DESIGN_FILE_VERSION = 1;

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for an environment without crypto.randomUUID (e.g. a very old
  // browser, or a non-secure context where browsers withhold it): not
  // cryptographically strong, but only needs to be unique among this
  // browser's own saved designs, not globally unpredictable.
  return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeName(name) {
  return String(name ?? "")
    .trim()
    .slice(0, MAX_DESIGN_NAME_LENGTH);
}

/** The next "Palembang N" default name that isn't already in use, so saving never requires typing a name first. */
export function nextDefaultName(designs) {
  const used = new Set(designs.map((d) => d.name));
  let n = designs.length + 1;
  while (used.has(`Palembang ${n}`)) n++;
  return `Palembang ${n}`;
}

/** A filesystem-friendly slug for export filenames; never empty. */
export function slugifyName(name) {
  const slug = String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "palembang-design";
}

// --- Saved designs list (localStorage) ------------------------------

/**
 * Reconstruct the saved-designs list from a raw JSON string (as read from
 * localStorage). Each entry is validated independently and simply dropped
 * if malformed, so one corrupted saved design never destroys the rest of
 * the list. Anything unparseable, or not shaped like a designs container
 * at all, returns an empty list rather than throwing.
 *
 * Only the container-level shape is checked here (id/name/design present
 * with the right types). The `design` field's own contents are validated
 * later, field-by-field, by restoreState() at the moment a design is
 * actually opened (loadSavedDesignState()) — deliberately not duplicated
 * here.
 */
export function restoreSavedDesigns(rawJson) {
  if (typeof rawJson !== "string" || rawJson === "") return [];

  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.designs)) return [];

  const out = [];
  for (const entry of parsed.designs) {
    if (out.length >= MAX_SAVED_DESIGNS) break;
    if (!entry || typeof entry !== "object") continue;
    if (typeof entry.id !== "string" || entry.id === "") continue;
    if (typeof entry.name !== "string" || entry.name.trim() === "") continue;
    if (!entry.design || typeof entry.design !== "object") continue;

    const createdAt = typeof entry.createdAt === "string" ? entry.createdAt : new Date(0).toISOString();
    out.push({
      id: entry.id,
      name: sanitizeName(entry.name),
      design: entry.design,
      createdAt,
      updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : createdAt,
    });
  }
  return out;
}

export function serializeSavedDesigns(designs) {
  return { version: SAVED_DESIGNS_SCHEMA_VERSION, designs };
}

/** Save the current design as a brand-new entry. Throws if at MAX_SAVED_DESIGNS. */
export function addSavedDesign(designs, name, state, canonicalPalette) {
  if (designs.length >= MAX_SAVED_DESIGNS) {
    throw new Error(`Saved design limit reached (${MAX_SAVED_DESIGNS}). Delete one first.`);
  }
  const now = new Date().toISOString();
  const entry = {
    id: generateId(),
    name: sanitizeName(name) || nextDefaultName(designs),
    design: serializeState(state, canonicalPalette),
    createdAt: now,
    updatedAt: now,
  };
  return { designs: [...designs, entry], entry };
}

/** Returns a new list with `id` renamed. Throws if the name is empty or `id` isn't found. */
export function renameSavedDesign(designs, id, newName) {
  const clean = sanitizeName(newName);
  if (!clean) throw new Error("Name cannot be empty.");
  let found = false;
  const next = designs.map((d) => {
    if (d.id !== id) return d;
    found = true;
    return { ...d, name: clean, updatedAt: new Date().toISOString() };
  });
  if (!found) throw new Error("Saved design not found.");
  return next;
}

/** Returns a new list with a copy of `id` appended (new id/timestamps, "<name> copy" avoiding collisions). Throws if not found or at capacity. */
export function duplicateSavedDesign(designs, id) {
  if (designs.length >= MAX_SAVED_DESIGNS) {
    throw new Error(`Saved design limit reached (${MAX_SAVED_DESIGNS}). Delete one first.`);
  }
  const original = designs.find((d) => d.id === id);
  if (!original) throw new Error("Saved design not found.");

  const usedNames = new Set(designs.map((d) => d.name));
  let name = `${original.name} copy`;
  let suffix = 2;
  while (usedNames.has(name)) {
    name = `${original.name} copy ${suffix}`;
    suffix++;
  }

  const now = new Date().toISOString();
  const entry = { id: generateId(), name, design: original.design, createdAt: now, updatedAt: now };
  return { designs: [...designs, entry], entry };
}

/** Returns a new list without `id`. Idempotent: deleting an id that isn't present is a no-op, not an error (safe to call from a UI without racing state). */
export function deleteSavedDesign(designs, id) {
  return designs.filter((d) => d.id !== id);
}

/** Resolve a saved entry's stored design into a full, validated PlaygroundState, via the same graceful restoreState() used for the last-session key. */
export function loadSavedDesignState(entry, canonicalPalette) {
  return restoreState(JSON.stringify(entry.design), canonicalPalette);
}

// --- JSON file export/import --------------------------------------------

export function buildDesignFilePayload(name, state, canonicalPalette) {
  return {
    format: DESIGN_FILE_FORMAT,
    version: DESIGN_FILE_VERSION,
    name: sanitizeName(name) || "Palembang design",
    design: serializeState(state, canonicalPalette),
  };
}

/**
 * Parse and validate an imported design file's raw text. Never throws and
 * never touches any existing state — returns either `{ ok: true, name,
 * state }` (a ready-to-use PlaygroundState) or `{ ok: false, error }` with
 * a short human-readable reason, for the caller to show as-is.
 */
export function parseDesignFilePayload(rawJson, canonicalPalette) {
  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "That file doesn't contain a Palembang design." };
  }
  if (parsed.format !== DESIGN_FILE_FORMAT) {
    return { ok: false, error: "That file isn't a Palembang design file." };
  }
  if (parsed.version !== DESIGN_FILE_VERSION) {
    return { ok: false, error: `Unsupported design file version: ${JSON.stringify(parsed.version)}.` };
  }
  if (!parsed.design || typeof parsed.design !== "object") {
    return { ok: false, error: "That file's design data is missing or invalid." };
  }

  const name = typeof parsed.name === "string" && parsed.name.trim() ? sanitizeName(parsed.name) : "Imported design";
  const state = restoreState(JSON.stringify(parsed.design), canonicalPalette);
  return { ok: true, name, state };
}
