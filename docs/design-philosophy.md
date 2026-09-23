# Design Philosophy

## 1. Translation, not tracing

Palembang begins with a physical painting, but the graphic system is not intended to reproduce every cloud, wave, brush mark, color transition, or surface texture. The design removes literal detail until the scene survives as a small set of spatial relationships and atmospheric fields.

The result should feel like **the memory of the painting after detail has been removed**.

## 2. What must survive simplification

The source abstraction keeps the characteristics that carry the painting's beauty most efficiently:

- a quiet horizontal divide between sky and sea;
- a nearly equal visual weight above and below that divide;
- warmth emerging near the horizon but biased to the right;
- coolness surrounding the warm sky field;
- a darker lower field with a lighter atmospheric band and translucent cyan/teal luminosity;
- softness without literal pictorial detail.

The system deliberately avoids turning these ideas into a generic centered sunset gradient.

## 3. Geometry before palette

The canonical Figma design regularizes the scene into an exact 50/50 split. That geometric decision is more durable than any one color palette.

Therefore:

- **Geometry / composition:** fixed.
- **Palette:** variable by design.
- **Texture intensity:** variable and optional.
- **Output aspect ratio:** adaptable under the canonical reconstruction rule.

A recolored version should remain recognizably Palembang even if none of the original six scene colors survive.

## 4. Controlled asymmetry

The warm field is not centered. The original painting places the visible sun to the right of center, and the Figma abstraction preserves that lineage through its gradient transform rather than through a literal sun disk.

This asymmetry is intentional. Re-centering the gradient may make the image look cleaner in a generic sense, but it weakens the relationship to the source work.

## 5. The lower field is layered

The sea is not represented by a single blue-green gradient. The Figma source uses three paints in order:

1. base radial field;
2. translucent silver haze;
3. translucent teal/cyan glow.

This layering is a structural feature, not decoration. Implementations that collapse the lower half into one gradient are approximations rather than canonical reproductions.

## 6. Texture is secondary

The physical painting contains canvas and brush texture. The canonical Figma source does not contain a raster texture, grain layer, or brush texture. That absence is intentional in the simplified graphic.

Texture may be introduced in expressive variants, but it must be independently controllable and removable. It should alter surface feeling without changing the composition.

## 7. Responsive formats are reconstructions

Wide versions are not crops of the square version. For every output ratio, the sky and sea halves are rebuilt at half the output height and the same normalized paint transforms are reapplied.

This means Palembang is best understood as a **rendering system**, not as one master bitmap.

## 8. Preservation rule

When uncertain, preserve the exact source and add a new named variant rather than silently modifying canonical values.
