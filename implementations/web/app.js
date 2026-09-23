import { renderSvg, scenePaletteTokens, loadTokens } from "./palembang.js";
import {
  STANDARD_PRESETS,
  CUSTOM_PRESET_ID,
  CANONICAL_STANDARD_PRESET_ID,
  WALLPAPER_GROUPS,
  standardPresetById,
  createDefaultState,
  computeEffectiveDimensions,
  switchToCustomPreset,
  serializeState,
  ratioLabel,
  normalizeHex,
  clampDimension,
  STORAGE_KEY,
} from "./playground-state.js";
import { CURATED_PALETTES, resolveCuratedPalette } from "./palettes.js";
import { buildShareUrl, resolveBootState } from "./share.js";
import {
  SAVED_DESIGNS_STORAGE_KEY,
  restoreSavedDesigns,
  serializeSavedDesigns,
  addSavedDesign,
  renameSavedDesign,
  duplicateSavedDesign,
  deleteSavedDesign,
  loadSavedDesignState,
  buildDesignFilePayload,
  parseDesignFilePayload,
  slugifyName,
} from "./designs.js";

const ROLE_LABELS = {
  "sky.hot": "Sky — hot",
  "sky.cool": "Sky — cool",
  "sea.light": "Sea — light",
  "sea.dark": "Sea — dark",
  "sea.haze": "Sea — haze",
  "sea.glow": "Sea — glow",
};

let tokens = null;
let canonicalPalette = null;
/** @type {import("./playground-state.js").PlaygroundState} */
let state = null;
/** @type {Array<object>} */
let savedDesigns = [];
let renameTargetId = null;

const els = {
  preview: document.getElementById("preview"),
  previewFrame: document.getElementById("previewFrame"),
  previewCaption: document.getElementById("previewCaption"),
  shareNotice: document.getElementById("shareNotice"),
  paletteGallery: document.getElementById("paletteGallery"),
  paletteGrid: document.getElementById("paletteGrid"),
  resetPalette: document.getElementById("resetPalette"),
  presetRow: document.getElementById("presetRow"),
  modeStandard: document.getElementById("mode-standard"),
  modeWallpaper: document.getElementById("mode-wallpaper"),
  standardControls: document.getElementById("standardControls"),
  wallpaperControls: document.getElementById("wallpaperControls"),
  wallpaperSelect: document.getElementById("wallpaperSelect"),
  widthInput: document.getElementById("widthInput"),
  heightInput: document.getElementById("heightInput"),
  heightLockNote: document.getElementById("heightLockNote"),
  formatHint: document.getElementById("formatHint"),
  saveDesign: document.getElementById("saveDesign"),
  savedDesignsList: document.getElementById("savedDesignsList"),
  savedDesignsEmpty: document.getElementById("savedDesignsEmpty"),
  savedDesignsStatus: document.getElementById("savedDesignsStatus"),
  renameDialog: document.getElementById("renameDialog"),
  renameForm: document.getElementById("renameForm"),
  renameInput: document.getElementById("renameInput"),
  renameCancel: document.getElementById("renameCancel"),
  copyShareLink: document.getElementById("copyShareLink"),
  shareLinkField: document.getElementById("shareLinkField"),
  shareStatus: document.getElementById("shareStatus"),
  exportSvg: document.getElementById("exportSvg"),
  exportPng: document.getElementById("exportPng"),
  exportDesignJson: document.getElementById("exportDesignJson"),
  importDesignJsonTrigger: document.getElementById("importDesignJsonTrigger"),
  importDesignJsonInput: document.getElementById("importDesignJsonInput"),
  exportStatus: document.getElementById("exportStatus"),
  canonicalReset: document.getElementById("canonicalReset"),
  copyAttribution: document.getElementById("copyAttribution"),
  copyStatus: document.getElementById("copyStatus"),
};

// --- Persistence: last session ("palembang-playground:v1") -------------

function readLastSessionRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private browsing / disabled) — resolveBootState()
    // falls back to canonical defaults when this is null.
    return null;
  }
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(state, canonicalPalette)));
  } catch {
    // Storage unavailable — runtime state still works, it just won't survive a reload.
  }
}

// --- Persistence: saved designs ("palembang-saved:v1") -----------------

function loadPersistedSavedDesigns() {
  let raw = null;
  try {
    raw = localStorage.getItem(SAVED_DESIGNS_STORAGE_KEY);
  } catch {
    // Storage unavailable — the saved-designs list is just empty for this session.
  }
  return restoreSavedDesigns(raw);
}

function persistSavedDesigns() {
  try {
    localStorage.setItem(SAVED_DESIGNS_STORAGE_KEY, JSON.stringify(serializeSavedDesigns(savedDesigns)));
  } catch {
    // Storage unavailable — saved designs still work for this session, they just won't survive a reload.
  }
}

function currentOverrides() {
  const overrides = {};
  for (const token of scenePaletteTokens()) {
    if (state.palette[token] !== canonicalPalette[token]) overrides[token] = state.palette[token];
  }
  return overrides;
}

function statusMessage(el, text, timeoutMs = 3000) {
  el.textContent = text;
  if (timeoutMs > 0) {
    setTimeout(() => {
      if (el.textContent === text) el.textContent = "";
    }, timeoutMs);
  }
}

// --- Palette: curated gallery + six-token editor ------------------------

function buildPaletteGallery() {
  els.paletteGallery.innerHTML = "";
  for (const preset of CURATED_PALETTES) {
    const colors = resolveCuratedPalette(preset.id, canonicalPalette);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "palette-swatch";
    button.setAttribute("aria-label", `Apply ${preset.name} palette`);
    button.title = preset.name;
    const stops = scenePaletteTokens()
      .map((token) => colors[token])
      .join(", ");
    button.style.background = `linear-gradient(135deg, ${stops})`;

    const label = document.createElement("span");
    label.className = "palette-swatch-label";
    label.textContent = preset.name;
    button.append(label);

    button.addEventListener("click", () => {
      state.palette = resolveCuratedPalette(preset.id, canonicalPalette);
      syncPaletteInputs();
      renderPreview();
      persistState();
    });

    els.paletteGallery.append(button);
  }
}

function buildPaletteGrid() {
  els.paletteGrid.innerHTML = "";
  for (const token of scenePaletteTokens()) {
    const row = document.createElement("div");
    row.className = "palette-row";

    const id = `palette-${token.replace(".", "-")}`;
    const label = document.createElement("label");
    label.className = "palette-row-label";
    label.setAttribute("for", id);
    label.textContent = ROLE_LABELS[token] ?? token;

    const controls = document.createElement("div");
    controls.className = "palette-row-controls";

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.id = id;
    colorInput.value = state.palette[token];
    colorInput.setAttribute("aria-label", `${ROLE_LABELS[token] ?? token} color picker`);

    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.value = state.palette[token];
    hexInput.maxLength = 7;
    hexInput.setAttribute("aria-label", `${ROLE_LABELS[token] ?? token} hex value`);

    const applyColor = (hex) => {
      state.palette[token] = hex;
      colorInput.value = hex;
      hexInput.value = hex;
      renderPreview();
      persistState();
    };

    colorInput.addEventListener("input", () => applyColor(colorInput.value));
    hexInput.addEventListener("change", () => {
      const normalized = normalizeHex(hexInput.value);
      if (normalized) {
        applyColor(normalized);
      } else {
        hexInput.value = state.palette[token];
      }
    });

    const original = document.createElement("p");
    original.className = "palette-row-original";
    original.textContent = `original ${canonicalPalette[token]}`;

    controls.append(colorInput, hexInput);
    row.append(label, controls, original);
    els.paletteGrid.append(row);
  }
}

function syncPaletteInputs() {
  for (const token of scenePaletteTokens()) {
    const id = `palette-${token.replace(".", "-")}`;
    const colorInput = document.getElementById(id);
    const hexInput = colorInput?.nextElementSibling;
    if (colorInput) colorInput.value = state.palette[token];
    if (hexInput) hexInput.value = state.palette[token];
  }
}

// --- Format: mode toggle + standard presets + wallpaper presets ------

function appendPresetChip(container, name, inputId, value, checked, onChange, [title, resolution, ratio]) {
  const input = document.createElement("input");
  input.type = "radio";
  input.name = name;
  input.id = inputId;
  input.value = value;
  input.checked = checked;
  input.addEventListener("change", onChange);

  const label = document.createElement("label");
  label.setAttribute("for", inputId);
  label.innerHTML =
    `<span class="preset-name">${title}</span>` +
    `<span class="preset-res">${resolution}</span>` +
    `<span class="preset-ratio">${ratio}</span>`;

  container.append(input, label);
}

function buildStandardPresetRow() {
  els.presetRow.innerHTML = "";
  for (const preset of STANDARD_PRESETS) {
    appendPresetChip(
      els.presetRow,
      "standardPreset",
      `preset-${preset.id}`,
      preset.id,
      state.standardPresetId === preset.id,
      () => {
        state.standardPresetId = preset.id;
        state.standardWidth = preset.width;
        applyEffective();
      },
      [preset.label, `${preset.width} × ${preset.height}`, preset.ratio]
    );
  }
  appendPresetChip(
    els.presetRow,
    "standardPreset",
    "preset-custom",
    CUSTOM_PRESET_ID,
    state.standardPresetId === CUSTOM_PRESET_ID,
    () => {
      state = switchToCustomPreset(state);
      applyEffective();
    },
    ["Custom", "Any size", "your ratio"]
  );
}

function syncStandardPresetSelection() {
  for (const id of [...STANDARD_PRESETS.map((p) => p.id), CUSTOM_PRESET_ID]) {
    const input = document.getElementById(`preset-${id}`);
    if (input) input.checked = id === state.standardPresetId;
  }
}

function buildWallpaperSelect() {
  els.wallpaperSelect.innerHTML = "";
  for (const group of WALLPAPER_GROUPS) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;
    for (const preset of group.presets) {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = `${preset.label} — ${preset.width} × ${preset.height}`;
      optgroup.append(option);
    }
    els.wallpaperSelect.append(optgroup);
  }
  els.wallpaperSelect.addEventListener("change", () => {
    state.wallpaperPresetId = els.wallpaperSelect.value;
    applyEffective();
  });
}

function updateFormatControlsUI() {
  const isWallpaper = state.mode === "wallpaper";
  els.modeStandard.checked = !isWallpaper;
  els.modeWallpaper.checked = isWallpaper;
  els.standardControls.hidden = isWallpaper;
  els.wallpaperControls.hidden = !isWallpaper;

  syncStandardPresetSelection();
  els.wallpaperSelect.value = state.wallpaperPresetId;

  const isCustom = state.standardPresetId === CUSTOM_PRESET_ID;
  els.widthInput.value = isCustom ? state.customWidth : state.standardWidth;
  els.heightInput.value = state.height;
  els.heightInput.readOnly = !isCustom;
  els.heightInput.setAttribute("aria-readonly", String(!isCustom));
  els.heightLockNote.hidden = isCustom;
  els.heightInput.classList.toggle("is-locked", !isCustom);

  if (isCustom) {
    els.formatHint.textContent = "Width and height are independent here — nothing is cropped or stretched.";
  } else {
    const preset = standardPresetById(state.standardPresetId) ?? standardPresetById(CANONICAL_STANDARD_PRESET_ID);
    els.formatHint.textContent = `Height follows the ${preset.label} ratio (${preset.ratio}) automatically as you change width. Choose Custom to set both directly.`;
  }
}

/**
 * Recompute effective dimensions, re-render, and persist. `skipPersist` is
 * used exactly once, for the very first render after loading a shared
 * design: the loaded design itself must not overwrite the user's previous
 * session until they actually change or save something (see "Sharing" in
 * README.md). Every other call site is already the direct result of a user
 * action, so it persists normally.
 */
function applyEffective({ skipPersist = false } = {}) {
  const effective = computeEffectiveDimensions(state);
  state.width = effective.width;
  state.height = effective.height;
  updateFormatControlsUI();
  renderPreview();
  if (!skipPersist) persistState();
}

function wireModeToggle() {
  els.modeStandard.addEventListener("change", () => {
    if (els.modeStandard.checked) {
      state.mode = "standard";
      applyEffective();
    }
  });
  els.modeWallpaper.addEventListener("change", () => {
    if (els.modeWallpaper.checked) {
      state.mode = "wallpaper";
      applyEffective();
    }
  });
}

function wireDimensionInputs() {
  els.widthInput.addEventListener("change", () => {
    const value = clampDimension(Number(els.widthInput.value));
    if (state.standardPresetId === CUSTOM_PRESET_ID) {
      state.customWidth = value;
    } else {
      state.standardWidth = value;
    }
    applyEffective();
  });
  els.heightInput.addEventListener("change", () => {
    if (state.standardPresetId !== CUSTOM_PRESET_ID) {
      // Read-only in every non-Custom standard preset; re-assert the derived value.
      updateFormatControlsUI();
      return;
    }
    state.customHeight = clampDimension(Number(els.heightInput.value));
    applyEffective();
  });
}

// --- Preview -----------------------------------------------------------

function renderPreview() {
  const svg = renderSvg(tokens, state.width, state.height, { palette: currentOverrides() });
  els.preview.innerHTML = svg;
  els.previewFrame.style.aspectRatio = `${state.width} / ${state.height}`;
  els.previewCaption.textContent = `${state.width} × ${state.height} · ${ratioLabel(state.width, state.height)}`;
}

// --- Share ---------------------------------------------------------------

function currentBaseUrl() {
  return `${location.origin}${location.pathname}`;
}

async function copyTextToField(text, fieldEl, statusEl) {
  fieldEl.value = text;
  fieldEl.focus();
  fieldEl.select();
  try {
    await navigator.clipboard.writeText(text);
    statusMessage(statusEl, "Share link copied.");
  } catch {
    statusMessage(statusEl, "Couldn't access the clipboard — the link is selected above, copy it manually.", 6000);
  }
}

function copyShareLink() {
  const url = buildShareUrl(currentBaseUrl(), state, canonicalPalette);
  copyTextToField(url, els.shareLinkField, els.shareStatus);
}

// --- Saved designs -------------------------------------------------------

function renderSavedDesignsList() {
  els.savedDesignsList.innerHTML = "";
  els.savedDesignsEmpty.hidden = savedDesigns.length > 0;

  for (const entry of savedDesigns) {
    const li = document.createElement("li");
    li.className = "saved-design-row";
    li.dataset.id = entry.id;

    const info = document.createElement("div");
    info.className = "saved-design-info";
    const name = document.createElement("span");
    name.className = "saved-design-name";
    name.textContent = entry.name;
    const meta = document.createElement("span");
    meta.className = "saved-design-meta";
    const w = entry.design?.effectiveWidth;
    const h = entry.design?.effectiveHeight;
    meta.textContent = w && h ? `${w} × ${h}` : "";
    info.append(name, meta);

    const actions = document.createElement("div");
    actions.className = "saved-design-actions";
    for (const [action, label] of [
      ["open", "Open"],
      ["rename", "Rename"],
      ["duplicate", "Duplicate"],
      ["share", "Share"],
      ["delete", "Delete"],
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.action = action;
      button.textContent = label;
      button.className = action === "delete" ? "saved-design-action danger" : "saved-design-action";
      actions.append(button);
    }

    li.append(info, actions);
    els.savedDesignsList.append(li);
  }
}

function saveCurrentDesign() {
  try {
    const result = addSavedDesign(savedDesigns, "", state, canonicalPalette);
    savedDesigns = result.designs;
    persistSavedDesigns();
    renderSavedDesignsList();
    statusMessage(els.savedDesignsStatus, `Saved as "${result.entry.name}".`);
  } catch (error) {
    statusMessage(els.savedDesignsStatus, error.message, 5000);
  }
}

function openSavedDesign(id) {
  const entry = savedDesigns.find((d) => d.id === id);
  if (!entry) return;
  state = loadSavedDesignState(entry, canonicalPalette);
  syncPaletteInputs();
  applyEffective();
  statusMessage(els.savedDesignsStatus, `Opened "${entry.name}".`);
}

function duplicateDesignRow(id) {
  try {
    const result = duplicateSavedDesign(savedDesigns, id);
    savedDesigns = result.designs;
    persistSavedDesigns();
    renderSavedDesignsList();
    statusMessage(els.savedDesignsStatus, `Duplicated as "${result.entry.name}".`);
  } catch (error) {
    statusMessage(els.savedDesignsStatus, error.message, 5000);
  }
}

function deleteDesignRow(id) {
  const entry = savedDesigns.find((d) => d.id === id);
  if (!entry) return;
  if (!confirm(`Delete "${entry.name}"? This can't be undone.`)) return;
  savedDesigns = deleteSavedDesign(savedDesigns, id);
  persistSavedDesigns();
  renderSavedDesignsList();
  statusMessage(els.savedDesignsStatus, `Deleted "${entry.name}".`);
}

function shareDesignRow(id) {
  const entry = savedDesigns.find((d) => d.id === id);
  if (!entry) return;
  const designState = loadSavedDesignState(entry, canonicalPalette);
  const url = buildShareUrl(currentBaseUrl(), designState, canonicalPalette);
  copyTextToField(url, els.shareLinkField, els.savedDesignsStatus);
}

function openRenameDialog(id) {
  const entry = savedDesigns.find((d) => d.id === id);
  if (!entry) return;
  renameTargetId = id;
  els.renameInput.value = entry.name;
  els.renameDialog.showModal();
  els.renameInput.focus();
  els.renameInput.select();
}

function wireSavedDesignsList() {
  els.savedDesignsList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = button.closest("li[data-id]")?.dataset.id;
    if (!id) return;
    switch (button.dataset.action) {
      case "open":
        openSavedDesign(id);
        break;
      case "rename":
        openRenameDialog(id);
        break;
      case "duplicate":
        duplicateDesignRow(id);
        break;
      case "delete":
        deleteDesignRow(id);
        break;
      case "share":
        shareDesignRow(id);
        break;
    }
  });
}

function wireRenameDialog() {
  els.renameCancel.addEventListener("click", () => els.renameDialog.close());
  els.renameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!renameTargetId) {
      els.renameDialog.close();
      return;
    }
    try {
      savedDesigns = renameSavedDesign(savedDesigns, renameTargetId, els.renameInput.value);
      persistSavedDesigns();
      renderSavedDesignsList();
      statusMessage(els.savedDesignsStatus, "Renamed.");
    } catch (error) {
      statusMessage(els.savedDesignsStatus, error.message, 5000);
    }
    renameTargetId = null;
    els.renameDialog.close();
  });
}

// --- Export / import -----------------------------------------------------

function buildExportSvg() {
  return renderSvg(tokens, state.width, state.height, { palette: currentOverrides(), attribution: true });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportSvgFile() {
  const svg = buildExportSvg();
  downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `palembang-${state.width}x${state.height}.svg`);
  statusMessage(els.exportStatus, "SVG downloaded.");
}

function exportPngFile() {
  const svg = buildExportSvg();
  const svgBlob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = state.width;
    canvas.height = state.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, state.width, state.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (!blob) {
        statusMessage(els.exportStatus, "PNG export failed in this browser.");
        return;
      }
      downloadBlob(blob, `palembang-${state.width}x${state.height}.png`);
      statusMessage(els.exportStatus, "PNG downloaded.");
    }, "image/png");
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    statusMessage(els.exportStatus, "PNG export failed to rasterize the SVG.");
  };
  image.src = url;
}

function exportDesignJsonFile() {
  const payload = buildDesignFilePayload("Palembang design", state, canonicalPalette);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  downloadBlob(blob, `${slugifyName(payload.name)}.palembang.json`);
  statusMessage(els.exportStatus, "Design JSON exported.");
}

function wireImportDesignJson() {
  els.importDesignJsonTrigger.addEventListener("click", () => els.importDesignJsonInput.click());
  els.importDesignJsonInput.addEventListener("change", async () => {
    const file = els.importDesignJsonInput.files?.[0];
    els.importDesignJsonInput.value = "";
    if (!file) return;

    let text;
    try {
      text = await file.text();
    } catch {
      statusMessage(els.exportStatus, "Could not read that file.", 5000);
      return;
    }

    const result = parseDesignFilePayload(text, canonicalPalette);
    if (!result.ok) {
      statusMessage(els.exportStatus, result.error, 5000);
      return;
    }

    state = result.state;
    syncPaletteInputs();
    applyEffective();
    statusMessage(els.exportStatus, `Imported "${result.name}".`);
  });
}

// --- Reset actions ---------------------------------------------------

function resetPaletteOnly() {
  state.palette = { ...canonicalPalette };
  syncPaletteInputs();
  renderPreview();
  persistState();
}

function fullReset() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable — nothing to clear.
  }
  // A brand-new state object works with the already-bound listeners below:
  // they close over the `state` binding itself, not a snapshot, and
  // applyEffective() -> updateFormatControlsUI() re-syncs every control
  // (including preset .checked state) from this new object. Saved designs
  // (a separate storage key) are deliberately untouched.
  state = createDefaultState(canonicalPalette);
  syncPaletteInputs();
  applyEffective();
}

async function copyAttribution() {
  const text = document.getElementById("attributionText").textContent;
  try {
    await navigator.clipboard.writeText(text);
    els.copyStatus.textContent = "Copied.";
  } catch {
    els.copyStatus.textContent = "Copy failed — select the text manually.";
  }
  setTimeout(() => {
    els.copyStatus.textContent = "";
  }, 2500);
}

// --- Boot ----------------------------------------------------------------

async function init() {
  try {
    tokens = await loadTokens(import.meta.url);
  } catch (error) {
    els.preview.innerHTML = "";
    els.previewCaption.textContent = "Could not load Palembang tokens. See console for details.";
    console.error(error);
    return;
  }

  canonicalPalette = { ...tokens.palette };

  // URL-state precedence (resolveBootState, share.js): a valid shared link
  // wins over the last local session, which wins over canonical defaults.
  // Loading a shared design does not touch localStorage until the user
  // actually changes or saves something — see applyEffective()'s
  // skipPersist below and README.md "Sharing".
  const boot = resolveBootState(canonicalPalette, { hash: location.hash, lastSessionRaw: readLastSessionRaw() });
  state = boot.state;
  els.shareNotice.hidden = !boot.loadedFromShare;

  savedDesigns = loadPersistedSavedDesigns();

  buildPaletteGallery();
  buildPaletteGrid();
  buildStandardPresetRow();
  buildWallpaperSelect();
  renderSavedDesignsList();
  wireModeToggle();
  wireDimensionInputs();
  wireSavedDesignsList();
  wireRenameDialog();
  wireImportDesignJson();

  els.resetPalette.addEventListener("click", resetPaletteOnly);
  els.canonicalReset.addEventListener("click", fullReset);
  els.saveDesign.addEventListener("click", saveCurrentDesign);
  els.copyShareLink.addEventListener("click", copyShareLink);
  els.exportSvg.addEventListener("click", exportSvgFile);
  els.exportPng.addEventListener("click", exportPngFile);
  els.exportDesignJson.addEventListener("click", exportDesignJsonFile);
  els.copyAttribution.addEventListener("click", copyAttribution);

  applyEffective({ skipPersist: boot.loadedFromShare });
}

init();
