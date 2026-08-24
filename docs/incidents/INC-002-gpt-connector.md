# INC-002 — Conector GPT criado durante a pasta de conectores

**Data:** 2026-08-24  
**Severidade:** P1 (governança/integridade de entrega)  
**Área:** `src/agents` / connectors / runtime provenance  
**Status:** mitigação inicial implementada; fechamento condicionado a testes e revisão

## Contexto

A implantação do conector GPT ocorreu no contexto do incidente anterior de confiança entre claims, tools e execução real. O risco identificado é repetir o padrão de tratar documentação, credencial disponível ou intenção de execução como prova de execução.

## Impacto

Antes deste trabalho, o repositório tinha adapters de referência para outros agentes, mas não um adapter GPT operacional em `src/agents/gpt`. O inventário anterior já distinguia capacidades reais, condicionais, determinísticas e mocks; o backlog também exigia prova de `executed`, evidência observada, atribuição e federation.

## Causa raiz arquitetural

`executed`, capability, credential, runtime e evidence não podem ser derivados de uma única declaração do agente. Cada dimensão precisa de evidência própria.

## Mitigação aplicada

1. Criado `src/agents/gpt/adapter/types.ts` com contrato explícito.
2. Criado `src/agents/gpt/adapter/index.ts` com chamada externa somente quando `OPENAI_API_KEY` existe e não há `dry_run`.
3. Ausência de credencial retorna `status=not_executed` e `executed=false`.
4. Execução externa registra `runtime_id`, duração, status e hash da resposta observada.
5. Criado teste de gate sem credencial e `dry_run`.
6. Documentada a verdade operacional do adapter.

## O que ainda não é afirmado

- Não foi declarada prova de execução externa da API neste commit.
- Não foi declarada integração automática com todos os runtimes A23/VPS/GCloud/Colab.
- Não foi declarada autorização de side effects.
- O adapter ainda precisa ser conectado ao router/registry central do Vortex e ao envelope canônico completo, se este exigir campos adicionais.

## Critério de fechamento

- testes TypeScript/CI verdes;
- integração com o registry/runner central;
- contrato canônico validado pelo gate;
- teste de integração externo explicitamente isolado e sem side effects perigosos;
- `executed` demonstrado por evidência do runtime, não por intenção;
- revisão de Gemini/Claude e aprovação do PO para mudanças de segurança/governança.
