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
  restoreState,
  ratioLabel,
  normalizeHex,
  clampDimension,
  STORAGE_KEY,
} from "./playground-state.js";

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

const els = {
  preview: document.getElementById("preview"),
  previewFrame: document.getElementById("previewFrame"),
  previewCaption: document.getElementById("previewCaption"),
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
  exportSvg: document.getElementById("exportSvg"),
  exportPng: document.getElementById("exportPng"),
  exportStatus: document.getElementById("exportStatus"),
  canonicalReset: document.getElementById("canonicalReset"),
  copyAttribution: document.getElementById("copyAttribution"),
  copyStatus: document.getElementById("copyStatus"),
};

function loadPersistedState() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private browsing / disabled) — start from canonical defaults.
  }
  return restoreState(raw, canonicalPalette);
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(state, canonicalPalette)));
  } catch {
    // Storage unavailable — runtime state still works, it just won't survive a reload.
  }
}

function currentOverrides() {
  const overrides = {};
  for (const token of scenePaletteTokens()) {
    if (state.palette[token] !== canonicalPalette[token]) overrides[token] = state.palette[token];
  }
  return overrides;
}

// --- Palette editor --------------------------------------------------

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

function applyEffective() {
  const effective = computeEffectiveDimensions(state);
  state.width = effective.width;
  state.height = effective.height;
  updateFormatControlsUI();
  renderPreview();
  persistState();
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

// --- Export --------------------------------------------------------------

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
  els.exportStatus.textContent = "SVG downloaded.";
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
        els.exportStatus.textContent = "PNG export failed in this browser.";
        return;
      }
      downloadBlob(blob, `palembang-${state.width}x${state.height}.png`);
      els.exportStatus.textContent = "PNG downloaded.";
    }, "image/png");
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    els.exportStatus.textContent = "PNG export failed to rasterize the SVG.";
  };
  image.src = url;
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
  // (including preset .checked state) from this new object.
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
  state = loadPersistedState();

  buildPaletteGrid();
  buildStandardPresetRow();
  buildWallpaperSelect();
  wireModeToggle();
  wireDimensionInputs();

  els.resetPalette.addEventListener("click", resetPaletteOnly);
  els.canonicalReset.addEventListener("click", fullReset);
  els.exportSvg.addEventListener("click", exportSvgFile);
  els.exportPng.addEventListener("click", exportPngFile);
  els.copyAttribution.addEventListener("click", copyAttribution);

  applyEffective();
}

init();
