> **GOS3** · agente: `GPT` · papel: `Maintainer / Engineering Agent` · status: **proposta — aguardando aprovação do PO e revisão dos agentes GOS3 no xAI**
> fase: `Technical Refinement → Runtime Federation` · data: `2026-08-28`
> regra: **mexeu, deixa rastro** — toda mudança relevante deve apontar dor → issue → proposta → teste → execução → evidência → revisão → aprovação → commit.

# vortex

![USE VORTEX! - Python, LLMs, Sandbox & Runtime](docs/images/use-vortex-cover.png)

> **Aprenda de verdade. Sem "funcionou aqui". Só resultados reais: HASH + TEMPO + LOG.**

> Estado persistente no backlog. Execução isolada por invocação. **NxN para colaborar, Nx1 para executar.**

Runtime/protocolo para LLMs executarem código de forma verificável, mantendo a camada de execução separada da camada de estado. O Vortex não é um sandbox único: é o contrato que permite a um agente solicitar execução em um runtime compatível e receber evidência estruturada.

## A nova fronteira: agentes constroem o próprio xAI

O Vortex passa a documentar uma arquitetura de **runtime federation** para o `zAI → xAI`: o app social pode hospedar múltiplos agentes, enquanto cada execução ocorre em um Nx1 adequado às capacidades do host.

A regra é **write once, run anywhere** no nível do artefato/contrato, não uma promessa de que qualquer binário roda sem recompilação. O scheduler seleciona um runtime compatível por `runtime_id`, arquitetura, OS, memória, GPU/backend e ferramentas disponíveis.

```text
xAI / Social Layer
        │
   Agent Gateway
        │
 Vortex invocation-contract
        │
 Runtime Capability Discovery
        │
 ┌──────┼─────────┬──────────┐
 A23    VPS      GCloud     Colab
 ARM64  Linux    GPU        GPU
 Vulkan Docker   CUDA       Jupyter
        │
        ▼
 execution evidence
        │
        ▼
 Git / Issue / PR / Review
```

## GOS3 não é um badge

`GOS3 Certified`, `100% complete`, throughput, WAL ou qualquer outra afirmação operacional **não é prova por si só**. Claims devem apontar para artefatos reproduzíveis.

**Mexeu, deixa rastro:**

1. dor identificada;
2. Issue registrada;
3. proposta técnica;
4. teste reproduzível;
5. execução real (`executed: true`) ou declaração explícita de não execução (`executed: false`);
6. telemetria real: stdout/stderr/exit_code/duration/runtime_id;
7. evidência/hash;
8. revisão por agentes;
9. aprovação do PO quando exigida;
10. commit/PR e atualização do backlog.

Nenhum agente pode transformar `accepted`, `simulated`, `mocked` ou `not_executed` em `success`.

## Invocation contract

O contrato v0.1 exige, no mínimo, `contract_version`, `invocation_id`, `agent`, `status`, `executed` e saída estruturada. Para `executed: true`, a implementação deve fornecer evidência verificável; ausência de execução não pode ser mascarada por mock.

## Runtime federation

O agente não precisa conhecer detalhes de cada máquina. O Vortex deve descobrir/receber capacidades do runtime e escolher um executor compatível:

| Runtime | Exemplos de capacidades | Uso |
|---|---|---|
| A23/Termux | ARM64, Node, Python, Vulkan/Adreno quando disponível | execução local/baixo custo |
| VPS | Linux, Docker, CPU/GPU conforme host | builds e serviços persistentes |
| GCloud | VM/Job/Container, GPU conforme oferta | compute remoto |
| Colab | notebook/local/remote runtime, acelerador conforme sessão | experimentação |

**Importante:** credencial/conector de usuário não equivale automaticamente a acesso irrestrito a GPU. Cada runtime deve expor capacidades e permissões reais.

## SELIX / SELIC 1D — teste determinístico

O Vortex pode representar a métrica econômica como uma invocação `selix.selic1d`, preservando a mesma regra de evidência usada pelos demais agentes. O exemplo completo está em `examples/selix/`.

### Fixture

```text
examples/selix/selic1d.request.json
```

Entrada do exemplo:

```json
{
  "contract_version": "0.1",
  "invocation_id": "selix-selic1d-example-001",
  "agent": "selix",
  "action": "selix.selic1d",
  "payload": {
    "selic_atual": 14.25,
    "selic_1d": 9.25,
    "ipca_proxy": 4.5
  },
  "context": {
    "sandbox": true,
    "dry_run": false
  }
}
```

### Resultado esperado

```text
SELIC atual       = 14.25%
SELIC 1D (ideal)  =  9.25%
diferencial       =  5.00 p.p.
IPCA proxy        =  4.50%
juro real atual   =  9.75%
juro real 1D      =  4.75%
redução real      =  5.00 p.p.
```

### Gate de execução

Para declarar `claim: executed`, o run precisa produzir evidência real:

```text
GATE: PASS
claim: executed
exit_code: 0
duration_ms: <tempo real>
input_hash: <hash>
output_hash: <hash>
```

**Importante:** a fixture documenta o contrato e os valores esperados; ela não deve ser apresentada como execução real do runtime quando o adaptador `src/agents/selix/` não tiver sido executado. Claims como `400–450 empresas B3` ou `R$ 50–100 bi de desbloqueio` são dados declarados na peça e não são reestimados pelo cálculo determinístico.

## GOS3 — Gang of Seven

O board original mantém Gemini, Claude, GPT, Qwen, DeepSeek, Manus e Perplexity. O modelo de execução não deve ser hardcoded: agentes adicionais do xAI podem participar como revisores/proposers, sem alterar o contrato. Ver `docs/team.md` e `docs/agents/gpt/`.

## Engenharia de proveniência

A pasta `docs/agents/gpt/` registra o papel deste agente nesta mudança, os conectores, o prompt operacional, o fluxo de revisão e os critérios de aprovação. Isso é documentação de processo, não alegação de que cada runtime ou conector já está operacional.

## Status

**Discovery/Technical Refinement:** runtime federation proposta. **Aguardando aprovação do PO** antes de tratar a proposta como decisão arquitetural aceita e aguardando revisão/colaboração dos agentes GOS3 no xAI.

Ver:
- `docs/agents/gpt/README.md`
- `docs/runtime-federation.md`
- `docs/gos3-provenance.md`
- `docs/BACKLOG.md`
- `docs/decisions.md`
- `examples/selix/README.md`
