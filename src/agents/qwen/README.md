> **GOS3** · agente: `qwen` · papel: `Agent Adapter / Ollama`
> fase: `Qwen connector reorganization` · data: `2026-09-06`
> base: `a9083f0`
> assinatura: `GPT · Engineering Agent · GOS3`

# Qwen Connector

Adapter do agente Qwen para o invocation contract do Vortex.

## Arquitetura

```text
Qwen model
   │
   ▼
Ollama /api/generate
   │
   ▼
src/agents/qwen/adapter
   │
   ├── contract.ts   valida request/response
   ├── handler.ts    transporte Ollama + telemetria
   ├── index.ts      entrada do adapter
   └── types.ts      tipos e configuração
   │
   ▼
Vortex invocation contract
```

O package representa **Qwen como agente**, enquanto o modelo é configuração. Portanto `qwen2.5-coder:0.5b`, `1.5b` ou `7b` não criam packages diferentes.

## Configuração

```ts
import { invoke } from "./adapter";

const response = await invoke({
  invocation_id: "qwen-001",
  agent: "qwen",
  action: "generate",
  payload: { prompt: "Responda exatamente: VORTEX-QWEN-OK" },
  context: { sandbox: true, timeout_ms: 30000 }
}, {
  endpoint: "http://localhost:11434",
  model: "qwen2.5-coder:0.5b"
});
```

## Ação

A primeira ação do adapter é `generate`. O payload requer `prompt` string.

## Execução verificável

O adapter não transforma HTTP 200 em `executed=true`.

`executed=true` exige, nesta camada, que a geração seja concluída (`done=true`) e que Ollama reporte tokens e duração de avaliação positivos. `dry_run` permanece `executed=false`.

Isso prova **execução da inferência pelo runtime Ollama**, não um side-effect externo do agente. GitHub, filesystem e publicação continuam sendo capacidades separadas do Vortex.

## Evidência

A resposta preserva telemetria do Ollama (`done`, `done_reason`, `eval_count`, `eval_duration`, `total_duration`) para a camada Vortex produzir evidência/receipt conforme o protocolo global.

O adapter não declara autoridade GitHub.

## Testes

`tests/contract.test.ts` usa um mock do endpoint Ollama e cobre:

- geração concluída → `executed=true`;
- dry-run → `executed=false`;
- agente incorreto → erro fail-closed;
- conformidade do response com o contrato.

### Limite atual

Este package é a reorganização do conector dentro de `src/agents/qwen`. A validação contra um Ollama real e a integração no registry/orquestrador são gates posteriores; não são declaradas como concluídas por este documento.

## Relação com o adapter legado

O adapter Python raiz `vortex_ollama_adapter.py` não é removido nesta reorganização. Ele permanece fora do package de agente até uma substituição explicitamente validada. O package Qwen é a fronteira arquitetural correta para o agente; o adapter raiz continua sendo uma integração/runtime legada independente.
