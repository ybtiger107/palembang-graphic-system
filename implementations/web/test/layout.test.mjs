// Deterministic structural checks for the responsive-layout fix. No browser
// or CSS engine is available in this environment, so these assert directly
// against the CSS/JS source text for the specific patterns that caused the
// reported bugs (grid tracks that can't shrink below content size, and the
// preview frame's aspect ratio being set on the wrong element). They are not
// a substitute for visually inspecting the page in a real browser.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(path.join(HERE, "../styles.css"), "utf8");
const APP_JS = readFileSync(path.join(HERE, "../app.js"), "utf8");

/** Extract the declaration block for the first rule whose selector text matches `selectorRe`. */
function ruleBody(css, selectorRe) {
  const match = selectorRe.exec(css);
  if (!match) throw new Error(`no rule matched ${selectorRe}`);
  const openBrace = css.indexOf("{", match.index);
  let depth = 0;
  for (let i = openBrace; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}") {
      depth--;
      if (depth === 0) return css.slice(openBrace + 1, i);
    }
  }
  throw new Error("unterminated rule");
}

describe("no fixed-width overflow traps in shrinkable containers", () => {
  test("no bare `repeat(N, 1fr)` grid track (auto min-size blocks shrinking below content)", () => {
    assert.doesNotMatch(CSS, /repeat\(\s*\d+\s*,\s*1fr\s*\)/);
  });

  test(".palette-grid tracks use minmax(0, 1fr)", () => {
    const body = ruleBody(CSS, /\.palette-grid\s*\{/);
    assert.match(body, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  });

  test(".palette-grid collapses to one column at narrow widths", () => {
    assert.match(CSS, /@media \(max-width: 640px\)\s*\{\s*\.palette-grid\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });

  test(".palette-row is min-width: 0 (grid items default to min-width: auto)", () => {
    const body = ruleBody(CSS, /\.palette-row\s*\{/);
    assert.match(body, /min-width:\s*0/);
  });

  test(".dimension-row input and label can shrink below their intrinsic content width", () => {
    const inputBody = ruleBody(CSS, /\.dimension-row input\s*\{/);
    assert.match(inputBody, /width:\s*100%/);
    assert.match(inputBody, /min-width:\s*0/);
    const labelBody = ruleBody(CSS, /\.dimension-row label\s*\{/);
    assert.match(labelBody, /min-width:\s*0/);
  });

  test(".layout's single mobile track can shrink to the viewport", () => {
    const body = ruleBody(CSS, /\.layout\s*\{/);
    assert.match(body, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });

  test("preview-pane and controls-pane grid items are min-width: 0", () => {
    const body = ruleBody(CSS, /\.preview-pane,\s*\n?\s*\.controls-pane\s*\{/);
    assert.match(body, /min-width:\s*0/);
  });

  test("overflow-x: hidden was not used as a workaround", () => {
    assert.doesNotMatch(CSS, /overflow-x\s*:\s*hidden/);
  });
});

describe("new Format-mode controls don't reintroduce overflow", () => {
  test(".mode-toggle wraps instead of forcing width beyond its container", () => {
    const body = ruleBody(CSS, /\.mode-toggle\s*\{/);
    assert.match(body, /flex-wrap:\s*wrap/);
    assert.match(body, /max-width:\s*100%/);
  });

  test("#wallpaperSelect can shrink to its container", () => {
    const body = ruleBody(CSS, /#wallpaperSelect\s*\{/);
    assert.match(body, /width:\s*100%/);
    assert.match(body, /min-width:\s*0/);
  });

  test(".preset-row still wraps (now holds 4 multi-line chips, not 3 single-line ones)", () => {
    const body = ruleBody(CSS, /\.preset-row\s*\{/);
    assert.match(body, /flex-wrap:\s*wrap/);
  });
});

describe("preview frame tracks the selected aspect ratio (no letterboxing)", () => {
  test(".preview-svg has no hard-coded aspect-ratio of its own", () => {
    const body = ruleBody(CSS, /\.preview-svg\s*\{/);
    assert.doesNotMatch(body, /aspect-ratio/);
    assert.match(body, /width:\s*100%/);
    assert.match(body, /height:\s*100%/);
  });

  test(".preview-svg svg fills its frame at 100%/100%", () => {
    const body = ruleBody(CSS, /\.preview-svg svg\s*\{/);
    assert.match(body, /width:\s*100%/);
    assert.match(body, /height:\s*100%/);
  });

  test(".preview-frame carries the (overridable) aspect-ratio, the element app.js targets", () => {
    const body = ruleBody(CSS, /\.preview-frame\s*\{/);
    assert.match(body, /aspect-ratio:\s*64 \/ 27/);
  });

  test("app.js sets aspectRatio on previewFrame, not on the inner preview element", () => {
    assert.match(APP_JS, /previewFrame\.style\.aspectRatio\s*=\s*`\$\{state\.width\} \/ \$\{state\.height\}`/);
    assert.doesNotMatch(APP_JS, /\bels\.preview\.style\.aspectRatio/);
  });
});

describe("v0.4.0 sharing/saved-designs controls don't reintroduce overflow", () => {
  test(".palette-gallery wraps its swatches instead of forcing width", () => {
    const body = ruleBody(CSS, /\.palette-gallery\s*\{/);
    assert.match(body, /flex-wrap:\s*wrap/);
  });

  test(".saved-design-row and its action buttons wrap and can shrink", () => {
    const rowBody = ruleBody(CSS, /\.saved-design-row\s*\{/);
    assert.match(rowBody, /flex-wrap:\s*wrap/);
    assert.match(rowBody, /min-width:\s*0/);
    const infoBody = ruleBody(CSS, /\.saved-design-info\s*\{/);
    assert.match(infoBody, /min-width:\s*0/);
    const actionsBody = ruleBody(CSS, /\.saved-design-actions\s*\{/);
    assert.match(actionsBody, /flex-wrap:\s*wrap/);
  });

  test(".share-link-field can shrink to its container", () => {
    const body = ruleBody(CSS, /\.share-link-field\s*\{/);
    assert.match(body, /width:\s*100%/);
    assert.match(body, /min-width:\s*0/);
  });

  test("the rename dialog is capped relative to viewport width, not a fixed px width", () => {
    const body = ruleBody(CSS, /dialog#renameDialog\s*\{/);
    assert.match(body, /max-width:\s*[\d.]+rem/);
    assert.match(body, /width:\s*calc\(100% - [\d.]+rem\)/);
  });

  test("no new bare `repeat(N, 1fr)` grid track was introduced", () => {
    assert.doesNotMatch(CSS, /repeat\(\s*\d+\s*,\s*1fr\s*\)/);
  });
});
