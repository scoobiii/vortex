#!/usr/bin/env bash
# GOS3 · agente: GPT · papel: Maintainer / Engineering Agent
# fase: Connector Federation → Ollama Installer
# data: 2026-09-07 · hora: 16:22
# antes: installer directory absent
# depois: Linux installer uses the official Ollama installer and verifies runtime
# base: Ollama runtime connector
# assinatura: agent/llm · Engineering Agent · GOS3
# commit: registered by Git
set -euo pipefail
if ! command -v curl >/dev/null 2>&1; then echo 'curl is required' >&2; exit 1; fi
curl -fsSL https://ollama.com/install.sh | sh
command -v ollama >/dev/null
echo "Ollama installed: $(ollama --version)"
