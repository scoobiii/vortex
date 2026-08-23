> **GOS3** · agente: `GPT-5.6 Luna` · papel: `Architecture / Integration Prompt`
> fase: `Technical Refinement — xAI Adapter`
> data: `2026-08-23`
> objetivo: preparar implementação do adaptador Vortex no `scoobiii/xAI` via GaiaStudio

# xAI → Vortex: engenharia de implementação para GaiaStudio

## Objetivo

Transformar o `scoobiii/xAI` em um **adapter/runtime reference Vortex**, sem transformar o xAI em fork do core Vortex.

O xAI continua responsável por agentes, conectores, UX e integração de modelos. O Vortex continua responsável pelo contrato de invocação verificável e pela separação **NxN estado / Nx1 execução**.

## Regra central

> **Autonomia real não é o agente afirmar que executou. É uma execução observável, com telemetria real e evidência verificável.**

Não classificar mock, simulação, resposta de LLM ou simples persistência como execução real.

## Contrato mínimo que o adapter deve produzir

```json
{
  "contract_version": "0.1",
  "invocation_id": "uuid",
  "agent": "xAI-agent",
  "status": "success",
  "executed": true,
  "output": {
    "stdout": "42\n",
    "stderr": "",
    "exit_code": 0
  },
  "duration_ms": 4,
  "evidence_hash": "sha256...",
  "runtime_id": "runtime-instance-id",
  "timestamp": "2026-08-23T00:00:00.000Z"
}
```

### Gates obrigatórios

1. `executed` é obrigatório.
2. `executed:false` **nunca** pode resultar em `status:"success"`.
3. `executed:true` exige `evidence_hash` calculado a partir da evidência real.
4. `duration_ms` deve ser medido pelo runtime, não inventado pelo modelo.
5. `stdout`, `stderr` e `exit_code` devem vir da execução real quando o runtime os suportar.
6. Timeout real deve resultar em estado de timeout/erro e nunca em sucesso fabricado.
7. `runtime_id` identifica o runtime que executou a invocação.
8. Um simulador (`PythonSim`, deterministic fallback etc.) deve ser explicitamente marcado como simulação e não pode emitir `executed:true` para satisfazer o contrato.
9. O adapter não deve expor Chain-of-Thought privado como requisito de auditoria. Auditar eventos, ferramentas, entradas/saídas permitidas, hashes e telemetria observável.
10. Chaves de provedores permanecem fora do código e fora do README.

## Mapeamento do xAI atual

| xAI | Vortex |
|---|---|
| Agent / model gateway | `agent` + invocação |
| AgentSandbox | runtime Nx1 |
| `executionTimeMs` | `duration_ms` |
| `logs` | stdout/stderr/event logs, conforme origem |
| `evidenceHash` | `evidence_hash` |
| cluster workers | transporte/serviço; não substitui isolamento Nx1 |
| JSON persistence | estado NxN; não é prova de execução |
| Python simulator | simulação; `executed:false` |
| V8 `runInContext(...timeout)` | execução JS real limitada; precisa adapter + evidência |
| Cloud/VPS/VM connector | runtime externo preferencial quando o processo exigir OS/rede/compute externo |

## Implementação pedida no xAI

Criar uma camada isolada, por exemplo:

```text
src/server/vortex/
  invocation.ts
  adapter.ts
  evidence.ts
  runtime.ts
  contract.ts
  tests/
    invocation.test.ts
    negative.test.ts
```

### Fluxo

```text
Agent / Gateway
      |
      v
VortexAdapter.invoke(request)
      |
      +--> validate request
      |
      +--> select Nx1 runtime
      |
      +--> execute real OR explicitly refuse/simulate
      |
      +--> collect stdout/stderr/exit_code/duration
      |
      +--> compute evidence_hash
      |
      +--> validate response invariants
      |
      v
InvocationResult
```

## Testes de aceitação

### T1 — execução real

Código: `console.log(42)`.

Esperado: `executed:true`, `status:success`, stdout contém `42`, `duration_ms > 0`, `evidence_hash` presente.

### T2 — dry-run / bloqueio

Esperado: `executed:false`; status diferente de `success`; motivo explícito.

### T3 — timeout

Código que exceda o timeout real.

Esperado: `executed:false` ou estado de execução interrompida conforme o runtime, `status:timeout/error`; nunca sucesso.

### T4 — erro de execução

Código inválido.

Esperado: stderr/erro real, `exit_code` não-zero quando aplicável, `executed:true` somente se o runtime de fato iniciou e executou o programa até produzir o erro. O significado de `executed` deve ser definido pelo adapter e coberto por teste.

### T5 — anti-mock

Alterar artificialmente stdout/duration/hash no payload deve falhar no gate.

### T6 — evidência determinística

Mesma execução/evidência deve permitir recomputar o hash; qualquer alteração observável deve alterar a evidência validada.

### T7 — persistência não conta como execução

POST/GET de chat entre workers prova persistência cross-worker, mas não pode gerar `executed:true`.

## Critério de pronto

O xAI só pode declarar **Vortex-compatible** quando os testes acima estiverem verdes e houver uma execução real demonstrável. Até lá, o README deve usar linguagem de implementação/compatibilidade em progresso, não “certified”, “production verified” ou equivalente.

## Prompt operacional para GaiaStudio

> Você é o agente de implementação responsável pelo `scoobiii/xAI`. Integre o adapter Vortex descrito neste documento sem reescrever o core social. Primeiro faça Discovery do código atual e identifique o ponto real de execução. Depois Technical Refinement e só então implemente. Preserve a arquitetura de agentes/conectores. Não invente telemetria. Não converta simulação em `executed:true`. Implemente `invocation_id`, `agent`, `status`, `executed`, `output.stdout`, `output.stderr`, `output.exit_code`, `duration_ms`, `evidence_hash` e `runtime_id`. Faça testes positivos e negativos, incluindo timeout, erro, dry-run, anti-mock e persistência cross-worker. Ao final entregue diff, testes executados e evidências observáveis. Não alegue 100%/3-3/certificação sem prova no CI/runtime.

## Referências

- Core: `scoobiii/vortex`
- Implementação-alvo: `scoobiii/xAI`
- Protocolo: `specs/invocation-contract.md`
- Governança: `docs/decisions.md`
