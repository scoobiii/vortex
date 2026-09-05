# AUDIT — GOS3 Governance Retroativo

**Data:** 2026-09-05
**Escopo:** 24 arquivos com cabeçalho GOS3 (Data, Diretório, Responsabilidade, Versão, Assinatura)
**Gate:** `python3 scripts/governance/retrofit_headers.py --check` → PASS (0 arquivos sem cabeçalho)
**TODOs de Responsabilidade pendentes:** 0

## Responsabilidades por arquivo

### Benchmark / prova
| Arquivo | Responsabilidade |
|---|---|
| compare_benchmarks.py | Compara dois relatórios JSON do concurrent_benchmark (baseline vs Vortex) e calcula variação percentual. |
| concurrent_benchmark.py | Executa benchmark concorrente de latência para Ollama e endpoints OpenAI-compatíveis. |
| scripts/proof/qwen_benchmark.js | Executa prova comparativa direct vs Vortex no modelo Qwen local. |
| scripts/proof/verify_qwen_proof.js | Verifica prova de execução Qwen, falhando fechado sem evidência válida. |
| scripts/proof/vortex_qwen_adapter.js | Adaptador de prova de execução para endpoint Qwen OpenAI-compatível com evidence_hash. |

### Governança / lint / auditoria
| Arquivo | Responsabilidade |
|---|---|
| scripts/governance/retrofit_headers.py | Insere cabeçalho de governança retroativo nos arquivos legados que reprovam o gate. |
| scripts/lint/check_header.js | Valida cabeçalho GOS3 e barra arquivos fora do padrão no lint. |
| gos3-audit.py | Audita repositório contra o framework GOS3/Vortex sem confiar em nota declarada. |
| tests/contract_test.py | Valida respostas contra invocation-contract v0.1, exigindo evidence_hash quando executed=true. |
| scripts/scrape_repo.py | Gera snapshot/dump de código do repositório com metadados git opcionais. |

### MCP
| Arquivo | Responsabilidade |
|---|---|
| src/mcp-http-server.ts | Expõe servidor MCP via HTTP Streamable com autenticação por token. |
| dist-mcp/mcp-server.js | Build distribuível do servidor MCP com ferramentas GitHub, Vortex, S3 e Qwen. |

### Adapters
| Arquivo | Responsabilidade |
|---|---|
| vortex_ollama_adapter.py | Expõe gateway local estilo Vortex com endpoint OpenAI-compatível para runtime Ollama. |
| src/agents/claude/adapter/contract.ts | Valida request/response do invocation-contract v0.1 para o agente Claude. |
| src/agents/claude/adapter/handler.ts | Implementa handlers de ação do Claude (ping/echo/validate_contract/check_gos3_header). |
| src/agents/claude/adapter/index.ts | Entrypoint invocável do adapter Claude via invoke(). |
| src/agents/claude/adapter/types.ts | Define tipos TS do invocation-contract v0.1 para o agente Claude. |
| src/agents/claude/tests/contract.test.ts | Testa conformidade do adapter Claude com o invocation-contract v0.1. |
| src/agents/grok/adapter/contract.ts | Valida request/response do invocation-contract v0.1 para o agente Grok. |
| src/agents/grok/adapter/handler.ts | Implementa handlers de ação do Runtime Reference Grok (echo/ping). |
| src/agents/grok/adapter/index.ts | Entrypoint invocável do Runtime Reference Grok via invoke(). |
| src/agents/grok/adapter/types.ts | Define tipos TS do invocation-contract v0.1 para o agente Grok. |
| src/agents/grok/tests/contract.test.ts | Testa conformidade do adapter Grok com o invocation-contract v0.1. |
| src/agents/manus/adapter/index.ts | Scaffold público do adapter Manus que bloqueia execução sem runtime aprovado. |

## Achados

1. **Duplicação intencional (paridade Claude ↔ Grok):** `contract.ts`, `types.ts` e `index.ts` são ~90% idênticos entre claude e grok. Diferença real apenas em `handler.ts` — Claude adiciona `check_gos3_header`. Paridade proposital, não bug. Oportunidade futura: extrair base comum.
2. **Assinaturas desconhecidas (6 arquivos, sem histórico git):** `compare_benchmarks.py`, `concurrent_benchmark.py`, `vortex_ollama_adapter.py`, `src/mcp-http-server.ts`, `dist-mcp/mcp-server.js`, `scripts/governance/retrofit_headers.py`. Recomendação: `git add` + commit para selar autoria.
3. **Datas:** lote 2026-09-05 (13 arquivos) é o mais recente; núcleo claude/grok é de 2026-08-15/16/20; `gos3-audit.py`, `tests/contract_test.py`, `scripts/scrape_repo.py` e adapters manus de 2026-08-16/20.
4. **Nota:** a string `TODO: preencher` restante no repositório vive apenas como constante `TODO_RESPONSABILIDADE` dentro de `scripts/governance/retrofit_headers.py` — não é pendência de cabeçalho.

## Comandos de verificação

```bash
cd ~/vortex
python3 scripts/governance/retrofit_headers.py --check | tail -3
grep -rn "TODO: preencher" --include="*.py" --include="*.js" --include="*.ts" | grep -v "retrofit_headers.py"
# esperado: vazio
```
