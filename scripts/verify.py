#!/usr/bin/env python3
from __future__ import annotations

import hashlib
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "MANIFEST.sha256"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    failures = 0
    entries = []
    for raw in MANIFEST.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        digest, rel = line.split(None, 1)
        rel = rel.lstrip(" *")
        entries.append((digest, rel))

    for expected, rel in entries:
        path = ROOT / rel
        if not path.is_file():
            print(f"MISSING  {rel}")
            failures += 1
            continue
        actual = sha256(path)
        if actual == expected:
            print(f"OK       {rel}")
        else:
            print(f"MISMATCH {rel}")
            print(f"  expected: {expected}")
            print(f"  actual:   {actual}")
            failures += 1

    if failures:
        print(f"\nVerification failed: {failures} file(s).", file=sys.stderr)
        return 1

    print(f"\nVerified {len(entries)} preserved file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
