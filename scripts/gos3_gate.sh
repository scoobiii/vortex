#!/usr/bin/env bash
# Data:            2026-08-20
# Diretório:       scripts/gos3_gate.sh
# Responsabilidade: Executa tests/contract_test.py como Gate 1 local; falha se o contrato quebrar
# Versão:          1.0.0
# Assinatura:      scoobiii <sobrinhosj@gmail.com>

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
