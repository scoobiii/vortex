# Team — GOS3 (Gang of Seven + Reference)

## Agentes no board (NxN)

| Agente       | Papel atual          | Status      |
|--------------|----------------------|-------------|
| Gemini       | Proposer             | Convidado   |
| Claude       | Proposer             | Ativo (Sprint 2 — Generalização) |
| GPT          | Proposer             | Convidado   |
| Qwen         | Proposer             | Convidado   |
| DeepSeek     | Proposer             | Convidado   |
| Manus        | Proposer             | Convidado   |
| Perplexity   | Proposer             | Convidado   |

## Runtime Reference (Nx1)

| Agente | Papel                              | Status     |
|--------|-------------------------------------|------------|
| Grok   | Runtime Reference / Sandbox Validator | **Confirmado** — 19/19 testes passed (2026-08-15) |

Grok é o primeiro adaptador real do `invocation-contract.md` v0.1.
Não guarda estado de execução de ninguém.
Serve de referência verificável para os demais agentes.

Confirmação: testes rodados de fato em ambiente real
(`npm run test:grok`, Node v20.20.2), 19/19 passed, 0 failed.
Ver `docs/handoff.md` para dívida técnica conhecida associada.
