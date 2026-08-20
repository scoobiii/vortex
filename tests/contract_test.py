#!/usr/bin/env python3
"""
contract_test.py — valida respostas contra spec/invocation-contract.md v0.1.

Sem dependências externas (só stdlib) — roda em qualquer CI sem setup.

Uso:
    python3 tests/contract_test.py                    # roda os casos fixture abaixo
    python3 tests/contract_test.py caminho/resp.json   # valida um response real

Saída: exit 0 se tudo válido, exit 1 e mensagem específica no primeiro erro.
Este script é o "teste que falha sem evidência" do Sprint Prova 3/3 — não é
smoke test, é o gate que rejeita a alegação `executed: true` desacompanhada
de `evidence_hash`.
"""
import hashlib
import json
import sys

REQUIRED_FIELDS = {"contract_version", "invocation_id", "agent", "status", "executed", "output", "duration_ms", "truncated"}
VALID_STATUS = {"success", "error", "partial", "timeout"}


def compute_evidence_hash(output: dict, duration_ms: int) -> str:
    stdout = output.get("stdout", "")
    stderr = output.get("stderr", "")
    exit_code = output.get("exit_code", "")
    payload = f"{stdout}{stderr}{exit_code}{duration_ms}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def validate(resp: dict) -> list[str]:
    """Retorna lista de violações. Lista vazia = válido."""
    errors = []

    missing = REQUIRED_FIELDS - resp.keys()
    if missing:
        errors.append(f"campos obrigatórios ausentes: {sorted(missing)}")
        return errors  # sem os campos base, não dá pra checar o resto

    if resp["status"] not in VALID_STATUS:
        errors.append(f"status inválido: {resp['status']!r} (esperado um de {VALID_STATUS})")

    if resp["executed"] is True and resp["status"] == "success":
        pass  # combinação válida
    elif resp["executed"] is False and resp["status"] == "success":
        errors.append("REGRA 1 violada: executed=false não pode vir com status=success")

    # REGRA 2 — o coração do Sprint Prova 3/3: executed=true exige evidence_hash real
    if resp["executed"] is True:
        evidence = resp.get("evidence_hash")
        if not evidence:
            errors.append("REGRA 2 violada: executed=true sem evidence_hash — resposta especulada, não execução real")
        else:
            expected = compute_evidence_hash(resp["output"], resp["duration_ms"])
            if evidence != expected:
                errors.append(f"REGRA 2 violada: evidence_hash não bate com sha256(stdout+stderr+exit_code+duration_ms). recebido={evidence[:16]}... esperado={expected[:16]}...")

    return errors


# --- fixtures: casos que o gate PRECISA pegar ---

def _fixture_valid_executed():
    output = {"stdout": "42\n", "stderr": "", "exit_code": 0}
    duration_ms = 12
    return {
        "contract_version": "0.1", "invocation_id": "abc-123", "agent": "claude",
        "status": "success", "executed": True,
        "evidence_hash": compute_evidence_hash(output, duration_ms),
        "output": output, "duration_ms": duration_ms, "truncated": False,
    }


def _fixture_valid_not_executed():
    return {
        "contract_version": "0.1", "invocation_id": "def-456", "agent": "gemini",
        "status": "error", "executed": False,
        "output": {"stdout": "", "stderr": "recusado por política de segurança"},
        "duration_ms": 3, "truncated": False,
    }


def _fixture_INVALID_executed_no_evidence():
    """Este é o caso que tem que FALHAR. Se passar, o gate está quebrado."""
    return {
        "contract_version": "0.1", "invocation_id": "ghi-789", "agent": "gpt",
        "status": "success", "executed": True,
        "output": {"stdout": "resultado plausível", "stderr": "", "exit_code": 0},
        "duration_ms": 8, "truncated": False,
    }


def _fixture_INVALID_forged_evidence():
    """Hash presente mas não bate com o output — evidência forjada/copiada de outra execução."""
    return {
        "contract_version": "0.1", "invocation_id": "jkl-012", "agent": "deepseek",
        "status": "success", "executed": True,
        "evidence_hash": "0" * 64,
        "output": {"stdout": "resultado", "stderr": "", "exit_code": 0},
        "duration_ms": 5, "truncated": False,
    }


def run_self_test():
    cases = [
        ("valid_executed", _fixture_valid_executed(), True),
        ("valid_not_executed", _fixture_valid_not_executed(), True),
        ("INVALID_executed_no_evidence", _fixture_INVALID_executed_no_evidence(), False),
        ("INVALID_forged_evidence", _fixture_INVALID_forged_evidence(), False),
    ]
    failures = 0
    for name, resp, should_pass in cases:
        errors = validate(resp)
        passed = len(errors) == 0
        ok = passed == should_pass
        status = "OK" if ok else "FALHOU"
        print(f"[{status}] {name}: {'válido' if passed else errors}")
        if not ok:
            failures += 1
    if failures:
        print(f"\n{failures} caso(s) de teste com comportamento errado do validador.")
        sys.exit(1)
    print("\nGate funcionando: aceita execução real, rejeita especulação e evidência forjada.")


def main():
    if len(sys.argv) > 1:
        with open(sys.argv[1], encoding="utf-8") as fh:
            resp = json.load(fh)
        errors = validate(resp)
        if errors:
            for e in errors:
                print(f"INVÁLIDO: {e}")
            sys.exit(1)
        print("VÁLIDO")
        return
    run_self_test()


if __name__ == "__main__":
    main()
