# GOS3 — Ollama Installer

Scripts de instalação do runtime Ollama para a fronteira `connectors/ollama`.

- `install.sh`: Linux, chama o instalador oficial e verifica `ollama --version`.
- `install.ps1`: Windows, usa `winget` com o pacote `Ollama.Ollama` e verifica o executável.

A instalação do runtime não transforma Ollama em agente: Qwen permanece em `src/agents/qwen05b`.
