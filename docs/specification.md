# Palembang Graphic System Specification

**Status:** Canonical design/implementation specification  
**Version:** 1.1  
**Primary source:** `Palembang.fig`  
**Reference artwork:** uploaded square seascape/sunset painting  
**Intended use:** Figma, web, mobile, desktop, native UI, SVG, Canvas, shaders, generated assets, branding, backgrounds, icons, badges, and future color themes

---

## 0. How to read this document

This specification separates four kinds of information so the original Figma design is never silently changed:

- **[SOURCE]** — directly extracted from `Palembang.fig`; preserve exactly when reproducing the source design.
- **[SYSTEM]** — the durable Palembang design rule inferred from repeated source structure and explicitly adopted here.
- **[RENDER]** — a completed canonical PNG supplied by the user; authoritative for expected raster appearance at its aspect ratio, but not a substitute for source geometry/gradient math.
- **[REFERENCE]** — visual meaning taken from the original painting; it guides taste but is not a literal tracing requirement.
- **[EXTENSION]** — a reusable rule added for future coding/design use; it must not overwrite source geometry.

When rules conflict, distinguish *what kind of truth is in question*:

1. Use `Palembang.fig` for exact editable geometry, gradient definitions, layer order, and source construction.
2. Use `assets/canonical/png/` for the expected completed raster appearance of the supplied canonical variants.
3. Use the system invariants defined here when adapting the design to new formats or implementations.
4. Use the original painting as an aesthetic reference, not as a pixel-tracing target.
5. Platform-specific implementation convenience comes last.

A PNG export may contain rasterization/resampling differences. Do not reverse-engineer new geometry from those differences when the Figma source already defines the geometry exactly.

The goal is **not to reproduce the painting literally**. The goal is to preserve the painting's beauty through a deliberately simplified graphic language.

---

# 1. Design identity

## 1.1 Core idea

Palembang is a simplified translation of a square painting of sea, sky, sunset light, clouds, and moving water.

The canonical graphic keeps only the structural ideas that carry the painting's atmosphere:

- a hard, calm horizon;
- sky and sea divided at the midpoint;
- a warm, right-of-center light field rather than a literal painted sun;
- a cool upper field surrounding that warm light;
- a darker lower field with layered haze and cyan/teal luminosity;
- no literal cloud or wave illustration in the canonical graphic;
- a very small number of soft gradients doing the work that brush texture and color variation do in the painting.

The design should feel like **the memory of the painting after detail has been removed**, not like a generic sunset gradient.

## 1.2 What carries the identity

**[SYSTEM] Fixed identity:**

- geometry and split ratio;
- normalized gradient transforms;
- gradient stop positions;
- layer order;
- relative opacity structure;
- right-biased warm focal region;
- the three-layer construction of the lower half;
- the absence of literal pictorial detail in the canonical mode.

**[SYSTEM] Variable identity:**

- color palette;
- optional texture intensity;
- target outer aspect ratio;
- export resolution;
- surrounding/mask presentation.

The practical rule is:

> **Geometry stays. Color may change. Texture may change. The composition must still read as Palembang.**

---

# 2. Source hierarchy and source of truth

## 2.1 Canonical editable source

`source/Palembang.fig` is the canonical editable implementation source. It defines the exact geometry, fills, transforms, layer order, and source construction.

The uploaded painting is the artistic source, but it is not a pixel-perfect implementation target. The Figma graphic is already an intentional abstraction of it.

## 2.2 Canonical completed raster renders

**[RENDER]** The user also supplied four completed PNG graphics. These are preserved byte-for-byte in `assets/canonical/png/` and are first-class canonical outputs rather than disposable previews.

| Preserved file | Nominal Figma/source variant | Actual bitmap stored in this repository |
|---|---:|---:|
| `Palembang.png` | `320 × 320` | `320 × 320` |
| `Palembang2560x1080.png` | `2560 × 1080` | `2048 × 864` |
| `Palembang2560x1664.png` | `2560 × 1664` | `2048 × 1331` |
| `Palembang2560x2560.png` | `2560 × 2560` | `2048 × 2048` |

The filenames are preserved exactly as supplied. The 2560-named files arrived in the project as 2048-pixel-wide bitmaps; this repository does **not** silently upscale or rename them. The nominal source size and actual stored bitmap size are both recorded in `assets/canonical/manifest.json`.

Use these PNGs directly when a consumer only needs a raster asset. Use them as visual-validation targets for platform renderers. Do not infer or redefine normalized gradient geometry from raster sampling when the Figma source/specification already provides the exact source values.

## 2.3 Why this distinction matters

The painting contains clouds, brush marks, wave crests, foam, local hue shifts, and a visible sun. The Figma graphic intentionally removes those literal details.

Future implementations must therefore **not** add clouds, wave outlines, foam, or a literal sun disk merely because they exist in the painting. Those elements may be explored in separate expressive variants, but they are not part of the canonical simplified graphic.

## 2.4 Original-art relationship

**[REFERENCE]** In the uploaded near-square photograph, the painted horizon appears at roughly 48% of image height and the visible sun is right of center. The photograph is not geometrically authoritative because of camera crop/perspective.

**[SYSTEM]** The Figma abstraction regularizes this into an exact 50/50 split while preserving the right-biased warmth through the gradient transform.

This idealization is intentional and should be preserved.

---

# 3. Canonical coordinate system

Use a normalized coordinate system for every target rectangle:

```text
x = 0.0 ------------------------------ x = 1.0
        SKY / UPPER FIELD

              warm focus is intentionally
              right of geometric center

---------------- y = 0.5 ----------------
                HORIZON

        SEA / LOWER FIELD

x = 0.0 ------------------------------ x = 1.0
                              y = 1.0
```

## 3.1 Absolute invariant

**[SOURCE][SYSTEM]** For every source format:

```text
horizon_y = 0.500000
sky_height = 0.500000 * total_height
sea_height = 0.500000 * total_height
```

The source does not crop a square master to create wide versions. It reconstructs two half-height rectangles at each target aspect ratio and applies the **same normalized paint transforms** to those halves.

That behavior is the key adaptation rule for future formats.

## 3.2 Important non-invariant: do not recenter the light

The warm field is **not** a centered radial gradient.

Do not replace the sky paint with a generic centered CSS radial gradient. The off-center/elliptical character is encoded by the exact Figma gradient transform matrix in Section 6.

The original painting's sun is also right of center, so this asymmetry is part of the visual lineage.

---

# 4. Canonical layer model

Render from bottom to top in the following conceptual order.

```text
PALembangGraphic
├── UpperHalf / Sky
│   └── Sky radial gradient
└── LowerHalf / Sea
    ├── Sea base radial gradient
    ├── Silver horizon/haze linear gradient
    └── Teal/cyan glow radial gradient
```

All source paint blend modes are `NORMAL`.

The upper half has **one** paint.
The lower half has **three** paints.

Do not collapse the lower half into one gradient if visual fidelity matters.

---

# 5. Original source palette

These colors are the exact sRGB source values extracted from the Figma file.

| Token | Source hex | Role |
|---|---:|---|
| `sky.hot` | `#DF8117` | warm sunset core / light field |
| `sky.cool` | `#8198C4` | cool outer sky |
| `sea.light` | `#8BA08A` | lighter green-gray sea field |
| `sea.dark` | `#516872` | dark blue-gray sea field |
| `sea.haze` | `#C0C0C0` | silver/neutral haze stripe |
| `sea.glow` | `#78B6BA` | turquoise/cyan lower glow |
| `surround.dark` | `#0B1014` | dark circular-preview surround |
| `boolean.input.gray` | `#D9D9D9` | source boolean child fill; not a canonical scene color |
| `utility.hidden.purple` | `#5B295D` | hidden locked utility/background layer |
| `page.background` | `#FFFFFF` | Figma page background |

**[SYSTEM]** A future color theme may replace the six scene colors (`sky.*`, `sea.*`) while preserving geometry, transforms, stop positions, layer order, and opacity structure.

The three non-scene colors (`surround.dark`, `boolean.input.gray`, `utility.hidden.purple`) are presentation/source-layout colors rather than scene palette requirements.

---

# 6. Exact paint definitions

The matrices below are the exact normalized Figma gradient transforms extracted from `Palembang.fig`.

Store them as canonical data even if a target platform uses a different gradient representation.

> **Important:** these are Figma gradient transforms. Do not assume they are directly interchangeable with a CSS `matrix()` or another framework's affine-gradient API without conversion.

## 6.1 Sky / upper half

**Type:** radial gradient  
**Paint opacity:** `1.0`  
**Blend mode:** `NORMAL`

### Stops

```yaml
- position: 0.0
  color: "#DF8117"
  alpha: 1.0

- position: 1.0
  color: "#8198C4"
  alpha: 1.0
```

### Exact normalized transform

```text
[ -0.23465590178966522  -0.4919448792934418   1.135002613067627  ]
[  1.0074560642242432   -0.11458345502614975  0.00038877970655448735 ]
```

Machine form:

```yaml
m00: -0.23465590178966522
m01: -0.4919448792934418
m02:  1.135002613067627
m10:  1.0074560642242432
m11: -0.11458345502614975
m12:  0.00038877970655448735
```

### Visual meaning

The matrix produces the asymmetric, soft orange-to-blue sky field. It is the main reason the light does not look mechanically centered.

---

## 6.2 Sea base / lower half — paint 1

**Type:** radial gradient  
**Paint opacity:** `1.0`  
**Blend mode:** `NORMAL`

### Stops

```yaml
- position: 0.0
  color: "#8BA08A"
  alpha: 1.0

- position: 1.0
  color: "#516872"
  alpha: 1.0
```

### Exact normalized transform

```text
[ -0.5384021401405334  -0.29897022247314453  1.2772572040557861 ]
[  0.29897022247314453 -0.12837707996368408  0.3539741635322571 ]
```

Machine form:

```yaml
m00: -0.5384021401405334
m01: -0.29897022247314453
m02:  1.2772572040557861
m10:  0.29897022247314453
m11: -0.12837707996368408
m12:  0.3539741635322571
```

---

## 6.3 Silver haze / lower half — paint 2

**Type:** linear gradient  
**Paint opacity:** `0.44999998807907104` (authoring value ≈ `0.45`)  
**Blend mode:** `NORMAL`

### Stops — 2560-wide source variants

```yaml
- position: 0.20000000298023224
  color: "#C0C0C0"
  alpha: 0.0

- position: 0.30000001192092896
  color: "#C0C0C0"
  alpha: 0.800000011920929

- position: 0.3764832615852356
  color: "#C0C0C0"
  alpha: 0.0
```

Because the paint opacity is ~0.45, the middle stop's effective maximum alpha is approximately `0.36` when opacity and stop alpha are multiplied normally.

### Exact normalized transform

```text
[ -3.0531133177191805e-16  -0.4260985553264618   0.5246338248252869 ]
[  0.4260985553264618      -2.7755575615628914e-17 0.3342210352420807 ]
```

Machine form:

```yaml
m00: -3.0531133177191805e-16
m01: -0.4260985553264618
m02:  0.5246338248252869
m10:  0.4260985553264618
m11: -2.7755575615628914e-17
m12:  0.3342210352420807
```

### Small 320×320 source exception

The 320×320 source graphic uses the same positions, transform, paint opacity, and color, but the middle haze stop alpha is `1.0` rather than `0.8`.

```yaml
small_320_middle_stop_alpha: 1.0
large_variants_middle_stop_alpha: 0.800000011920929
```

This is a real source difference and must not be lost from the record.

**[SYSTEM recommendation for new variants]:** use the repeated 2560-wide definition (`0.8` middle-stop alpha) as the default canonical system value unless exact reproduction of the 320 source variant is required. The 320 version may remain as a preserved legacy/source variant.

---

## 6.4 Teal glow / lower half — paint 3

**Type:** radial gradient  
**Paint opacity:** `0.6000000238418579` (authoring value ≈ `0.60`)  
**Blend mode:** `NORMAL`

### Stops

```yaml
- position: 0.09071040898561478
  color: "#78B6BA"
  alpha: 1.0

- position: 1.0
  color: "#78B6BA"
  alpha: 0.0
```

### Exact normalized transform

```text
[ 0.770240843296051   -0.6885483860969543   0.9014222025871277 ]
[ 0.6885483860969543   0.19256021082401276  0.13915027678012848 ]
```

Machine form:

```yaml
m00:  0.770240843296051
m01: -0.6885483860969543
m02:  0.9014222025871277
m10:  0.6885483860969543
m11:  0.19256021082401276
m12:  0.13915027678012848
```

The maximum effective alpha is approximately `0.60` near the first stop before fading to zero.

---

# 7. Canonical format variants from the Figma source

The same normalized paint definitions are reused across all source aspect ratios.

| Source variant | Size | Aspect ratio | Upper half | Lower half | Horizon |
|---|---:|---:|---:|---:|---:|
| Small square / `Group 5` | `320×320` | `1:1` | `320×160` | `320×160` | `y=160` |
| `Group 1` | `2560×1080` | `64:27` ≈ `2.370370` | `2560×540` | `2560×540` | `y=540` |
| `Group 3` | `2560×1664` | `20:13` ≈ `1.538462` | `2560×832` | `2560×832` | `y=832` |
| `Group 4` | `2560×2560` | `1:1` | `2560×1280` | `2560×1280` | `y=1280` |

## 7.1 Required adaptation rule for new aspect ratios

For a target `W × H`:

```text
upper_rect = (0, 0, W, H/2)
lower_rect = (0, H/2, W, H/2)
```

Then apply the canonical normalized sky transform to `upper_rect` and the three canonical normalized sea transforms to `lower_rect`.

**Do not:**

- crop the 1:1 source graphic;
- stretch a pre-rendered square bitmap unless the use case explicitly accepts approximation;
- move the horizon to accommodate content;
- recenter the gradient for wide screens;
- scale the gradients in absolute pixels independently of the half-rectangles.

The source itself demonstrates that normalized transforms, not a fixed bitmap crop, are the format system.

## 7.2 Odd pixel heights

**[EXTENSION]** In vector rendering, keep the seam at exactly `0.5H`.

For raster-only APIs with odd integer heights:

```text
seam = round(H * 0.5)
upper_height = seam
lower_y = seam
lower_height = H - seam
```

If a 1-pixel antialias seam appears, solve it as a rasterization issue (clipping, shared edge, or ≤1 device-pixel overlap). Do not redefine the conceptual 50/50 geometry.

---

# 8. Circular preview / emblem construction

The source includes a circular presentation of the 320×320 graphic.

## 8.1 Exact source geometry

### Boolean surround

```yaml
node: "Exclude"
type: BOOLEAN_OPERATION
operation: XOR
locked: true
position_on_page:
  x: 0
  y: -52
size:
  width: 438
  height: 423
fill: "#0B1014"
```

### Rectangle boolean input

```yaml
node: "Rectangle 2"
relative_position:
  x: 0
  y: 0
size:
  width: 438
  height: 423
fill: "#D9D9D9"
```

### Circle boolean input

```yaml
node: "Ellipse 1"
relative_position:
  x: 59
  y: 51
absolute_page_position:
  x: 59
  y: -1
size:
  width: 320
  height: 320
fill: "#000000"
proportions_constrained: true
arc:
  start: 0.0
  end: 6.2831854820251465
  inner_radius: 0.0
```

### Graphic aligned into the circular opening

```yaml
node: "Group 5"
position_on_page:
  x: 59
  y: -1
size:
  width: 320
  height: 320
```

The `Group 5` graphic aligns exactly with the circle's absolute bounds. The result is a 320×320 Palembang graphic visible through a 320×320 circular opening in a dark `#0B1014` surround.

## 8.2 System interpretation

The circular treatment is a **presentation variant**, not a change to the scene geometry.

For future circle/avatar/icon use:

1. Render the standard square Palembang graphic.
2. Clip it with a circle.
3. Optionally place it in the `#0B1014` surround.
4. Do not recompute or recenter the internal gradients just because the crop is circular.

---

# 9. Source-only utility layer

The Figma file contains one hidden, locked 1000×1000 rectangle:

```yaml
node: "Rectangle 3"
visible: false
locked: true
position:
  x: -281
  y: -288
size:
  width: 1000
  height: 1000
fill: "#5B295D"
```

It is preserved in this specification because it exists in the source file, but it is **not** part of the canonical scene composition.

Do not use `#5B295D` as a required Palembang palette color unless intentionally restoring this utility/source layer.

---

# 10. Exact source canvas layout

The Figma page is white (`#FFFFFF`). Main objects are arranged vertically on the page.

```text
Page 1
│
├── circular preview composite around y=-52..371
├── hidden 1000×1000 utility rectangle at (-281,-288)
│
├── Group 1  2560×1080 at (0, 479)
│   ├── sky   2560×540 at local y≈0
│   └── sea   2560×540 at local y=540
│
├── Group 3  2560×1664 at (0, 1667)
│   ├── sky   2560×832 at local y≈0
│   └── sea   2560×832 at local y=832
│
└── Group 4  2560×2560 at (0, 3439)
    ├── sky   2560×1280 at local y≈0
    └── sea   2560×1280 at local y=1280
```

The source places `Group 1 → Group 3` and `Group 3 → Group 4` with 108 px vertical gaps between frame bounds.

These page-layout gaps are authoring-canvas organization, not scene geometry.

---

# 11. Figma source metadata

```yaml
file_name: "Palembang"
document_color_profile: "SRGB"
page_background: "#FFFFFF"
exported_at: "2026-09-18T14:29:15.668Z"
thumbnail:
  width: 169
  height: 400
render_coordinates:
  x: -2.842170943040401e-14
  y: -52
  width: 2560
  height: 6051
developer_related_links: []
```

The file contains no embedded raster image assets in `images/`.

The canonical scene is therefore defined by Figma vector shapes and gradient paints, not by a baked bitmap.

---

# 12. Export behavior present in the source

The main 2560-wide frames and their half-rectangles are configured for PNG export at 1×.

Source export settings:

```yaml
imageType: PNG
constraint:
  type: CONTENT_SCALE
  value: 1.0
contentsOnly: true
useAbsoluteBounds: false
colorProfile: DOCUMENT
useBicubicSampler: true
```

These settings are present on:

- `Group 1`
- `Group 3`
- `Group 4`
- their upper and lower rectangle children
- the two 320×160 rectangle children inside `Group 5`

`Group 5` itself has no export setting in the extracted source record.

**[EXTENSION]** Export scale/resolution may change freely as long as the normalized geometry and paints remain unchanged.

---

# 13. Palette replacement contract

A palette swap must alter **colors only** by default.

## 13.1 Required scene tokens

```yaml
sky_hot:   "#DF8117"
sky_cool:  "#8198C4"
sea_light: "#8BA08A"
sea_dark:  "#516872"
sea_haze:  "#C0C0C0"
sea_glow:  "#78B6BA"
```

## 13.2 Must remain unchanged during a pure palette swap

```yaml
horizon_y: 0.5
sky_gradient_type: radial
sky_gradient_transform: canonical
sky_stop_positions: [0.0, 1.0]

sea_base_gradient_type: radial
sea_base_transform: canonical
sea_base_stop_positions: [0.0, 1.0]

sea_haze_gradient_type: linear
sea_haze_transform: canonical
sea_haze_paint_opacity: 0.45
sea_haze_stop_positions: [0.2, 0.3, 0.3764832615852356]

sea_glow_gradient_type: radial
sea_glow_transform: canonical
sea_glow_paint_opacity: 0.60
sea_glow_stop_positions: [0.09071040898561478, 1.0]

blend_modes: NORMAL
layer_order:
  - sea_base
  - sea_haze
  - sea_glow
```

## 13.3 Color-theme philosophy

A theme should replace color **roles**, not choose arbitrary independent colors for each pixel region.

Examples of role relationships that should survive recoloring:

- `sky.hot` remains the warm/energetic focal role, even if it becomes non-orange.
- `sky.cool` remains the surrounding field role.
- `sea.light` and `sea.dark` maintain the lower-half depth contrast.
- `sea.haze` stays a neutral or near-neutral luminous separator.
- `sea.glow` remains a secondary translucent atmospheric color.

A monochrome theme can still satisfy these roles through luminance rather than hue.

---

# 14. Texture contract

## 14.1 Canonical source state

**[SOURCE]** The Figma scene has no raster texture layer, brush texture, grain layer, noise effect, or embedded image.

Therefore:

```yaml
canonical_texture_intensity: 0
```

## 14.2 Optional future texture

**[EXTENSION]** Texture may be added because the original artwork is a physical painting, but texture is an optional enhancement rather than part of the source Figma geometry.

Expose texture as an independent control:

```yaml
texture_intensity:
  min: 0.0
  max: 1.0
  canonical_default: 0.0
```

Texture must obey these rules:

- it must not move the horizon;
- it must not alter gradient transforms;
- it must not create a literal sun, clouds, or waves in canonical mode;
- it should modulate surface feel rather than create new composition;
- it must be possible to set intensity back to `0` and recover the canonical source look.

---

# 15. Recommended runtime data model

The following is the recommended platform-neutral representation.

```yaml
palembang:
  spec_version: "1.0"
  color_space: "sRGB"

  geometry:
    horizon_y: 0.5
    upper_height: 0.5
    lower_height: 0.5
    adaptation: "rebuild-halves-with-normalized-paint-transforms"

  sky:
    type: "radial"
    opacity: 1.0
    blend_mode: "normal"
    transform:
      - [-0.23465590178966522, -0.4919448792934418, 1.135002613067627]
      - [ 1.0074560642242432,  -0.11458345502614975, 0.00038877970655448735]
    stops:
      - { position: 0.0, color_token: "sky.hot",  alpha: 1.0 }
      - { position: 1.0, color_token: "sky.cool", alpha: 1.0 }

  sea:
    base:
      type: "radial"
      opacity: 1.0
      blend_mode: "normal"
      transform:
        - [-0.5384021401405334,  -0.29897022247314453, 1.2772572040557861]
        - [ 0.29897022247314453, -0.12837707996368408, 0.3539741635322571]
      stops:
        - { position: 0.0, color_token: "sea.light", alpha: 1.0 }
        - { position: 1.0, color_token: "sea.dark",  alpha: 1.0 }

    haze:
      type: "linear"
      opacity: 0.44999998807907104
      blend_mode: "normal"
      transform:
        - [-3.0531133177191805e-16, -0.4260985553264618, 0.5246338248252869]
        - [ 0.4260985553264618,     -2.7755575615628914e-17, 0.3342210352420807]
      stops:
        - { position: 0.20000000298023224, color_token: "sea.haze", alpha: 0.0 }
        - { position: 0.30000001192092896, color_token: "sea.haze", alpha: 0.800000011920929 }
        - { position: 0.3764832615852356,  color_token: "sea.haze", alpha: 0.0 }
      small_320_source_override:
        middle_stop_alpha: 1.0

    glow:
      type: "radial"
      opacity: 0.6000000238418579
      blend_mode: "normal"
      transform:
        - [0.770240843296051,  -0.6885483860969543,  0.9014222025871277]
        - [0.6885483860969543,  0.19256021082401276, 0.13915027678012848]
      stops:
        - { position: 0.09071040898561478, color_token: "sea.glow", alpha: 1.0 }
        - { position: 1.0,                 color_token: "sea.glow", alpha: 0.0 }

  palette:
    sky.hot: "#DF8117"
    sky.cool: "#8198C4"
    sea.light: "#8BA08A"
    sea.dark: "#516872"
    sea.haze: "#C0C0C0"
    sea.glow: "#78B6BA"
    surround.dark: "#0B1014"

  texture:
    intensity: 0.0

  variants:
    source_small_square: { width: 320,  height: 320 }
    source_wide:         { width: 2560, height: 1080 }
    source_medium:       { width: 2560, height: 1664 }
    source_square:       { width: 2560, height: 2560 }
```

This block should be portable into JSON, TypeScript, Swift, Kotlin, Python, Rust, shader uniforms, or a design-token pipeline.

---

# 16. Rendering contract for software

## 16.1 Platform-neutral pseudocode

```text
function renderPalembang(bounds, palette, textureIntensity = 0):
    W = bounds.width
    H = bounds.height

    upper = rect(0, 0, W, H * 0.5)
    lower = rect(0, H * 0.5, W, H * 0.5)

    drawFigmaRadialGradient(
        rect = upper,
        transform = SKY_TRANSFORM,
        stops = [
            (0.0, palette.skyHot, 1.0),
            (1.0, palette.skyCool, 1.0)
        ],
        opacity = 1.0
    )

    drawFigmaRadialGradient(
        rect = lower,
        transform = SEA_BASE_TRANSFORM,
        stops = [
            (0.0, palette.seaLight, 1.0),
            (1.0, palette.seaDark, 1.0)
        ],
        opacity = 1.0
    )

    drawFigmaLinearGradient(
        rect = lower,
        transform = SEA_HAZE_TRANSFORM,
        stops = HAZE_STOPS,
        opacity = 0.45
    )

    drawFigmaRadialGradient(
        rect = lower,
        transform = SEA_GLOW_TRANSFORM,
        stops = GLOW_STOPS,
        opacity = 0.60
    )

    if textureIntensity > 0:
        applyNonStructuralTexture(textureIntensity)
```

## 16.2 Web

For high-fidelity web rendering, prefer:

- SVG with gradient transforms;
- Canvas with a transform-capable gradient implementation;
- WebGL/WebGPU shader;
- a validated pre-rendered asset when dynamic recoloring is unnecessary.

Plain CSS gradients are acceptable only if visually validated against the source. A generic `radial-gradient(circle at 50% 50%, ...)` is **not** an exact implementation.

## 16.3 SwiftUI / Apple platforms

If native gradient APIs cannot express the Figma affine gradient geometry exactly, use one of:

- Canvas with explicit transform logic;
- Core Graphics / Core Image;
- Metal shader;
- generated SVG/image asset for static themes.

Keep the data model independent of the renderer so the exact source matrices are not lost.

## 16.4 Android / Compose

Use a shader/brush implementation capable of transformed radial/linear fields when exact fidelity is required. Keep matrix and stop data external to UI code.

## 16.5 Shader implementation

A shader implementation is a strong fit because:

- palette can be uniforms;
- texture can be an independent uniform;
- aspect ratio can change continuously;
- source transforms remain numeric data;
- high-resolution export does not require bitmap scaling.

Do not reinterpret the design into new geometry when porting it to a shader.

---

# 17. Visual validation contract

Use `assets/canonical/png/` as the preferred direct raster comparison set. For implementation debugging, compare both the visible result and the Figma/source math: raster appearance is the visual target, while `Palembang.fig` and the numeric specification explain how that target is constructed.


Every renderer or theme should be validated against the following invariants.

## 17.1 Geometry

- Horizon is exactly at 50% height.
- Upper and lower regions each occupy exactly half the composition.
- The warm field remains visually right-biased; it is not recentered by convenience code.
- The lower half remains a three-paint composition.
- No gap is visible at the horizon seam.

## 17.2 Paint behavior

- Sky uses one radial field.
- Sea base uses one radial field.
- Haze uses the exact narrow three-stop linear field.
- Teal/cyan glow uses a translucent radial fade.
- All source blend modes remain `NORMAL` unless a deliberately new variant is being designed.

## 17.3 Simplification level

- No literal cloud silhouettes in canonical mode.
- No literal wave/foam drawing in canonical mode.
- No mandatory visible sun disk.
- No unnecessary decorative objects.
- The result must still feel atmospheric rather than flat and diagrammatic.

## 17.4 Theme validation

A recolored version passes only if a viewer can switch back to the original palette without changing geometry or layer definitions.

---

# 18. Anti-regression rules

The following changes should be treated as design regressions unless explicitly approved as a new variant:

- moving the horizon away from `0.5H`;
- centering the warm sky gradient;
- converting the sky to a simple vertical linear gradient;
- flattening the three sea paints into one color/gradient;
- changing gradient transforms during a color-only theme change;
- changing stop positions during a color-only theme change;
- replacing the source with a stretched/cropped square bitmap for responsive layouts;
- introducing a literal sun disk as a required element;
- adding detailed clouds/waves/foam to the canonical implementation;
- using the hidden purple utility layer as a required scene color;
- losing the special 320 haze-alpha difference from historical/source documentation;
- treating `#DF8117` or any other single color as the sole identity of Palembang.

---

# 19. Figma node inventory

This inventory preserves all design-relevant nodes found in the source file.

| # | GUID | Type | Name | Visible | Locked | Position | Size | Key role |
|---:|---|---|---|---|---|---|---|---|
| 0 | `0:0` | DOCUMENT | `Document` | yes | — | `(0,0)` | — | sRGB document |
| 1 | `0:1` | CANVAS | `Page 1` | yes | — | `(0,0)` | — | white authoring page |
| 2 | `0:2` | CANVAS | `Internal Only Canvas` | no | — | `(0,0)` | — | Figma internal canvas |
| 3 | `1:5` | ELLIPSE | `Ellipse 1` | yes | — | `(59,51)` relative to Exclude | `320×320` | circular boolean input |
| 4 | `1:9` | ROUNDED_RECTANGLE | `Rectangle 2` | yes | — | `(0,0)` relative to Exclude | `438×423` | boolean rectangle input |
| 5 | `1:15` | BOOLEAN_OPERATION | `Exclude` | yes | yes | `(0,-52)` | `438×423` | dark XOR circular surround |
| 6 | `1:16` | ROUNDED_RECTANGLE | `Rectangle 3` | no | yes | `(-281,-288)` | `1000×1000` | hidden purple utility layer |
| 7 | `3:43` | ROUNDED_RECTANGLE | `Rectangle 4` | yes | — | `(0,160)` in Group 5 | `320×160` | small lower half |
| 8 | `3:44` | ROUNDED_RECTANGLE | `Rectangle 5` | yes | — | `(0,0)` in Group 5 | `320×160` | small upper half |
| 9 | `3:47` | ROUNDED_RECTANGLE | `Rectangle 6` | yes | — | `(0,540)` in Group 1 | `2560×540` | wide lower half |
| 10 | `3:48` | ROUNDED_RECTANGLE | `Rectangle 7` | yes | — | `(≈0,≈0)` in Group 1 | `2560×540` | wide upper half |
| 11 | `3:51` | FRAME | `Group 1` | yes | — | `(0,479)` | `2560×1080` | wide variant |
| 12 | `4:10` | FRAME | `Group 3` | yes | — | `(0,1667)` | `2560×1664` | medium variant |
| 13 | `4:11` | ROUNDED_RECTANGLE | `Rectangle 6` | yes | — | `(≈0,832)` in Group 3 | `2560×832` | medium lower half |
| 14 | `4:12` | ROUNDED_RECTANGLE | `Rectangle 7` | yes | — | `(≈0,≈0)` in Group 3 | `2560×832` | medium upper half |
| 15 | `5:2` | FRAME | `Group 4` | yes | — | `(0,3439)` | `2560×2560` | square master-size variant |
| 16 | `5:3` | ROUNDED_RECTANGLE | `Rectangle 6` | yes | — | `(≈0,1280)` in Group 4 | `2560×1280` | square lower half |
| 17 | `5:4` | ROUNDED_RECTANGLE | `Rectangle 7` | yes | — | `(≈0,≈0)` in Group 4 | `2560×1280` | square upper half |
| 18 | `5:6` | FRAME | `Group 5` | yes | — | `(59,-1)` | `320×320` | square graphic aligned to circle |

### Numeric epsilon note

Some Figma transforms contain floating-point epsilon values rather than mathematical zero:

```text
x ≈ -2.842170943040401e-14
x ≈  7.105427357601002e-15
y ≈  3.3676624298095703e-06
```

These are implementation noise, not intentional offsets. They may be normalized to `0` when reconstructing layout geometry. **Do not** normalize the gradient transform matrices; those values are meaningful.

---

# 20. Node-specific source details

## 20.1 Document

```yaml
name: Document
type: DOCUMENT
visible: true
opacity: 1.0
documentColorProfile: SRGB
transform: identity
```

## 20.2 Page 1

```yaml
name: Page 1
type: CANVAS
visible: true
opacity: 1.0
backgroundEnabled: true
backgroundOpacity: 1.0
backgroundColor: "#FFFFFF"
strokeWeight: 0.0
strokeAlign: CENTER
strokeJoin: BEVEL
```

## 20.3 Internal Only Canvas

```yaml
name: Internal Only Canvas
type: CANVAS
visible: false
internalOnly: true
opacity: 1.0
```

## 20.4 Ellipse 1

```yaml
name: Ellipse 1
type: ELLIPSE
visible: true
opacity: 1.0
size: [320, 320]
position_relative_to_parent: [59, 51]
fill: "#000000"
fill_opacity: 1.0
blend_mode: NORMAL
strokeWeight: 1.0
strokeAlign: INSIDE
strokeJoin: MITER
proportionsConstrained: true
arc:
  startingAngle: 0.0
  endingAngle: 6.2831854820251465
  innerRadius: 0.0
```

No stroke paint is present; the stored stroke metadata does not create a visible stroke by itself.

## 20.5 Rectangle 2

```yaml
name: Rectangle 2
type: ROUNDED_RECTANGLE
visible: true
opacity: 1.0
size: [438, 423]
position_relative_to_parent: [0, 0]
fill: "#D9D9D9"
fill_opacity: 1.0
blend_mode: NORMAL
strokeWeight: 1.0
strokeAlign: INSIDE
strokeJoin: MITER
```

No nonzero corner-radius property was found in the extracted node record; treat it as rectangular source geometry.

## 20.6 Exclude

```yaml
name: Exclude
type: BOOLEAN_OPERATION
operation: XOR
visible: true
locked: true
opacity: 1.0
position: [0, -52]
size: [438, 423]
fill: "#0B1014"
fill_opacity: 1.0
blend_mode: NORMAL
strokeWeight: 0.0
strokeAlign: INSIDE
strokeJoin: MITER
```

## 20.7 Rectangle 3

```yaml
name: Rectangle 3
type: ROUNDED_RECTANGLE
visible: false
locked: true
opacity: 1.0
position: [-281, -288]
size: [1000, 1000]
fill: "#5B295D"
fill_opacity: 1.0
blend_mode: NORMAL
strokeWeight: 1.0
strokeAlign: INSIDE
strokeJoin: MITER
```

## 20.8 Main frame properties

`Group 1`, `Group 3`, `Group 4`, and `Group 5` share:

```yaml
visible: true
opacity: 1.0
frameMaskDisabled: false
resizeToFit: true
strokeWeight: 1.0
strokeAlign: INSIDE
strokeJoin: MITER
```

`Group 1`, `Group 3`, and `Group 4` additionally carry the 1× PNG export setting described earlier.

No frame stroke paint was found; stroke metadata should not be interpreted as a required visible outline.

---

# 21. Fill-geometry source notes

The Figma file stores vector fill geometry through internal command blobs. The relevant extracted `commandsBlob` references are:

```yaml
small_320_graphic:
  lower_fill_geometry_blob: 5
  upper_fill_geometry_blob: 5

wide_2560x1080:
  lower_fill_geometry_blob: 6
  upper_fill_geometry_blob: 6

medium_2560x1664:
  lower_fill_geometry_blob: 7
  upper_fill_geometry_blob: 7

square_2560x2560:
  lower_fill_geometry_blob: 8
  upper_fill_geometry_blob: 8
```

These blobs represent the rectangular fill geometry at each source size. They do not introduce additional visible scene objects beyond the rectangles already specified.

For normal implementation, reconstruct the rectangles from their exact dimensions rather than depending on Figma's private geometry blobs.

---

# 22. Original painting: what to preserve, what not to literalize

## 22.1 Preserve

**[REFERENCE]** The painting contributes these aesthetic principles:

- a strong horizontal boundary between sky and sea;
- a luminous orange region near the horizon, right of center;
- cool blue atmosphere wrapping the warm region;
- soft transitions rather than sharp graphic bands in the sky;
- a denser, darker sea directly under the horizon;
- pale turquoise/green and white luminosity in the lower water;
- a sense of layered depth despite a simple square composition;
- calm global composition with local painterly energy.

## 22.2 Do not literalize in the canonical graphic

- individual cloud contours;
- the painted sun disk;
- brushstroke direction;
- individual whitecaps;
- foam lines;
- exact pigment variation;
- canvas texture;
- signature.

These belong to the painting, not to the minimal canonical system.

## 22.3 The abstraction principle

A successful Palembang variant should make a viewer feel the same **spatial balance and atmospheric temperature contrast** without needing to recognize exact objects from the painting.

---

# 23. Recommended design-token API

A compact interface for applications:

```ts
interface PalembangPalette {
  skyHot: string;
  skyCool: string;
  seaLight: string;
  seaDark: string;
  seaHaze: string;
  seaGlow: string;
  surroundDark?: string;
}

interface PalembangOptions {
  palette: PalembangPalette;
  textureIntensity?: number; // 0..1, default 0
  smallSourceHazeOverride?: boolean; // exact 320 source fidelity only
}
```

The renderer should **not** expose horizon position or gradient matrices as casual theme controls. Those are identity geometry, not palette settings.

If an experimental tool needs to expose them, place them behind an explicit advanced/experimental mode so ordinary theming cannot accidentally destroy the design.

---

# 24. Naming convention for implementations

Recommended semantic names:

```text
palembang/
  geometry
    horizon
    sky-transform
    sea-base-transform
    sea-haze-transform
    sea-glow-transform
  palette
    sky-hot
    sky-cool
    sea-light
    sea-dark
    sea-haze
    sea-glow
  variant
    square
    medium
    wide
    circle
  texture
    intensity
```

Do not name tokens only by their current hue (`orange`, `blue`, `green`) because colors are intended to be swappable. Role names preserve meaning across themes.

---

# 25. Versioning rules

Use semantic changes for the design system itself:

- **Patch:** implementation correction that does not alter visual design, e.g. fixing a platform renderer to match the same matrices.
- **Minor:** new palette, export format, platform adapter, or optional texture mode that preserves canonical geometry.
- **Major:** changing the 50/50 split, normalized gradient transforms, stop positions, core layer structure, or simplification philosophy.

A palette change alone is **not** a new major design version.

A geometry change should be treated as a new Palembang design generation rather than quietly replacing v1.

---

# 26. Canonical checksum — human-readable

If only one compact description can travel with the asset, use this:

```text
Palembang v1:
A square-painting-derived abstract seascape system.
Split every target exactly 50/50 at the horizon.
Render the upper half with the canonical asymmetric Figma radial transform
using sky.hot -> sky.cool.
Render the lower half with three paints in order:
sea base radial, silver haze linear, teal glow radial.
Keep all normalized transforms and stop positions fixed across aspect ratios.
Colors may be swapped; texture may be added independently.
Never recenter the warm field or reduce the lower half to one gradient.
The canonical source contains no literal clouds, waves, or sun disk.
Completed canonical PNG renders live in assets/canonical/png and may be used directly.
```

---

# 27. Final implementation principle

> **Do not preserve the painting by copying its objects. Preserve it by keeping the relationships that survived simplification.**

For Palembang v1, those relationships are now explicit numeric data:

- `0.5` horizon;
- four exact gradient transforms;
- fixed gradient types and stop positions;
- one sky layer + three lower paints;
- stable normalized behavior across all aspect ratios;
- replaceable semantic color roles;
- optional, independent texture.

That is the canonical contract for future design and code.
