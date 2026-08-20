#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
FAIL=0
echo "=== GOS3 Gate Runner ==="
if [ -f tests/contract_test.py ]; then
  python3 tests/contract_test.py || FAIL=1
else
  echo "MISSING tests/contract_test.py"
  FAIL=1
fi
if [ "$FAIL" -ne 0 ]; then
  echo "FAIL"
  exit 1
fi
echo "PASS local Gate 1"
