import { renderSvg, mergePalette, scenePaletteTokens, loadTokens } from "./palembang.js";

const PRESETS = [
  { id: "square", label: "Square", ratio: "1:1", width: 2560, height: 2560 },
  { id: "medium", label: "Medium", ratio: "20:13", width: 2560, height: 1664 },
  { id: "wide", label: "Wide", ratio: "64:27", width: 2560, height: 1080 },
];
const CANONICAL_PRESET_ID = "wide";

const ROLE_LABELS = {
  "sky.hot": "Sky — hot",
  "sky.cool": "Sky — cool",
  "sea.light": "Sea — light",
  "sea.dark": "Sea — dark",
  "sea.haze": "Sea — haze",
  "sea.glow": "Sea — glow",
};

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const MIN_DIMENSION = 16;
const MAX_DIMENSION = 6000;

const state = {
  tokens: null,
  canonicalPalette: null,
  palette: {},
  width: PRESETS.find((p) => p.id === CANONICAL_PRESET_ID).width,
  height: PRESETS.find((p) => p.id === CANONICAL_PRESET_ID).height,
};

const els = {
  preview: document.getElementById("preview"),
  previewFrame: document.getElementById("previewFrame"),
  previewCaption: document.getElementById("previewCaption"),
  paletteGrid: document.getElementById("paletteGrid"),
  resetPalette: document.getElementById("resetPalette"),
  presetRow: document.getElementById("presetRow"),
  widthInput: document.getElementById("widthInput"),
  heightInput: document.getElementById("heightInput"),
  exportSvg: document.getElementById("exportSvg"),
  exportPng: document.getElementById("exportPng"),
  exportStatus: document.getElementById("exportStatus"),
  canonicalReset: document.getElementById("canonicalReset"),
  copyAttribution: document.getElementById("copyAttribution"),
  copyStatus: document.getElementById("copyStatus"),
};

function normalizeHex(value) {
  const trimmed = value.trim();
  if (!HEX_RE.test(trimmed)) return null;
  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

function clampDimension(value) {
  const rounded = Math.round(value);
  if (!Number.isFinite(rounded)) return MIN_DIMENSION;
  return Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, rounded));
}

function currentGcd(a, b) {
  return b === 0 ? a : currentGcd(b, a % b);
}

function ratioLabel(width, height) {
  const g = currentGcd(Math.round(width), Math.round(height)) || 1;
  return `${Math.round(width) / g}:${Math.round(height) / g}`;
}

function matchingPreset(width, height) {
  return PRESETS.find((p) => p.width === width && p.height === height)?.id ?? null;
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
    original.textContent = `original ${state.canonicalPalette[token]}`;

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

function buildPresetRow() {
  els.presetRow.innerHTML = "";
  for (const preset of PRESETS) {
    const inputId = `preset-${preset.id}`;
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "preset";
    input.id = inputId;
    input.value = preset.id;

    const label = document.createElement("label");
    label.setAttribute("for", inputId);
    label.innerHTML = `${preset.label}<span class="ratio">${preset.ratio}</span>`;

    input.addEventListener("change", () => {
      applyDimensions(preset.width, preset.height);
    });

    els.presetRow.append(input, label);
  }
  syncPresetSelection();
}

function syncPresetSelection() {
  const matched = matchingPreset(state.width, state.height);
  for (const preset of PRESETS) {
    const input = document.getElementById(`preset-${preset.id}`);
    if (input) input.checked = preset.id === matched;
  }
}

function applyDimensions(width, height) {
  state.width = clampDimension(width);
  state.height = clampDimension(height);
  els.widthInput.value = state.width;
  els.heightInput.value = state.height;
  syncPresetSelection();
  renderPreview();
}

function renderPreview() {
  const overrides = {};
  for (const token of scenePaletteTokens()) {
    if (state.palette[token] !== state.canonicalPalette[token]) overrides[token] = state.palette[token];
  }
  const svg = renderSvg(state.tokens, state.width, state.height, { palette: overrides });
  els.preview.innerHTML = svg;
  els.previewFrame.style.aspectRatio = `${state.width} / ${state.height}`;
  els.previewCaption.textContent = `${state.width} × ${state.height} · ${ratioLabel(state.width, state.height)}`;
}

function buildExportSvg() {
  const overrides = {};
  for (const token of scenePaletteTokens()) {
    if (state.palette[token] !== state.canonicalPalette[token]) overrides[token] = state.palette[token];
  }
  return renderSvg(state.tokens, state.width, state.height, { palette: overrides, attribution: true });
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

function resetPaletteOnly() {
  state.palette = { ...state.canonicalPalette };
  syncPaletteInputs();
  renderPreview();
}

function canonicalReset() {
  state.palette = { ...state.canonicalPalette };
  syncPaletteInputs();
  const canonical = PRESETS.find((p) => p.id === CANONICAL_PRESET_ID);
  applyDimensions(canonical.width, canonical.height);
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

function wireDimensionInputs() {
  els.widthInput.addEventListener("change", () => applyDimensions(Number(els.widthInput.value), state.height));
  els.heightInput.addEventListener("change", () => applyDimensions(state.width, Number(els.heightInput.value)));
}

async function init() {
  try {
    state.tokens = await loadTokens(import.meta.url);
  } catch (error) {
    els.preview.innerHTML = "";
    els.previewCaption.textContent = "Could not load Palembang tokens. See console for details.";
    console.error(error);
    return;
  }

  state.canonicalPalette = { ...state.tokens.palette };
  state.palette = { ...state.canonicalPalette };

  buildPaletteGrid();
  buildPresetRow();
  els.widthInput.value = state.width;
  els.heightInput.value = state.height;
  wireDimensionInputs();

  els.resetPalette.addEventListener("click", resetPaletteOnly);
  els.canonicalReset.addEventListener("click", canonicalReset);
  els.exportSvg.addEventListener("click", exportSvgFile);
  els.exportPng.addEventListener("click", exportPngFile);
  els.copyAttribution.addEventListener("click", copyAttribution);

  renderPreview();
}

init();
