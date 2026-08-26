#!/usr/bin/env python3
# GOS3 · agent: GPT · role: Maintainer / Engineering Agent
# Regression guard: the public audit command must remain declared in package.json.

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
scripts = data.get("scripts", {})
assert scripts.get("gos3:audit") == "python3 tests/gos3-audit.py", "gos3:audit script missing or changed"
assert (ROOT / "tests" / "gos3-audit.py").is_file(), "audit implementation missing"
print("PASS: gos3:audit is declared and its implementation exists")
