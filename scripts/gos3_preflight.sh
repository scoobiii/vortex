#!/usr/bin/env bash
set -euo pipefail

INSTALL=0
if [[ "${1:-}" == "--install" ]]; then
  INSTALL=1
fi

failures=0
require_cmd() {
  if command -v "$1" >/dev/null 2>&1; then
    printf '[OK] command: %s (%s)\n' "$1" "$(command -v "$1")"
  else
    printf '[MISSING] command: %s\n' "$1"
    failures=$((failures + 1))
  fi
}

printf '%s\n' '== Vortex environment preflight =='
require_cmd git
require_cmd python3
require_cmd node
require_cmd npm

if command -v python3 >/dev/null 2>&1; then
  python3 - <<'PY'
import sys
required = (3, 10)
if sys.version_info < required:
    print(f"[MISSING] Python >= {required[0]}.{required[1]} required; found {sys.version.split()[0]}")
    raise SystemExit(1)
print(f"[OK] python: {sys.version.split()[0]}")
PY
fi

if command -v node >/dev/null 2>&1; then
  node --version
fi
if command -v npm >/dev/null 2>&1; then
  npm --version
fi

if [[ -f requirements-gos3.txt ]]; then
  if python3 -c 'import cryptography' >/dev/null 2>&1; then
    printf '%s\n' '[OK] Python dependency: cryptography'
  elif [[ "$INSTALL" == 1 ]]; then
    printf '%s\n' '[SETUP] Installing Python dependencies from requirements-gos3.txt'
    python3 -m pip install --user -r requirements-gos3.txt
  else
    printf '%s\n' '[MISSING] Python dependency: cryptography (rerun with --install)'
    failures=$((failures + 1))
  fi
fi

if [[ -f package.json ]]; then
  if [[ -x node_modules/.bin/ts-node ]]; then
    printf '%s\n' '[OK] Node dependency: ts-node'
  elif [[ "$INSTALL" == 1 ]]; then
    printf '%s\n' '[SETUP] Installing Node dependencies from package.json'
    npm install --no-audit --no-fund
  else
    printf '%s\n' '[MISSING] Node dependencies (rerun with --install)'
    failures=$((failures + 1))
  fi
fi

if [[ "$failures" -ne 0 ]]; then
  printf '\nPreflight failed with %s issue(s). No module tests were started.\n' "$failures" >&2
  exit 2
fi

printf '%s\n' 'Preflight passed. Test execution may start.'
