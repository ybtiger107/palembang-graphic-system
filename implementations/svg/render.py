#!/usr/bin/env python3
"""Render the canonical Palembang scene as deterministic SVG."""

from __future__ import annotations

import argparse
import json
import math
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[2]
TOKENS_PATH = ROOT / "tokens" / "palembang.v1.json"


def number(value: Decimal | float | int) -> str:
    """Return a compact, deterministic SVG number."""
    if isinstance(value, Decimal):
        text = format(value, "f")
    else:
        text = repr(float(value))
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text or "0"


def parse_dimension(raw: str, name: str) -> Decimal:
    try:
        value = Decimal(raw)
    except InvalidOperation as exc:
        raise argparse.ArgumentTypeError(f"{name} must be a finite positive number") from exc
    if not value.is_finite() or value <= 0:
        raise argparse.ArgumentTypeError(f"{name} must be a finite positive number")
    return value


def inverse_affine(matrix: list[list[float]]) -> tuple[float, float, float, float, float, float]:
    """Convert Figma's shape->gradient matrix to SVG's gradient->shape matrix.

    The token rows are [m00, m01, m02] and [m10, m11, m12]. SVG's matrix()
    parameters are ordered [a, b, c, d, e, f].
    """
    a, b, c = matrix[0]
    d, e, f = matrix[1]
    determinant = a * e - b * d
    if math.isclose(determinant, 0.0, abs_tol=1e-15):
        raise ValueError("gradient transform is not invertible")

    # Inverse in row form: [x'; y'] = inverse([x; y]).
    row00 = e / determinant
    row01 = -b / determinant
    row02 = (b * f - e * c) / determinant
    row10 = -d / determinant
    row11 = a / determinant
    row12 = (d * c - a * f) / determinant

    # SVG matrix(a b c d e f) maps x'=a*x+c*y+e, y'=b*x+d*y+f.
    return row00, row10, row01, row11, row02, row12


def svg_matrix(matrix: list[list[float]]) -> str:
    return "matrix(" + " ".join(number(value) for value in inverse_affine(matrix)) + ")"


def color(palette: dict[str, str], token: str) -> str:
    try:
        return palette[token]
    except KeyError as exc:
        raise ValueError(f"unknown palette token: {token}") from exc


def stop_xml(stop: dict[str, Any], palette: dict[str, str], alpha: float | None = None) -> str:
    stop_alpha = stop["alpha"] if alpha is None else alpha
    return (
        f'      <stop offset="{number(stop["position"])}" '
        f'stop-color="{escape(color(palette, stop["colorToken"]))}" '
        f'stop-opacity="{number(stop_alpha)}"/>\n'
    )


def gradient_xml(
    gradient_id: str,
    paint: dict[str, Any],
    palette: dict[str, str],
    *,
    kind: str,
    haze_middle_alpha: float | None = None,
) -> str:
    transform = svg_matrix(paint["transform"])
    stops = []
    for index, stop in enumerate(paint["stops"]):
        alpha = haze_middle_alpha if index == 1 and haze_middle_alpha is not None else None
        stops.append(stop_xml(stop, palette, alpha))

    if kind == "radial":
        opening = (
            f'    <radialGradient id="{gradient_id}" gradientUnits="objectBoundingBox" '
            f'cx="0.5" cy="0.5" r="0.5" gradientTransform="{transform}">\n'
        )
    else:
        # Figma's canonical linear gradient is a horizontal unit line centered
        # at y=.5 in gradient space. The affine transform rotates it into the
        # documented haze band.
        opening = (
            f'    <linearGradient id="{gradient_id}" gradientUnits="objectBoundingBox" '
            f'x1="0" y1="0.5" x2="1" y2="0.5" '
            f'gradientTransform="{transform}">\n'
        )
    return opening + "".join(stops) + "    </" + ("radialGradient" if kind == "radial" else "linearGradient") + ">\n"


def render_svg(
    tokens: dict[str, Any], width: Decimal, height: Decimal, *, haze_middle_alpha: float | None = None
) -> str:
    geometry = tokens["geometry"]
    if geometry["horizonY"] != 0.5 or geometry["upperHeight"] != 0.5 or geometry["lowerHeight"] != 0.5:
        raise ValueError("renderer requires the canonical 50/50 geometry tokens")

    palette = tokens["palette"]
    haze = tokens["sea"]["haze"]
    small_override = haze.get("small320SourceOverride", {}).get("middleStopAlpha")
    if haze_middle_alpha is None:
        haze_middle_alpha = (
            small_override
            if width == 320 and height == 320 and small_override is not None
            else haze["stops"][1]["alpha"]
        )

    half_height = height / Decimal(2)
    width_text = number(width)
    height_text = number(height)
    half_text = number(half_height)
    haze_alpha_text = number(haze_middle_alpha)

    sky = gradient_xml("sky", tokens["sky"], palette, kind="radial")
    base = gradient_xml("sea-base", tokens["sea"]["base"], palette, kind="radial")
    haze = gradient_xml(
        "sea-haze", tokens["sea"]["haze"], palette, kind="linear", haze_middle_alpha=haze_middle_alpha
    )
    glow = gradient_xml("sea-glow", tokens["sea"]["glow"], palette, kind="radial")
    sky_opacity = number(tokens["sky"]["opacity"])
    base_opacity = number(tokens["sea"]["base"]["opacity"])
    haze_opacity = number(tokens["sea"]["haze"]["opacity"])
    glow_opacity = number(tokens["sea"]["glow"]["opacity"])

    # Keep the layer order explicit: sky, sea base, silver haze, teal glow.
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" '
        f'width="{width_text}" height="{height_text}" viewBox="0 0 {width_text} {height_text}">\n'
        '  <title>Palembang Graphic System</title>\n'
        f'  <desc>Canonical normalized SVG renderer; haze middle-stop alpha {haze_alpha_text}</desc>\n'
        '  <defs>\n'
        + sky
        + base
        + haze
        + glow
        + '  </defs>\n'
        f'  <rect id="sky-field" x="0" y="0" width="{width_text}" height="{half_text}" '
        f'fill="url(#sky)" opacity="{sky_opacity}"/>\n'
        f'  <rect id="sea-base-field" x="0" y="{half_text}" width="{width_text}" height="{half_text}" '
        f'fill="url(#sea-base)" opacity="{base_opacity}"/>\n'
        f'  <rect id="sea-haze-field" x="0" y="{half_text}" width="{width_text}" height="{half_text}" '
        f'fill="url(#sea-haze)" opacity="{haze_opacity}"/>\n'
        f'  <rect id="sea-glow-field" x="0" y="{half_text}" width="{width_text}" height="{half_text}" '
        f'fill="url(#sea-glow)" opacity="{glow_opacity}"/>\n'
        '</svg>\n'
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--width", required=True, type=lambda raw: parse_dimension(raw, "width"))
    parser.add_argument("--height", required=True, type=lambda raw: parse_dimension(raw, "height"))
    parser.add_argument("--output", required=True, type=Path, help="destination SVG path")
    parser.add_argument(
        "--haze-middle-alpha",
        type=float,
        choices=(0.8, 1.0),
        help="override the canonical haze middle-stop alpha (default: 1.0 only for 320x320, otherwise token value)",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    tokens = json.loads(TOKENS_PATH.read_text(encoding="utf-8"))
    output = render_svg(tokens, args.width, args.height, haze_middle_alpha=args.haze_middle_alpha)
    args.output.write_text(output, encoding="utf-8", newline="\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
