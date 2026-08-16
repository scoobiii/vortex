> **GOS3** · agente: `Claude` · papel: `Arquiteto/Tech Writer` (ver docs/team.md)
> fase: `Technical Refinement (E2)` · data: `2026-08-16`
> antes: v0.1 do contrato já implementado e testado (19/19) em specs/invocation-contract.md
> depois: proposta v0.2 recebida via origin/main reclassificada como draft — shape incompatível, ver seção final
> base: commit `f6d4db7` (origin/main) partindo de `24b4a6a` (ancestral comum)
> convenção: ver docs/PLAYBOOK.md § Cabeçalho GOS3

# Proposta: invocation-contract v0.2 (rascunho, não implementado)

> Origem: recebido via `origin/main` (commit `f6d4db7`, "Create invocation-contract.md"),
> autor original Claude (Arquiteto / Tech Writer, ver `docs/team.md`).
> Reclassificado como proposta em vez de spec ativa porque o shape abaixo
> **quebra compatibilidade** com o contrato v0.1 já implementado e testado
> (`specs/invocation-contract.md`, adaptador Grok, 19/19 testes).
> Ver seção "Diferenças que bloqueiam merge direto" no final.

Status: **Technical Refinement** (E2 do backlog). Não implementado — só especificação.

Escopo: define o formato mínimo de input/output que qualquer adaptador `src/agents/<agente>/` deve respeitar para que uma invocação Nx1 (execução isolada) seja auditável e comparável entre os 7 agentes do GOS3, sem exigir runtime compartilhado.

## Princípio

O contrato não roda código nem abre sandbox de ninguém. Ele padroniza **o que entra** e **o que sai** de uma invocação — cada agente continua executando no seu próprio runtime isolado (Nx1). Isso resolve o problema original ("cara de bunda" na conversa): a saída declara o que foi de fato executado, em formato verificável, em vez de texto solto.

## Request

```json
{
  "contract_version": "0.2",
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
  "context_ref": "string opcional — referência ao item do backlog/handoff que originou a invocação (NxN)"
}
```

## Response

```json
{
  "contract_version": "0.2",
  "invocation_id": "uuid-v4 — mesmo da request",
  "agent": "mesmo campo do request",
  "status": "success | error | partial | timeout",
  "executed": "bool — true só se código/comando de fato rodou no runtime do agente",
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
2. `invocation_id` do response deve ecoar o do request — permite correlação em log e no `docs/handoff.md`.
3. Nenhum campo do contrato exige acesso a runtime de outro agente. Um adaptador que não consiga cumprir isso (ex: provedor não expõe API programática de execução) declara isso em `docs/gotchas.md`, não quebra o contrato.
4. `payload` é opaco ao contrato — o contrato não interpreta código, só envelopa input/output.

## Em aberto (não decidido — não travar Sprint 1 por isso)

- Formato de erro estruturado (`error.code`, `error.message`) — hoje só texto livre em `stderr`.
- Se `context_ref` deve ser obrigatório (rastreabilidade) ou opcional (fricção menor pra adotar).
- Assinatura/hash do output para auditoria — depende de decisão de segurança ainda não tomada (ver ameaça 1 do SWOT: prompt injection via output voltando pro contexto).
- **Novo, adicionado nesta reclassificação:** o v0.1 implementado usa `context.dry_run` como campo central (2 dos 7 casos de teste do adaptador Grok dependem dele). O v0.2 não tem equivalente — precisa decidir se `dry_run` vira parte de `task` ou `limits`, ou se `status: partial`/`timeout` já cobre o caso de uso sem precisar do flag explícito.

## Próximo passo

Cada agente do GOS3 implementa um adaptador de referência em `src/agents/<agente>/` que aceita este request e devolve este response, rodando **no seu próprio runtime**. Ver `docs/BACKLOG.md` → E2 e E3.

## Diferenças que bloqueiam merge direto com v0.1 (adicionado nesta reclassificação)

| Campo | v0.1 (implementado) | v0.2 (esta proposta) |
|---|---|---|
| Payload | `action` + `payload` (flat) | `task.kind` + `task.payload` + `task.language` |
| Limites | `context.timeout_ms` | `limits.timeout_seconds` + `limits.max_output_bytes` |
| dry_run | `context.dry_run` (usado em 2 testes) | ausente |
| Resultado | `result` + `error` + `logs[]` | `status` + `output.{stdout,stderr,exit_code}` + `truncated` |

Adotar v0.2 como está exige reescrever `contract.ts`, `handler.ts`, `index.ts`, `types.ts` e `contract.test.ts` do adaptador Grok — não é extensão aditiva, é troca de shape. Decisão para o PO-humano antes de qualquer implementação (regra do projeto: mudança em contrato/segurança nunca é merge automático).

---

**scoobiii/vortex** · GOS3 · autor original: Claude (Arquiteto / Tech Writer, ver `docs/team.md`)
