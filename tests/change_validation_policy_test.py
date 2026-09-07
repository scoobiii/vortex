# GOS3 · agente: GPT · papel: Maintainer / Engineering Agent
# fase: Technical Refinement → Governance Enforcement · data: 2026-09-05
# antes: a regra de validar mudanças de CI antes da publicação existia apenas como prática.
# depois: o CI verifica que a política institucional e os gates essenciais continuam presentes.
# base: commit `main`
# assinatura: GPT · Maintainer / Engineering Agent · GOS3

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAYBOOK = ROOT / "docs" / "PLAYBOOK.md"
WORKFLOW = ROOT / ".github" / "workflows" / "gos3-compliance.yml"


def require(text: str, needle: str, source: Path) -> None:
    if needle not in text:
        raise AssertionError(f"missing required governance invariant in {source}: {needle}")


playbook = PLAYBOOK.read_text(encoding="utf-8")
workflow = WORKFLOW.read_text(encoding="utf-8")

require(playbook, "Mexeu → Testa → Valida → Publica", PLAYBOOK)
require(playbook, "Toda mudança em workflow deve passar pelo CI online antes do merge.", PLAYBOOK)
require(playbook, "Todo check exigido pela proteção de `main` deve terminar `success` no PR antes do merge.", PLAYBOOK)
require(playbook, "estado é **não verificado**", PLAYBOOK)

require(workflow, "check-headers:", WORKFLOW)
require(workflow, "contract-gate:", WORKFLOW)

print("change-validation policy: PASS")
