#!/usr/bin/env python3
# GOS3 · agent: GPT · role: Maintainer / Engineering Agent
# Purpose: deterministic repository audit entrypoint used by `npm run gos3:audit`.

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    ROOT / "package.json",
    ROOT / "tests" / "contract_test.py",
    ROOT / "tests" / "runtime-loop.test.ts",
    ROOT / "src" / "agents" / "grok" / "tests" / "contract.test.ts",
]
COMMANDS = [
    ["npm", "run", "test:contract"],
    ["npm", "run", "test:runtime-loop"],
    ["npm", "run", "test:grok"],
]


def run(command: list[str]) -> int:
    print(f"[GOS3-AUDIT] {' '.join(command)}")
    result = subprocess.run(command, cwd=ROOT)
    return result.returncode


def main() -> int:
    package = ROOT / "package.json"
    try:
        data = json.loads(package.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"FAIL: cannot read package.json: {exc}")
        return 2

    scripts = data.get("scripts", {})
    missing = [name for name in ("test:contract", "test:runtime-loop", "test:grok", "test:gos3", "gos3:audit") if name not in scripts]
    missing_files = [str(path.relative_to(ROOT)) for path in REQUIRED if not path.is_file()]

    if missing:
        print("FAIL: missing npm scripts:", ", ".join(missing))
        return 2
    if missing_files:
        print("FAIL: missing required files:", ", ".join(missing_files))
        return 2

    for command in COMMANDS:
        if run(command) != 0:
            print("FAIL: GOS3 audit stopped at the failing gate above.")
            return 1

    print("PASS: GOS3 audit — contract, runtime-loop and Grok gates are green.")
    print("NOTE: executed:true is not treated as proof of an external side-effect.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
