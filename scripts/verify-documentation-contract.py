#!/usr/bin/env python3
# GOS3
# arquivo: scripts/verify-documentation-contract.py
# responsabilidade: bloquear regressões de documentação, responsabilidade e assets canônicos
# agente: agent/llm
# papel: Engineering Agent
# fase: documentation integrity
# data: 2026-09-29
# assinatura: GOS3 Maintainer / Engineering Agent · GOS3

from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
BASE_SHA = os.environ.get("BASE_SHA", "").strip()
README = REPO / "README.md"
COVER = REPO / "docs/images/use-vortex-cover.png"
COVER_REF = "docs/images/use-vortex-cover.png"

def fail(message: str) -> None:
    print(f"::error::{message}")
    raise SystemExit(1)

def git(*args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=REPO,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        fail(f"git {' '.join(args)} failed: {result.stderr.strip()}")
    return result.stdout

def responsibility(text: str) -> str | None:
    match = re.search(r"^# responsabilidade:\s*(.+?)\s*$", text, re.MULTILINE | re.IGNORECASE)
    return match.group(1).strip() if match else None

def changed_files() -> list[str]:
    if not BASE_SHA:
        fail("BASE_SHA is required for BASE→PR documentation regression testing")
    output = git("diff", "--name-only", f"{BASE_SHA}...HEAD")
    return [line.strip() for line in output.splitlines() if line.strip()]

def base_file(path: str) -> str | None:
    result = subprocess.run(
        ["git", "show", f"{BASE_SHA}:{path}"],
        cwd=REPO,
        text=True,
        capture_output=True,
        check=False,
    )
    return result.stdout if result.returncode == 0 else None

def main() -> int:
    if not README.is_file():
        fail("README.md is missing")

    readme = README.read_text(encoding="utf-8", errors="replace")

    # 1. Canonical GOS3 responsibility is mandatory.
    current_resp = responsibility(readme)
    expected_resp = "documentação canônica do Vortex"
    if current_resp != expected_resp:
        fail(
            f"README GOS3 responsibility mismatch: expected '{expected_resp}', "
            f"got '{current_resp}'"
        )
    print("PASS: README GOS3 responsibility is canonical")

    # 2. Canonical visual asset must exist and remain referenced.
    if not COVER.is_file():
        fail(f"required README asset missing: {COVER_REF}")
    if COVER_REF not in readme:
        fail(f"README no longer references required asset: {COVER_REF}")
    print("PASS: canonical Vortex cover exists and is referenced")

    # 3. BASE→PR contract: a GOS3 responsibility cannot silently change.
    changed = changed_files()
    responsibility_changes = []
    for path in changed:
        if not path.endswith((".md", ".py", ".ts", ".tsx", ".js", ".jsx", ".yml", ".yaml", ".json", ".sh")):
            continue
        current_path = REPO / path
        if not current_path.is_file():
            continue
        current_text = current_path.read_text(encoding="utf-8", errors="replace")
        current = responsibility(current_text)
        if current is None:
            continue
        previous_text = base_file(path)
        if previous_text is None:
            continue
        previous = responsibility(previous_text)
        if previous is not None and previous != current:
            responsibility_changes.append(
                f"{path}: '{previous}' -> '{current}'"
            )

    if responsibility_changes:
        for change in responsibility_changes:
            print(f"::error::GOS3 responsibility changed without contract update: {change}")
        raise SystemExit(1)

    print("PASS: no silent GOS3 responsibility changes in BASE→PR diff")
    print("documentation-integrity: PASS")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
