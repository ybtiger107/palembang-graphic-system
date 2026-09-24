# Source Inventory

This file records the preserved design source, completed canonical raster assets, and physical-artwork references.

## Figma archive

`source/Palembang.fig` is a ZIP-based Figma archive containing exactly:

```text
canvas.fig
thumbnail.png
meta.json
images/
```

The supplied `images/` directory is empty. The canonical scene therefore contains no embedded raster image asset.

A byte-for-byte extraction is stored in `source/extracted/`.

## Canonical scene objects

The Figma source contains:

- small `320 × 320` square graphic (`Group 5`), made from two `320 × 160` halves;
- `2560 × 1080` graphic (`Group 1`), two `2560 × 540` halves;
- `2560 × 1664` graphic (`Group 3`), two `2560 × 832` halves;
- `2560 × 2560` graphic (`Group 4`), two `2560 × 1280` halves;
- circular/XOR presentation around the small square;
- hidden locked `1000 × 1000` purple utility rectangle;
- white Figma page background.

The upper half contains one radial paint. The lower half contains three paints in order: base radial gradient, silver linear haze, and teal radial glow.

The small 320 px graphic has one source-specific haze-alpha difference documented in `docs/specification.md` and `tokens/palembang.v1.json`.

## Completed canonical PNG renders

The user supplied four finished PNG graphics. They are preserved byte-for-byte under `assets/canonical/png/` and are **canonical raster outputs**, not previews.

| File | Nominal Figma/source variant | Actual stored pixel size |
|---|---:|---:|
| `Palembang.png` | `320 × 320` | `320 × 320` |
| `Palembang2560x1080.png` | `2560 × 1080` | `2048 × 864` |
| `Palembang2560x1664.png` | `2560 × 1664` | `2048 × 1331` |
| `Palembang2560x2560.png` | `2560 × 2560` | `2048 × 2048` |

The stored dimensions above are the actual bytes received in this project. The filenames are intentionally unchanged. The manifest at `assets/canonical/manifest.json` records dimensions, aspect ratio, SHA-256, byte length, image mode, and available embedded metadata.

Agents and applications may inspect these PNGs for validation or authorized internal workflows. They are not reusable application assets; derived/resized/recolored files must be written elsewhere rather than replacing these files.

## Reference photographs

- `reference/original-artwork-front.jpeg`: `2048 × 1971`, RGB.
- `reference/original-artwork-context.JPG`: `1536 × 2048`, RGB.

These are reference photographs of the physical artwork, not canonical geometry files.

## Integrity

`MANIFEST.sha256` records SHA-256 hashes for preserved source/reference/canonical-render files and the canonical specification. Run:

```bash
python3 scripts/verify.py
```

before a release or after moving the repository between systems.
