<!-- GOS3 · agente: GPT · papel: Maintainer / Engineering Agent -->
<!-- fase: Technical Refinement → Runtime Federation · regra: Mexeu → Testa → Valida → Publica -->

# Vortex Rhino CAD Connector

O Rhino Connector integra o Vortex ao Rhinoceros como um adapter CAD. O Vortex não depende do Rhino para funcionar e não coloca código específico do Rhino no Core.

## Arquitetura

```text
Usuário / Agente
      |
      v
LLM API ou LLM local
      |
      v
Universal Connector
      |
      v
Rhino Scene Proposal
      |
      v
Vortex validation
      |
      v
Rhino Adapter
      |
      v
rhinoscriptsyntax / Rhino
      |
      +--> .3dm
      +--> STEP
      +--> IGES
      +--> execução/evidência
```

## O que está implementado

- protocolo `vortex-rhino/v1`;
- tipos para propostas de cena CAD;
- validação de operações e parâmetros numéricos;
- validação de nomes de objetos;
- geração determinística de Python para `rhinoscriptsyntax`;
- executor injetável, sem dependência do Rhino no build do Vortex;
- operações primitivas: box, cylinder, sphere, hole/cutter, fillet request, boolean difference e export;
- testes unitários sem Rhino instalado;
- separação entre proposta, validação e execução.

## Segurança e fronteira de execução

O adapter **não executa código arbitrário recebido do LLM**. O LLM produz uma estrutura `RhinoSceneProposal`; somente os tipos de operação conhecidos pelo adapter são convertidos em Python.

O script gerado deve ser revisado pelo host antes de execução em ambientes de produção. Caminhos de exportação precisam ser explícitos e não recebem shell expansion.

O primeiro adapter é deliberadamente transport-neutral: a conexão real com uma instância do Rhino pode ser implementada por um executor local, plugin/add-on, bridge HTTP ou outro transporte permitido pelo ambiente.

## LLM via API ou local

O LLM não é parte do Rhino adapter.

```text
LLM remoto ─┐
            ├─> Scene Proposal ─> Vortex ─> Rhino
LLM local ──┘
```

Portanto, trocar GPT por Claude, Qwen, Llama ou outro agente não muda a integração CAD.

## Exemplo

```ts
import { RhinoAdapter, RhinoSceneProposal } from "./src/vortex/rhino";

const proposal: RhinoSceneProposal = {
  protocol_version: "vortex-rhino/v1",
  units: "mm",
  operations: [
    { type: "box", name: "base", origin: [0, 0, 0], size: [100, 60, 20] },
    { type: "cylinder", name: "pin", base: [50, 30, 0], radius: 5, height: 20 },
    { type: "export", format: "step", path: "/tmp/part.step" }
  ]
};

const adapter = new RhinoAdapter(executor);
const result = await adapter.execute(proposal);
```

## Evidência Vortex

A execução deve ser ligada ao mecanismo existente de Execution Proof:

```text
proposal
  -> validation
  -> generated script
  -> Rhino execution
  -> artifact (.3dm/.step/.iges)
  -> execution metrics
  -> Execution Proof
  -> SHA-256
  -> benchmark
```

A existência do arquivo não deve ser confundida com prova de geometria correta. Validações futuras podem incluir contagem de objetos, bounding box, volume, tolerância geométrica, unidades e hashes dos artefatos.

## Testes

```bash
npm run build
npx ts-node src/vortex/rhino/tests/rhino-adapter.test.ts
```

O teste é propositalmente independente de uma instalação/licença do Rhino.

## Roadmap de integração física

1. executor local dentro do Rhino;
2. bridge Desktop ↔ Rhino por Universal Connector;
3. Grasshopper adapter para grafos paramétricos;
4. captura de métricas geométricas e hashes dos artefatos;
5. validação de `.3dm`, STEP e IGES;
6. E2E real com Rhino instalado;
7. integração com GitHub/CI para versionamento e validação dos artefatos CAD.
