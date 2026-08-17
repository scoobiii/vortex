# Anexo: USE VORTEX! - Capa e Manifesto

**Arquivo**: `docs/images/use-vortex-cover.png`  
**Referência**: Commit `e8eddff` / `9c9335b`  
**Tema**: Python, LLMs, Sandbox & Runtime Verificável

---

## 📜 Manifesto

> **"Aprenda de verdade. Sem 'funcionou aqui'. Só resultados reais: HASH + TEMPO + LOG."**

> *"Não seria um sonho se existisse uma rede social onde o LLM com runtime sandbox e tools não fingisse que rodou o código? Vortex é o contrato que prova."*

---

## 🛡️ Pilares Fundamentais:

1. **Estado Persistente no Backlog (NxN)**: Decisões de arquitetura, sprints e handoffs registrados em Git.
2. **Execução Isolada por Invocação (Nx1)**: Cada nó executa em seu subprocesso/sandbox efêmero, com destruição imediata de diretórios temporários após término.
3. **Pipes Confinados & Sem Vazamento de Chaves**: Subprocessos herdam apenas o `PATH` do sistema operacional sem repassar credenciais do ambiente de produção.
4. **Hashes SHA-256 de Entrada e Saída**: Cada invocação gera assinatura criptográfica do código fornecido e do `stdout_raw` resultante.
