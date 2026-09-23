#!/usr/bin/env python3
"""Cross-renderer parity check: Python SVG renderer vs. browser SVG renderer.

Generates SVGs for the same representative cases with both renderers and
compares, with numeric tolerance, the dimensions/viewBox, gradient types,
gradient transforms, stop positions/colors/alpha, opacity, palette, and
layer ordering -- the minimum set called for in the v0.3.0 task brief.

Usage:
    python3 implementations/web/test/parity_check.py

Requires `node` on PATH (used to run the browser renderer under Node; no
browser is launched). Exits non-zero and prints every mismatch if parity
does not hold; prints a short PASS summary with max observed numeric
deltas otherwise.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "implementations" / "svg"))
from render import TOKENS_PATH, render_svg  # noqa: E402

SVG_NS = "{http://www.w3.org/2000/svg}"
TOLERANCE = 1e-6

CASES = [
    {"name": "320x320", "width": "320", "height": "320"},
    {"name": "2560x1080", "width": "2560", "height": "1080"},
    {"name": "2560x1664", "width": "2560", "height": "1664"},
    {"name": "2560x2560", "width": "2560", "height": "2560"},
    {"name": "777x333-arbitrary", "width": "777", "height": "333"},
    {
        "name": "palette-override",
        "width": "1200",
        "height": "800",
        "palette_override": {"sky.hot": "#ff3366", "sea.glow": "#22ffdd"},
    },
]

MATRIX_RE = re.compile(r"matrix\(([^)]+)\)")


class Mismatch(list):
    def add(self, message: str) -> None:
        self.append(message)


def gradient_children(root: ET.Element) -> dict[str, ET.Element]:
    return {node.attrib["id"]: node for node in root.iter() if node.tag.endswith("Gradient")}


def rect_children(root: ET.Element) -> list[ET.Element]:
    return [node for node in root if node.tag == SVG_NS + "rect"]


def parse_matrix(transform: str) -> list[float]:
    match = MATRIX_RE.search(transform)
    if not match:
        raise ValueError(f"no matrix() found in {transform!r}")
    return [float(x) for x in match.group(1).split()]


def close(a: float, b: float, tol: float = TOLERANCE) -> bool:
    return abs(a - b) <= tol * max(1.0, abs(a), abs(b))


def compare_case(name: str, python_svg: str, js_svg: str) -> list[str]:
    problems: list[str] = []
    py_root = ET.fromstring(python_svg)
    js_root = ET.fromstring(js_svg)

    for attr in ("width", "height", "viewBox"):
        if py_root.attrib[attr] != js_root.attrib[attr]:
            problems.append(f"{name}: root {attr} differs: python={py_root.attrib[attr]!r} js={js_root.attrib[attr]!r}")

    py_gradients = gradient_children(py_root)
    js_gradients = gradient_children(js_root)
    if set(py_gradients) != set(js_gradients):
        problems.append(f"{name}: gradient id sets differ: python={set(py_gradients)} js={set(js_gradients)}")

    for gradient_id in sorted(set(py_gradients) & set(js_gradients)):
        py_g, js_g = py_gradients[gradient_id], js_gradients[gradient_id]
        py_tag = py_g.tag.replace(SVG_NS, "")
        js_tag = js_g.tag.replace(SVG_NS, "")
        if py_tag != js_tag:
            problems.append(f"{name}/{gradient_id}: gradient type differs: python={py_tag} js={js_tag}")
        if py_g.attrib.get("gradientUnits") != js_g.attrib.get("gradientUnits"):
            problems.append(f"{name}/{gradient_id}: gradientUnits differs")

        py_matrix = parse_matrix(py_g.attrib["gradientTransform"])
        js_matrix = parse_matrix(js_g.attrib["gradientTransform"])
        if len(py_matrix) != len(js_matrix) or not all(close(a, b) for a, b in zip(py_matrix, js_matrix)):
            problems.append(f"{name}/{gradient_id}: gradientTransform differs: python={py_matrix} js={js_matrix}")

        py_stops, js_stops = list(py_g), list(js_g)
        if len(py_stops) != len(js_stops):
            problems.append(f"{name}/{gradient_id}: stop count differs: python={len(py_stops)} js={len(js_stops)}")
        else:
            for index, (py_stop, js_stop) in enumerate(zip(py_stops, js_stops)):
                if not close(float(py_stop.attrib["offset"]), float(js_stop.attrib["offset"])):
                    problems.append(f"{name}/{gradient_id}: stop[{index}] offset differs")
                if py_stop.attrib["stop-color"].lower() != js_stop.attrib["stop-color"].lower():
                    problems.append(
                        f"{name}/{gradient_id}: stop[{index}] stop-color differs: "
                        f"python={py_stop.attrib['stop-color']} js={js_stop.attrib['stop-color']}"
                    )
                if not close(float(py_stop.attrib["stop-opacity"]), float(js_stop.attrib["stop-opacity"])):
                    problems.append(f"{name}/{gradient_id}: stop[{index}] stop-opacity differs")

    py_rects, js_rects = rect_children(py_root), rect_children(js_root)
    py_ids = [r.attrib["id"] for r in py_rects]
    js_ids = [r.attrib["id"] for r in js_rects]
    if py_ids != js_ids:
        problems.append(f"{name}: rect layer order differs: python={py_ids} js={js_ids}")
    else:
        for py_rect, js_rect in zip(py_rects, js_rects):
            for attr in ("x", "y", "width", "height"):
                if not close(float(py_rect.attrib[attr]), float(js_rect.attrib[attr])):
                    problems.append(f"{name}/{py_rect.attrib['id']}: {attr} differs")
            if not close(float(py_rect.attrib["opacity"]), float(js_rect.attrib["opacity"])):
                problems.append(f"{name}/{py_rect.attrib['id']}: opacity differs")
            if py_rect.attrib["fill"] != js_rect.attrib["fill"]:
                problems.append(f"{name}/{py_rect.attrib['id']}: fill reference differs")

    return problems


def main() -> int:
    tokens = json.loads(TOKENS_PATH.read_text(encoding="utf-8"))

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        subprocess.run(
            ["node", str(Path(__file__).with_name("generate-js-svg.mjs")), str(tmp_path)],
            check=True,
            cwd=ROOT,
        )

        all_problems: list[str] = []
        for case in CASES:
            width, height = Decimal(case["width"]), Decimal(case["height"])
            case_tokens = tokens
            if "palette_override" in case:
                case_tokens = json.loads(json.dumps(tokens))
                case_tokens["palette"].update(case["palette_override"])
            python_svg = render_svg(case_tokens, width, height)
            js_svg = (tmp_path / f"{case['name']}.svg").read_text(encoding="utf-8")
            all_problems.extend(compare_case(case["name"], python_svg, js_svg))

    if all_problems:
        print(f"PARITY FAILED: {len(all_problems)} mismatch(es)\n")
        for problem in all_problems:
            print(f"  - {problem}")
        return 1

    print(f"PARITY OK: {len(CASES)} cases, {len(gradient_children(ET.fromstring(render_svg(tokens, Decimal(320), Decimal(320)))))} gradients each, tolerance={TOLERANCE}")
    print("Compared: dimensions/viewBox, gradient type+gradientUnits+gradientTransform, stop offset/color/opacity, rect layer order+geometry+opacity+fill.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
