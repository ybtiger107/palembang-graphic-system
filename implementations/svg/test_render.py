#!/usr/bin/env python3
"""Focused structural checks for the SVG reference renderer."""

from __future__ import annotations

import sys
import unittest
import xml.etree.ElementTree as ET
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from render import TOKENS_PATH, render_svg  # noqa: E402


SVG_NS = "{http://www.w3.org/2000/svg}"


class RendererTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        import json

        cls.tokens = json.loads(TOKENS_PATH.read_text(encoding="utf-8"))

    def test_dimensions_and_horizon(self) -> None:
        root = ET.fromstring(render_svg(self.tokens, Decimal("2560"), Decimal("1080")))
        self.assertEqual(root.attrib["width"], "2560")
        self.assertEqual(root.attrib["height"], "1080")
        self.assertEqual(root.attrib["viewBox"], "0 0 2560 1080")
        fields = {node.attrib["id"]: node.attrib for node in root if node.tag == SVG_NS + "rect"}
        self.assertEqual(fields["sky-field"]["height"], "540")
        self.assertEqual(fields["sea-base-field"]["y"], "540")
        self.assertEqual(fields["sea-base-field"]["height"], "540")
        self.assertEqual(fields["sea-haze-field"]["opacity"], "0.44999998807907104")
        self.assertEqual(fields["sea-glow-field"]["opacity"], "0.6000000238418579")

    def test_gradient_structure_and_token_transforms(self) -> None:
        root = ET.fromstring(render_svg(self.tokens, Decimal("320"), Decimal("320")))
        gradients = {node.attrib["id"]: node for node in root.iter() if node.tag.endswith("Gradient")}
        self.assertEqual(set(gradients), {"sky", "sea-base", "sea-haze", "sea-glow"})
        self.assertEqual(gradients["sea-haze"][0].attrib["stop-opacity"], "0")
        self.assertEqual(gradients["sea-haze"][1].attrib["stop-opacity"], "1")
        self.assertIn("matrix(", gradients["sky"].attrib["gradientTransform"])

        wide = ET.fromstring(render_svg(self.tokens, Decimal("2560"), Decimal("1080")))
        wide_gradients = {node.attrib["id"]: node for node in wide.iter() if node.tag.endswith("Gradient")}
        self.assertEqual(wide_gradients["sea-haze"][1].attrib["stop-opacity"], "0.800000011920929")

        rect_ids = [node.attrib["id"] for node in root if node.tag == SVG_NS + "rect"]
        self.assertEqual(rect_ids, ["sky-field", "sea-base-field", "sea-haze-field", "sea-glow-field"])

    def test_deterministic_and_arbitrary_size(self) -> None:
        first = render_svg(self.tokens, Decimal("777"), Decimal("333"))
        second = render_svg(self.tokens, Decimal("777"), Decimal("333"))
        self.assertEqual(first, second)
        self.assertIn('viewBox="0 0 777 333"', first)
        self.assertIn('y="166.5"', first)


if __name__ == "__main__":
    unittest.main()
