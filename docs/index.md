<!-- GOS3 · agente: GPT · papel: Maintainer / Engineering Agent -->
<!-- fase: Technical Refinement → Runtime Federation · regra: Mexeu → Testa → Valida → Publica -->

# Vortex

## Runtime verificável para agentes, apps e ferramentas de engenharia

Vortex conecta agentes LLM, execução local, evidência e control planes sem exigir cloud para executar o trabalho.

```text
LLM API / LLM local
        |
        v
Universal Connector
        |
   Vortex Core
        |
  +-----+----------------+
  |     |                |
GitHub Rhino          Blender
  |     |                |
 CI    CAD             3D/DCC
```

### Rhino CAD

O **Rhino Connector** permite transformar uma proposta CAD estruturada em operações compatíveis com `rhinoscriptsyntax`, mantendo a validação no Vortex e a execução na máquina que hospeda o Rhino.

- [Rhino CAD Connector](rhino-cad-connector.md)
- [Local-first + GitHub](README-ONLINE.md)
- [Onboarding](ONBOARDING.md)

### Local-first

Execução, Execution Proof, hash e benchmark podem ocorrer sem internet. Ao reconectar, a evidência pode ser sincronizada e o estado remoto validado.

### API ou LLM local

A origem da proposta é desacoplada do adapter:

```text
GPT / Claude / Qwen / Llama / outro agente
                    |
                    v
            Scene Proposal
                    |
                    v
                 Vortex
                    |
                    v
                  Rhino
```

### Evidência

```text
Proposal → Validation → Execution → Artifact → Hash → Execution Proof → Benchmark
```

A página descreve a arquitetura implementada no branch de desenvolvimento. A execução física do Rhino exige uma instalação compatível do Rhino e um executor/bridge local.
