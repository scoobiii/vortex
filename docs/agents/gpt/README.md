# GPT Agent — Vortex / GOS3

> Status: **proposta** — aguardando aprovação do PO e revisão dos agentes GOS3 no xAI.
> Regra operacional: **mexeu, deixa rastro**.

## Objetivo

Documentar como o agente GPT participa da evolução do Vortex e como o Vortex deve permitir que agentes do xAI colaborem na construção do próprio xAI sem transformar alegações em fatos.

## Decisão de governança proposta

**Não criar um segundo GOS3.** Reaproveitar o GOS3 do Vortex como protocolo de governança e proveniência. O xAI pode ter 28 agentes ou mais; eles podem atuar como proposers/reviewers externos. O núcleo GOS3 continua definindo o contrato, os gates e a trilha de auditoria.

O número de agentes não deve ser hardcoded no protocolo.

## Mexeu, deixa rastro

Toda alteração relevante deve deixar uma cadeia observável:

`dor → Issue → proposta → teste → execução → telemetria → evidência → revisão → aprovação → commit/PR → backlog`.

Um README não substitui essa cadeia.

Claims como `100% concluído`, `GOS3 Certified`, throughput, WAL ou qualquer benchmark devem apontar para evidência reproduzível.

## Agentes e runtimes

O agente LLM e o runtime são entidades separadas:

```text
Agent (GPT/Grok/Gemini/local/...)
          |
          v
 Vortex invocation-contract
          |
          v
 capability discovery
          |
   +------+------+------+
   |      |      |      |
  A23    VPS   GCloud  Colab
 ARM64  Linux   GPU     GPU
```

A regra é **write once, run anywhere no nível do artefato/contrato**. Binários podem precisar de compilação por perfil. O scheduler deve selecionar um runtime compatível por `runtime_id`, arquitetura, OS, recursos, GPU/backend e permissões.

## Conectores

Um conector de usuário autentica o acesso a um recurso; ele não implica acesso irrestrito a uma VM/GPU. Runtimes remotos devem declarar capacidades e produzir evidência de execução.

Exemplos de targets:

- A23/Termux: ARM64, Node/Python e GPU/backend somente quando realmente disponível.
- VPS: Linux/Docker e GPU se provisionada.
- GCloud: VM/Job/Container com recursos autorizados.
- Colab: runtime de notebook/local/remoto e acelerador da sessão.

## Gate de execução

Nunca:

```json
{"status":"success","executed":false}
```

Para execução real:

```json
{
  "executed": true,
  "runtime_id": "...",
  "stdout": "...",
  "stderr": "",
  "exit_code": 0,
  "duration_ms": 12,
  "evidence_hash": "..."
}
```

`accepted`, `simulated`, `mocked` e `not_executed` não podem ser promovidos a `success`.

## Prompt operacional para agentes colaboradores

> Você é um Engineering Agent do GOS3/Vortex. Não declare uma capacidade como concluída apenas por texto. Primeiro identifique a dor e registre/aponte a Issue. Proponha a menor mudança verificável. Crie ou atualize teste. Execute-o no runtime disponível. Registre stdout/stderr/exit_code/duration/runtime_id e evidência. Diferencie execução real de simulação/mock. Faça handoff para revisão. Não faça merge de mudança que exige aprovação do PO antes dessa aprovação. Atualize a documentação somente de acordo com o estado comprovado.

## Critério de aceitação desta proposta

- PO aprova ou rejeita explicitamente a arquitetura.
- Agentes GOS3 no xAI revisam a proposta.
- O Vortex mantém uma única governança GOS3.
- Runtime federation e capability discovery entram no backlog.
- Implementação posterior cria testes reais para `executed`, telemetria e evidência.

## Não afirmado

Este documento **não afirma** que todos os conectores, runtimes, GPUs, Colab/GCloud ou os 28 agentes do xAI já estão operacionalmente integrados. A integração só pode ser marcada como concluída após evidência no repositório.

---

**scoobiii/vortex · GPT Engineering Agent · proposta GOS3**
