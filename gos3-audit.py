#!/usr/bin/env python3
# Data:            2026-08-20
# Diretório:       gos3-audit.py
# Responsabilidade: Audita repositório contra o framework GOS3/Vortex sem confiar em nota declarada.
# Versão:          1.0.0
# Assinatura:      scoobiii <sobrinhosj@gmail.com>

# -*- coding: utf-8 -*-
"""
GOS3 Auditor Genérico

Audita uma implementação independente contra o frame GOS3/Vortex sem confiar
na nota declarada pelo README, snapshot ou documentação do próprio alvo.

Modo estático:
  python3 gos3-auditor.py --repo /caminho/zAI --out audit-out

Com evidência executável explícita:
  python3 gos3-auditor.py --repo /caminho/zAI --out audit-out \
    --run-command 'python3 tests/contract_test.py'

O comando de execução é opt-in, executado sem shell e com timeout. O auditor
não faz commit, push, rede, instalação de dependências ou alteração no alvo.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shlex
import subprocess
import sys
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

TEXT_EXTENSIONS = {".md", ".markdown", ".txt", ".json", ".ts", ".tsx", ".js", ".jsx", ".py", ".yml", ".yaml", ".toml", ".sh"}
IGNORED_DIRS = {".git", "node_modules", "dist", "build", ".next", "__pycache__", ".venv", "venv"}
REQUIRED_DOC_HINTS = ("PLAYBOOK", "BACKLOG", "team", "invocation-contract")
GOS3_MARKERS = ("GOS3", "agente:", "fase:", "assinatura:")
CLAIM_PATTERNS = {
    "3/3": re.compile(r"(?:3\s*/\s*3|GOS3\s+VERIFIED|AAA)", re.I),
    "production": re.compile(r"\b(?:produção|production[- ]ready|production)\b", re.I),
    "real_execution": re.compile(r"(?:execução\s+real|executed\s*[:=]\s*true|100%\s*(?:real|verified))", re.I),
    "persistent": re.compile(r"(?:persistente|persistent|cross[- ]worker|escala)", re.I),
    "zero_simulation": re.compile(r"(?:zero\s+simulation|sem\s+simula|não\s+simula|no\s+simulation)", re.I),
}

@dataclass
class Check:
    id: str
    level: str
    name: str
    status: str  # pass, warn, fail, skip
    score: int  # 0..3
    detail: str
    evidence: list[str] = field(default_factory=list)

@dataclass
class CommandEvidence:
    command: str
    status: str
    exit_code: int | None
    duration_ms: int
    stdout: str
    stderr: str
    stdout_sha256: str
    stderr_sha256: str


def iter_files(repo: Path):
    for path in repo.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        if any(part in IGNORED_DIRS for part in path.parts):
            continue
        yield path


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def rel(repo: Path, path: Path) -> str:
    return str(path.relative_to(repo))


def find_named(repo: Path, names: tuple[str, ...]) -> list[str]:
    found = []
    for path in iter_files(repo):
        if path.name.lower() in {n.lower() for n in names}:
            found.append(rel(repo, path))
    return sorted(found)


def file_contains(repo: Path, pattern: str) -> list[str]:
    rx = re.compile(pattern, re.I)
    hits = []
    for path in iter_files(repo):
        text = read_text(path)
        if rx.search(text):
            hits.append(rel(repo, path))
    return sorted(hits)


def l1(repo: Path) -> list[Check]:
    checks: list[Check] = []
    docs = find_named(repo, ("PLAYBOOK.md", "BACKLOG.md", "team.md", "invocation-contract.md", "invocation-contract-v0.1.md"))
    missing = [hint for hint in REQUIRED_DOC_HINTS if not any(hint.lower() in p.lower() for p in docs)]
    checks.append(Check("L1-structure", "L1", "documentação estrutural", "pass" if len(docs) >= 3 else "fail", 3 if len(docs) >= 4 else (1 if docs else 0), f"{len(docs)} documentos estruturais encontrados", docs))

    header_files = []
    header_missing = []
    for path in iter_files(repo):
        text = read_text(path)
        if path.suffix.lower() in {".md", ".ts", ".tsx", ".py", ".yml", ".yaml"}:
            if "GOS3" in text[:1200]:
                header_files.append(rel(repo, path))
            elif path.name.lower() in {"readme.md", "playbook.md", "backlog.md", "contract.ts", "handler.ts", "index.ts"}:
                header_missing.append(rel(repo, path))
    score = 3 if header_files and not header_missing else (1 if header_files else 0)
    checks.append(Check("L1-headers", "L1", "headers GOS3", "pass" if score == 3 else "warn" if score else "fail", score, f"{len(header_files)} com marcador; {len(header_missing)} candidatos sem marcador", header_files[:30]))

    broken = []
    for path in iter_files(repo):
        text = read_text(path)
        if "<<<<<<<" in text or "SyntaxError" in text and path.suffix == ".py":
            broken.append(rel(repo, path))
    checks.append(Check("L1-integrity", "L1", "ausência de artefatos obviamente quebrados", "pass" if not broken else "fail", 3 if not broken else 0, "nenhum marcador de conflito/syntax error detectado" if not broken else "artefatos suspeitos encontrados", broken))

    return checks


def l2(repo: Path) -> list[Check]:
    checks: list[Check] = []
    contract_hits = file_contains(repo, r"invocation[_ -]?id|executed|evidence[_ -]?hash|duration[_ -]?ms")
    checks.append(Check("L2-contract", "L2", "campos contratuais detectáveis", "pass" if contract_hits else "fail", 3 if contract_hits else 0, f"{len(contract_hits)} arquivos citam campos do contrato", contract_hits[:30]))

    validator_hits = file_contains(repo, r"validate(?:Response|Contract)|evidence[_ -]?hash|sha256|hashlib\.sha256")
    checks.append(Check("L2-validator", "L2", "validador de evidência", "pass" if validator_hits else "warn", 3 if validator_hits else 1, f"{len(validator_hits)} arquivos contêm validação/hash", validator_hits[:30]))

    simulated_hits = file_contains(repo, r"simulate|simulated|fallback|fixture|mock|deterministic")
    checks.append(Check("L2-simulation", "L2", "fallbacks e simulações identificáveis", "warn" if simulated_hits else "pass", 2 if simulated_hits else 3, "fallback/simulação identificável; não é falha por si só" if simulated_hits else "nenhuma referência detectada", simulated_hits[:30]))

    executed_hits = file_contains(repo, r"executed\s*[:=]\s*true")
    evidence_hits = file_contains(repo, r"evidence[_ -]?hash|execution[_ -]?evidence|receipt")
    score = 3 if executed_hits and evidence_hits else (1 if executed_hits else 0)
    checks.append(Check("L2-executed-evidence", "L2", "consistência aparente entre executed e evidência", "pass" if score == 3 else "warn" if score else "fail", score, f"executed=true em {len(executed_hits)} arquivos; evidência em {len(evidence_hits)}", (executed_hits + evidence_hits)[:30]))
    return checks


def run_command(repo: Path, command: str, timeout: int) -> CommandEvidence:
    argv = shlex.split(command)
    started = time.monotonic()
    try:
        proc = subprocess.run(argv, cwd=repo, capture_output=True, text=True, timeout=timeout, check=False, env=None)
        status = "pass" if proc.returncode == 0 else "fail"
        code = proc.returncode
        stdout, stderr = proc.stdout[-12000:], proc.stderr[-12000:]
    except subprocess.TimeoutExpired as exc:
        status, code = "fail", None
        stdout = (exc.stdout or "")[-12000:] if isinstance(exc.stdout, str) else ""
        stderr = ((exc.stderr or "")[-12000:] if isinstance(exc.stderr, str) else "") + "\nTIMEOUT"
    except OSError as exc:
        status, code, stdout, stderr = "fail", None, "", str(exc)
    duration = int((time.monotonic() - started) * 1000)
    return CommandEvidence(command, status, code, duration, stdout, stderr, hashlib.sha256(stdout.encode()).hexdigest(), hashlib.sha256(stderr.encode()).hexdigest())


def l3(repo: Path, command: str | None, timeout: int) -> tuple[list[Check], list[CommandEvidence]]:
    checks: list[Check] = []
    evidences: list[CommandEvidence] = []
    if not command:
        return [Check("L3-not-run", "L3", "execução controlada", "skip", 0, "nenhum comando fornecido; L3 não pode ser inferido estaticamente", [])], evidences
    evidence = run_command(repo, command, timeout)
    evidences.append(evidence)
    checks.append(Check("L3-command", "L3", "comando de teste executável", evidence.status, 3 if evidence.status == "pass" else 0, f"exit_code={evidence.exit_code}, duração={evidence.duration_ms}ms", [command, evidence.stdout_sha256, evidence.stderr_sha256]))
    observable = bool(evidence.stdout.strip()) and evidence.exit_code == 0
    checks.append(Check("L3-observable", "L3", "resultado observável", "pass" if observable else "fail", 3 if observable else 0, "stdout e exit code observáveis" if observable else "stdout vazio ou exit code não-zero", [evidence.stdout_sha256]))
    return checks, evidences


def l4(repo: Path, checks: list[Check], evidences: list[CommandEvidence]) -> list[Check]:
    checks_out: list[Check] = []
    docs = []
    for path in iter_files(repo):
        if path.suffix.lower() in {".md", ".txt"}:
            docs.append((rel(repo, path), read_text(path)))
    claims = []
    for label, pattern in CLAIM_PATTERNS.items():
        files = [name for name, text in docs if pattern.search(text)]
        if files:
            claims.append((label, files))
    claim_labels = [x[0] for x in claims]
    has_l3_pass = any(c.level == "L3" and c.status == "pass" for c in checks) and bool(evidences)
    unsupported = [label for label in claim_labels if label in {"3/3", "production", "real_execution", "persistent"} and not has_l3_pass]
    score = 3 if not unsupported else 1
    detail = "claims compatíveis com a evidência coletada" if not unsupported else "claims fortes sem L3 executável correspondente: " + ", ".join(unsupported)
    checks_out.append(Check("L4-claims", "L4", "claims versus evidência independente", "pass" if score == 3 else "warn", score, detail, [f"{label}: {len(files)} arquivo(s)" for label, files in claims]))
    return checks_out


def level_score(checks: list[Check], level: str) -> float:
    selected = [c for c in checks if c.level == level]
    return round(sum(c.score for c in selected) / len(selected), 2) if selected else 0.0


def render_markdown(result: dict[str, Any]) -> str:
    scores = result["scores"]
    lines = ["# GOS3 AUDIT — relatório independente", "", f"**Alvo:** `{result['repo']}`", f"**Gerado em:** {result['generated_at']}", "", "> A nota abaixo foi calculada pelo auditor. Não foi lida do README, snapshot ou claim do alvo.", "", "## Resultado", "", "| Nível | Score | Estado |", "|---|---:|---|"]
    for level in ("L1", "L2", "L3", "L4"):
        lines.append(f"| {level} | {scores[level]:.2f}/3 | {'PASS' if scores[level] >= 2.5 else 'PENDENTE'} |")
    lines += [f"| **FINAL** | **{scores['final']:.2f}/3** | **{'GOS3 VERIFIED' if result['seal'] else 'SELO NÃO CONCEDIDO'}** |", "", "## Checks", "", "| ID | Nível | Check | Status | Score | Detalhe |", "|---|---|---|---|---:|---|"]
    for c in result["checks"]:
        lines.append(f"| {c['id']} | {c['level']} | {c['name']} | {c['status']} | {c['score']} | {c['detail'].replace('|', '/')} |")
    lines += ["", "## Regra do selo", "", "O selo `GOS3 VERIFIED` exige L1, L2, L3 e L4 com score mínimo 2,5/3 e pelo menos uma evidência L3 executada com exit code zero e resultado observável. Um hash isolado não prova que a execução ocorreu.", ""]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Auditor independente GOS3 L1-L4")
    parser.add_argument("--repo", default=Path("."), type=Path, help="repositório a auditar; padrão: diretório atual")
    parser.add_argument("--out", default="gos3-audit-out", type=Path)
    parser.add_argument("--run-command", help="comando de teste opt-in; sem shell, ex.: 'python3 tests/contract_test.py'")
    parser.add_argument("--timeout", type=int, default=30)
    args = parser.parse_args()
    repo = args.repo.expanduser().resolve()
    if not repo.is_dir():
        raise SystemExit(f"diretório inexistente: {repo}")

    checks = l1(repo) + l2(repo)
    l3_checks, evidences = l3(repo, args.run_command, args.timeout)
    checks += l3_checks
    checks += l4(repo, checks, evidences)
    scores = {level: level_score(checks, level) for level in ("L1", "L2", "L3", "L4")}
    scores["final"] = round(sum(scores.values()) / 4, 2)
    seal = all(scores[level] >= 2.5 for level in ("L1", "L2", "L3", "L4")) and any(c.id == "L3-command" and c.status == "pass" for c in checks)
    result = {"schema": "gos3-audit-v1", "repo": str(repo), "generated_at": datetime.now(timezone.utc).isoformat(), "scores": scores, "seal": seal, "checks": [asdict(c) for c in checks], "execution_evidence": [asdict(e) for e in evidences]}
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "audit.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (args.out / "audit.md").write_text(render_markdown(result), encoding="utf-8")
    print(render_markdown(result))
    return 0 if seal else 2

if __name__ == "__main__":
    raise SystemExit(main())
