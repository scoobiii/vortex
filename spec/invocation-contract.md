# Contrato de invocação — v0.1 (rascunho)

Status: **Technical Refinement** (E2 do backlog). Não implementado — só especificação.

Escopo: define o formato mínimo de input/output que qualquer adaptador `src/agents/<agente>/` deve respeitar para que uma invocação Nx1 (execução isolada) seja auditável e comparável entre os 7 agentes do GOS3, sem exigir runtime compartilhado.

## Princípio

O contrato não roda código nem abre sandbox de ninguém. Ele padroniza **o que entra** e **o que sai** de uma invocação — cada agente continua executando no seu próprio runtime isolado (Nx1). Isso resolve o problema original ("cara de bunda" na conversa): a saída declara o que foi de fato executado, em formato verificável, em vez de texto solto.

## Request

```json
{
  "contract_version": "0.1",
  "invocation_id": "uuid-v4",
  "agent": "claude | gemini | gpt | qwen | deepseek | manus | perplexity",
  "task": {
    "kind": "code_exec | shell | tool_call",
    "payload": "string — código, comando ou chamada de tool, opaco ao contrato",
    "language": "string opcional — ex: python, bash, node"
  },
  "limits": {
    "timeout_seconds": "int, obrigatório",
    "max_output_bytes": "int, obrigatório"
  },
  "context_ref": "string opcional — referência ao item do backlog/handoff que originou a invocação (NxN)",
  "env_tag": "browser-v8-isolate | node-linux | node-android-termux | unknown — obrigatório a partir da v0.2; declara o ambiente real de hospedagem do agente, não o que ele presume ser"
}
```

## Response

```json
{
  "contract_version": "0.1",
  "invocation_id": "uuid-v4 — mesmo da request",
  "agent": "mesmo campo do request",
  "status": "success | error | partial | timeout",
  "executed": "bool — true só se código/comando de fato rodou no runtime do agente",
  "evidence_hash": "string opcional se executed=false; OBRIGATÓRIO se executed=true — sha256 de (stdout+stderr+exit_code+duration_ms), hex lowercase",
  "output": {
    "stdout": "string, truncado em max_output_bytes",
    "stderr": "string, truncado em max_output_bytes",
    "exit_code": "int opcional"
  },
  "duration_ms": "int",
  "truncated": "bool — true se output excedeu max_output_bytes"
}
```

## Regras obrigatórias

1. `executed: false` é permitido (ex: o agente decidiu não rodar por segurança) mas **nunca pode vir acompanhado de `status: success`** — evita o caso de resposta especulada travestida de execução real.
2. **`executed: true` sem `evidence_hash` é uma resposta inválida** — rejeitada por `tests/contract_test.py`, não é "boa prática", é requisito de schema. `evidence_hash = sha256(stdout + stderr + str(exit_code) + str(duration_ms))`, hex lowercase, sem espaços entre os campos concatenados.
3. `invocation_id` do response deve ecoar o do request — permite correlação em log e no `docs/handoff.md`.
4. Nenhum campo do contrato exige acesso a runtime de outro agente. Um adaptador que não consiga cumprir isso (ex: provedor não expõe API programática de execução) declara isso em `docs/gotchas.md`, não quebra o contrato.
5. `payload` é opaco ao contrato — o contrato não interpreta código, só envelopa input/output.
6. **Regra de recusa pré-execução por `env_tag` (v0.2, motivada por INC-001 — ver `docs/incidents.md`):** se `env_tag == "browser-v8-isolate"`, o adaptador DEVE recusar (`status: "error"`, `executed: false`, `claim: "not_executed"`) qualquer `task.payload` que referencie `require(`, `process.`, `module.exports`, ou qualquer API de Node/SO — **antes** de tentar executar, não depois de capturar a exceção. Isso transforma "descobrimos o crash lendo o stdout" em "o gate recusa de antemão", coerente com o princípio Zero Simulação Oculta. Ver também `spec/gos3-system-instruction.md` seção 3.

## Em aberto (não decidido — não travar Sprint 1 por isso)

- Formato de erro estruturado (`error.code`, `error.message`) — hoje só texto livre em `stderr`.
- Se `context_ref` deve ser obrigatório (rastreabilidade) ou opcional (fricção menor pra adotar).
- Assinatura/hash do output para auditoria — depende de decisão de segurança ainda não tomada (ver ameaça 1 do SWOT: prompt injection via output voltando pro contexto).

## Próximo passo

Cada agente do GOS3 implementa um adaptador de referência em `src/agents/<agente>/` que aceita este request e devolve este response, rodando **no seu próprio runtime**. Ver `docs/BACKLOG.md` → E2 e E3.

---

**scoobiii/vortex** · GOS3 · autor: Claude (Arquiteto / Tech Writer, ver `docs/team.md`)
