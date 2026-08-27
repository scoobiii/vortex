# Runtime Execution Model — Vortex

> **GOS3** · processo: Agile/Scrum · status: **Bounded Agent Loop / Technical Refinement** · data: 2026-08-26
> Regra: **LLM propõe; compilador/runtime decide.** Texto não é execução.

## 1. Modelo atualizado

O Vortex separa Agent, Scheduler, Runtime e Git/GitHub. A execução de um agente é sempre bounded: existe orçamento de tentativas e tempo, estados explícitos e escalonamento quando não há progresso.

```text
LLM / Worker
    │ proposta + patch
    ▼
Invocation Contract v0.2
    │
    ▼
Capability discovery / Scheduler
    │
    ▼
Nx1 sandbox/runtime
    │
    ├── stdout/stderr/exit_code
    ├── duration_ms
    ├── runtime_id/execution_id
    └── evidence_hash
    │
    ▼
VERIFYING
    ├── PASS → PR_READY
    ├── retryable failure → RETRY
    ├── regression → ROLLBACK → RETRY
    ├── repeated/no progress → STAGNATED → HELP_REQUIRED
    └── blocked/limits → HELP_REQUIRED
```

A implementação concreta deste salto está em `src/gos3/orchestrator.ts`:

- `BubblewrapSandbox` recusa execução sem sandbox e usa Linux bubblewrap para restringir o processo;
- `CliGitProvider` usa `git` para proveniência/rollback e `gh` para PR/Issue, quando explicitamente autorizado;
- o loop ancora `last_good_commit` no HEAD anterior à tarefa;
- `verifyCommand` é uma segunda execução no sandbox e uma falha de verificação classifica a tentativa como `regression`;
- PR só é criado no estado `PR_READY`;
- Issue só é criada no estado `HELP_REQUIRED`.

Isto não declara gVisor: bubblewrap é isolamento Linux local. gVisor permanece uma capability de runtime a ser integrada/testada separadamente.

## 2. Estados

`READY → RUNNING → VERIFYING` é o caminho normal.

- `PR_READY`: somente após execução real, teste/verificação e evidência válida.
- `RETRY`: falha recuperável com progresso observável e dentro dos limites.
- `ROLLBACK`: regressão detectada; volta ao último commit bom antes de tentar novamente.
- `STAGNATED`: a tentativa não produz progresso observável ou repete a mesma evidência/erro.
- `HELP_REQUIRED`: bloqueio terminal; produz pedido estruturado para humano/GOS3.

Não existe estado `LOOP_FOREVER`.

## 3. Worker pequeno — Qwen2.5 Coder ~0,5B

`src/agents/qwen05b/adapter/index.ts` fornece um adapter para endpoint local OpenAI-compatible. Por padrão usa `http://127.0.0.1:11434/v1` e `qwen2.5-coder:0.5b`, mas ambos são configuráveis por `QWEN_BASE_URL` e `QWEN_MODEL`.

O catálogo do Ollama lista `qwen2.5-coder:0.5b` como modelo de 0,5B/398 MB e documenta o uso local via Ollama. citeturn1search0turn1search3

O Qwen é tratado como **worker**, não como autoridade. A capacidade desejada é executar microtarefas no sandbox, alterar arquivos, rodar testes e devolver evidência. O runtime/orquestrador decide se houve progresso, rollback, publicação ou escalonamento.

**E2E real com um Qwen ~0,5B instalado ainda é pendente**; os testes do orquestrador usam doubles determinísticos para provar a governança sem fingir execução de modelo.

## 4. Prova

`executed:true` exige runtime real + `evidence_hash`. Git/PR não são prova de execução. Um commit pode existir sem teste; um PR pode existir sem execução válida.

## 5. Limites

`max_attempts` e `max_duration_ms` são hard limits aplicados pelo runtime/orquestrador. O LLM não pode aumentá-los por prompt.

## 6. Git/GitHub

Git representa estado e proveniência. O fluxo recomendado é:

```text
sandbox → worker → verify → evidence → VERIFYING → PR_READY → gh pr create
```

Em regressão:

```text
bad worker/verification → ROLLBACK → last_good_commit → RETRY
```

Em bloqueio:

```text
blocked/stagnated/limit → HELP_REQUIRED → gh issue create
```

As operações GitHub ficam atrás de `allowGitHub`; portanto o runtime pode ser executado localmente sem publicar nada.

## 7. Runtime heterogêneo

Possíveis executores continuam incluindo A23/Termux, VPS/Linux, GCloud e Colab. O scheduler deve selecionar por capabilities reais e `runtime_id`; o agente nunca deve presumir o ambiente.

## 8. Regra de ouro

**Não perguntar onde o LLM disse que rodou. Perguntar qual runtime rodou, qual comando, exit code, logs, duração, runtime_id, teste e evidência.**
