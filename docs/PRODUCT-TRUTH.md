# GOS3 · agente: GPT · papel: Maintainer / Engineering Agent
# fase: Technical Refinement → Governance Enforcement · data: 2026-09-13 · hora: 00:00
# antes: matriz de verdade atualizada com claims operacionais e gaps de maturidade.
# depois: claims classificados por evidência observável, com baseline por ambiente e limites explícitos.
# base: main
# assinatura: GPT · Maintainer / Engineering Agent · GOS3
# commit: registered by Git

# Vortex Product Truth Matrix

Status: conservative audit baseline.

## Regra de interpretação

O Vortex distingue **PROMISED**, **IMPLEMENTED**, **EXECUTED** e **VERIFIED**. Um arquivo, uma interface ou um teste unitário não é evidência de execução real em um serviço externo. Um execution proof assinado confirma a integridade do envelope produzido; não é, sozinho, uma prova de segurança ou de side effect externo.

## Claims auditáveis

| Claim | Evidência exigida | Status operacional |
|---|---|---|
| Invocation Contract existe | arquivo de especificação e testes de contrato | IMPLEMENTED / TESTED |
| Gateway rejeita ausência de bearer | teste HTTP de produção com token ausente | MUST VERIFY PER DEPLOYMENT |
| Gateway impede replay | teste de request id repetido e prova de rejeição | IMPLEMENTED / TESTED |
| Operação pertence ao manifesto do connector | allowlist do manifesto + teste negativo | IMPLEMENTED / TESTED |
| Qwen local funciona | E2E com Ollama e modelo real | EXECUTION-SPECIFIC |
| GitHub/Android/Windows funcionam end-to-end | execução real no respectivo ambiente | NOT PROVEN UNTIL EXECUTED |
| 100% quality gates | log completo, commit, CI run, fingerprint e evidence hash | VERIFIED PER RUN |
| Segurança de produção | deployment testado, threat model, bearer, policy, sandbox e observabilidade | NOT A LOCAL-GATE CLAIM |
| Segunda implementação independente | verifier Go/Rust validando os mesmos proofs | OPEN |
| Descoberta pública de chaves | endpoint `.well-known/vortex-keys` com rotação | OPEN |

## Performance

O baseline de benchmark deve ser selecionado por fingerprint de ambiente, construído a partir de arquitetura, CPU e versão do Node. A tolerância (`BASELINE_TOLERANCE`) é um parâmetro de decisão registrado no relatório; não deve ser usada para esconder regressões nem para converter dados sintéticos em produção comprovada.

## O que falta para indústria

Os próximos gates de maturidade são: um verificador independente, especificação publicada com estabilidade de interoperabilidade, key discovery com rotação, casos de uso externos observados e testes end-to-end para os adaptadores não-Linux. Até lá, o projeto é uma fundação técnica auditável e um protótipo de runtime governado, não uma garantia universal de produção.

## Regra para agentes

```text
DOCUMENTADO ≠ IMPLEMENTADO ≠ EXECUTADO ≠ VERIFICADO
```

O agente deve sempre declarar o nível de evidência disponível e não transformar um log local, benchmark ou fixture em afirmação de produção.
