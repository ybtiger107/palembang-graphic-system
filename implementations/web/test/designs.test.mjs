// Tests for saved-designs CRUD (localStorage-shaped, but pure — the actual
// localStorage.getItem/setItem calls live in app.js, not here) and the
// design-file JSON export/import envelope (designs.js).
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  SAVED_DESIGNS_STORAGE_KEY,
  MAX_SAVED_DESIGNS,
  restoreSavedDesigns,
  serializeSavedDesigns,
  addSavedDesign,
  renameSavedDesign,
  duplicateSavedDesign,
  deleteSavedDesign,
  loadSavedDesignState,
  nextDefaultName,
  slugifyName,
  buildDesignFilePayload,
  parseDesignFilePayload,
  DESIGN_FILE_FORMAT,
  DESIGN_FILE_VERSION,
} from "../designs.js";
import { createDefaultState, computeEffectiveDimensions, CUSTOM_PRESET_ID } from "../playground-state.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = path.resolve(HERE, "../../../tokens/palembang.v1.json");

let canonicalPalette;
before(() => {
  const tokens = JSON.parse(readFileSync(TOKENS_PATH, "utf8"));
  canonicalPalette = { ...tokens.palette };
});

describe("save", () => {
  test("addSavedDesign creates an entry with a default name, id, and timestamps", () => {
    const state = createDefaultState(canonicalPalette);
    const { designs, entry } = addSavedDesign([], "", state, canonicalPalette);
    assert.equal(designs.length, 1);
    assert.equal(entry.name, "Palembang 1");
    assert.equal(typeof entry.id, "string");
    assert.ok(entry.id.length > 0);
    assert.equal(entry.createdAt, entry.updatedAt);
    assert.equal(entry.design.mode, "standard");
  });

  test("an explicit name is used verbatim (trimmed)", () => {
    const state = createDefaultState(canonicalPalette);
    const { entry } = addSavedDesign([], "  Blue Night  ", state, canonicalPalette);
    assert.equal(entry.name, "Blue Night");
  });

  test("default names avoid collisions with existing ones", () => {
    const state = createDefaultState(canonicalPalette);
    let designs = [];
    designs = addSavedDesign(designs, "", state, canonicalPalette).designs;
    designs = addSavedDesign(designs, "", state, canonicalPalette).designs;
    assert.deepEqual(
      designs.map((d) => d.name),
      ["Palembang 1", "Palembang 2"]
    );
  });

  test("addSavedDesign throws once MAX_SAVED_DESIGNS is reached, and does not exceed it", () => {
    const state = createDefaultState(canonicalPalette);
    let designs = [];
    for (let i = 0; i < MAX_SAVED_DESIGNS; i++) {
      designs = addSavedDesign(designs, "", state, canonicalPalette).designs;
    }
    assert.equal(designs.length, MAX_SAVED_DESIGNS);
    assert.throws(() => addSavedDesign(designs, "", state, canonicalPalette));
    assert.equal(designs.length, MAX_SAVED_DESIGNS); // the failed attempt didn't mutate the list
  });
});

describe("load", () => {
  test("loadSavedDesignState reconstructs the exact saved design", () => {
    const state = createDefaultState(canonicalPalette);
    state.standardPresetId = CUSTOM_PRESET_ID;
    state.customWidth = 1500;
    state.customHeight = 500;
    state.palette["sea.glow"] = "#00ffaa";

    const { entry } = addSavedDesign([], "Test", state, canonicalPalette);
    const loaded = loadSavedDesignState(entry, canonicalPalette);
    assert.deepEqual(computeEffectiveDimensions(loaded), { width: 1500, height: 500 });
    assert.equal(loaded.palette["sea.glow"], "#00ffaa");
  });
});

describe("rename", () => {
  test("renames the matching entry and bumps updatedAt", async () => {
    const state = createDefaultState(canonicalPalette);
    let designs = addSavedDesign([], "Original name", state, canonicalPalette).designs;
    const id = designs[0].id;
    const before = designs[0].updatedAt;
    await new Promise((resolve) => setTimeout(resolve, 2));
    designs = renameSavedDesign(designs, id, "New name");
    assert.equal(designs[0].name, "New name");
    assert.notEqual(designs[0].updatedAt, before);
  });

  test("rejects an empty name", () => {
    const state = createDefaultState(canonicalPalette);
    const designs = addSavedDesign([], "x", state, canonicalPalette).designs;
    assert.throws(() => renameSavedDesign(designs, designs[0].id, "   "));
  });

  test("throws for an unknown id and does not mutate the list", () => {
    const state = createDefaultState(canonicalPalette);
    const designs = addSavedDesign([], "x", state, canonicalPalette).designs;
    assert.throws(() => renameSavedDesign(designs, "not-an-id", "New"));
    assert.equal(designs[0].name, "x");
  });
});

describe("duplicate", () => {
  test("creates a copy with a new id, the same design, and a disambiguated name", () => {
    const state = createDefaultState(canonicalPalette);
    let designs = addSavedDesign([], "Blue Night", state, canonicalPalette).designs;
    const original = designs[0];
    const result = duplicateSavedDesign(designs, original.id);
    designs = result.designs;
    assert.equal(designs.length, 2);
    assert.notEqual(result.entry.id, original.id);
    assert.equal(result.entry.name, "Blue Night copy");
    assert.deepEqual(result.entry.design, original.design);
  });

  test("duplicating twice avoids a name collision", () => {
    const state = createDefaultState(canonicalPalette);
    let designs = addSavedDesign([], "X", state, canonicalPalette).designs;
    designs = duplicateSavedDesign(designs, designs[0].id).designs;
    designs = duplicateSavedDesign(designs, designs[0].id).designs;
    const names = designs.map((d) => d.name);
    assert.equal(new Set(names).size, names.length);
  });

  test("throws for an unknown id", () => {
    assert.throws(() => duplicateSavedDesign([], "nope"));
  });
});

describe("delete", () => {
  test("removes the matching entry, leaves the rest untouched", () => {
    const state = createDefaultState(canonicalPalette);
    let designs = addSavedDesign([], "A", state, canonicalPalette).designs;
    designs = addSavedDesign(designs, "B", state, canonicalPalette).designs;
    const idToDelete = designs[0].id;
    designs = deleteSavedDesign(designs, idToDelete);
    assert.equal(designs.length, 1);
    assert.equal(designs[0].name, "B");
  });

  test("is idempotent — deleting an unknown id is a no-op, not an error", () => {
    const state = createDefaultState(canonicalPalette);
    const designs = addSavedDesign([], "A", state, canonicalPalette).designs;
    const result = deleteSavedDesign(designs, "not-an-id");
    assert.equal(result.length, 1);
  });
});

describe("corrupted individual entry isolation", () => {
  test("one malformed entry is dropped; sibling valid entries survive", () => {
    const state = createDefaultState(canonicalPalette);
    const good1 = addSavedDesign([], "Good 1", state, canonicalPalette).entry;
    const good2 = addSavedDesign([], "Good 2", state, canonicalPalette).entry;
    const raw = JSON.stringify({
      version: 1,
      designs: [good1, { id: "broken", name: "", design: {} }, { not: "even close" }, good2, { id: 123, name: "x", design: {} }],
    });
    const restored = restoreSavedDesigns(raw);
    assert.deepEqual(
      restored.map((d) => d.name),
      ["Good 1", "Good 2"]
    );
  });

  test("missing/unparseable/non-container JSON returns an empty list, not a throw", () => {
    assert.deepEqual(restoreSavedDesigns(""), []);
    assert.deepEqual(restoreSavedDesigns(null), []);
    assert.deepEqual(restoreSavedDesigns("{not json"), []);
    assert.deepEqual(restoreSavedDesigns("42"), []);
    assert.deepEqual(restoreSavedDesigns(JSON.stringify({ version: 1 })), []); // no `designs` array
  });

  test("restoreSavedDesigns caps at MAX_SAVED_DESIGNS even if the stored file has more", () => {
    const state = createDefaultState(canonicalPalette);
    const entries = [];
    for (let i = 0; i < MAX_SAVED_DESIGNS + 10; i++) {
      entries.push(addSavedDesign([], `D${i}`, state, canonicalPalette).entry);
    }
    const restored = restoreSavedDesigns(JSON.stringify({ version: 1, designs: entries }));
    assert.equal(restored.length, MAX_SAVED_DESIGNS);
  });
});

describe("serialization round trip", () => {
  test("serializeSavedDesigns -> JSON -> restoreSavedDesigns reproduces the list", () => {
    const state = createDefaultState(canonicalPalette);
    let designs = addSavedDesign([], "A", state, canonicalPalette).designs;
    designs = addSavedDesign(designs, "B", state, canonicalPalette).designs;
    const raw = JSON.stringify(serializeSavedDesigns(designs));
    const restored = restoreSavedDesigns(raw);
    assert.deepEqual(restored, designs);
  });

  test("SAVED_DESIGNS_STORAGE_KEY is namespaced and distinct from the last-session key", () => {
    assert.match(SAVED_DESIGNS_STORAGE_KEY, /^palembang-saved:v\d+$/);
  });
});

describe("existing local session state preserved", () => {
  test("saved-designs functions never read or write the last-session storage key/shape", () => {
    const source = readFileSync(path.join(HERE, "../designs.js"), "utf8");
    assert.doesNotMatch(source, /palembang-playground/);
  });
});

describe("JSON export/import", () => {
  test("export -> import round trip reproduces the design", () => {
    const state = createDefaultState(canonicalPalette);
    state.mode = "wallpaper";
    state.wallpaperPresetId = "ipad-2048x2732";
    state.palette["sky.hot"] = "#123456";

    const payload = buildDesignFilePayload("My Design", state, canonicalPalette);
    assert.equal(payload.format, DESIGN_FILE_FORMAT);
    assert.equal(payload.version, DESIGN_FILE_VERSION);

    const result = parseDesignFilePayload(JSON.stringify(payload), canonicalPalette);
    assert.equal(result.ok, true);
    assert.equal(result.name, "My Design");
    assert.deepEqual(computeEffectiveDimensions(result.state), { width: 2048, height: 2732 });
    assert.equal(result.state.palette["sky.hot"], "#123456");
  });

  test("malformed JSON is rejected with a useful error, ok: false", () => {
    const result = parseDesignFilePayload("{not valid json", canonicalPalette);
    assert.equal(result.ok, false);
    assert.equal(typeof result.error, "string");
    assert.ok(result.error.length > 0);
  });

  test("an unsupported format string is rejected", () => {
    const result = parseDesignFilePayload(JSON.stringify({ format: "something-else", version: 1, design: {} }), canonicalPalette);
    assert.equal(result.ok, false);
  });

  test("an unsupported version is rejected", () => {
    const state = createDefaultState(canonicalPalette);
    const payload = buildDesignFilePayload("X", state, canonicalPalette);
    payload.version = 999;
    const result = parseDesignFilePayload(JSON.stringify(payload), canonicalPalette);
    assert.equal(result.ok, false);
    assert.match(result.error, /version/i);
  });

  test("a missing/invalid design field is rejected", () => {
    const result = parseDesignFilePayload(
      JSON.stringify({ format: DESIGN_FILE_FORMAT, version: DESIGN_FILE_VERSION, name: "X" }),
      canonicalPalette
    );
    assert.equal(result.ok, false);
  });

  test("no current-state mutation on failed import: caller-side state stays untouched", () => {
    // parseDesignFilePayload doesn't take or mutate app state at all (it's
    // pure and only returns a new state on ok:true) — this test documents
    // that contract directly against the function signature/behavior.
    const before = createDefaultState(canonicalPalette);
    const snapshot = JSON.stringify(before);
    parseDesignFilePayload("garbage", canonicalPalette);
    parseDesignFilePayload(JSON.stringify({ format: "x" }), canonicalPalette);
    assert.equal(JSON.stringify(before), snapshot);
  });

  test("a design file with no name falls back to a sensible default", () => {
    const state = createDefaultState(canonicalPalette);
    const payload = buildDesignFilePayload("", state, canonicalPalette);
    assert.equal(payload.name, "Palembang design");
  });
});

describe("small helpers", () => {
  test("slugifyName produces filesystem-friendly, never-empty slugs", () => {
    assert.equal(slugifyName("Blue Night!"), "blue-night");
    assert.equal(slugifyName("   "), "palembang-design");
    assert.equal(slugifyName(""), "palembang-design");
  });

  test("nextDefaultName finds the first unused 'Palembang N'", () => {
    assert.equal(nextDefaultName([]), "Palembang 1");
    assert.equal(nextDefaultName([{ name: "Palembang 1" }]), "Palembang 2");
    // Only "Palembang 2" exists (e.g. "Palembang 1" was renamed/deleted); the
    // count-based starting point (length+1 = 2) collides, so it advances
    // past the collision rather than reusing the name.
    assert.equal(nextDefaultName([{ name: "Palembang 2" }]), "Palembang 3");
  });
});
