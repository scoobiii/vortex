# GOS3 · agente: GPT · papel: Maintainer / Engineering Agent
# fase: Connector Federation → Ollama Installer
# data: 2026-09-07 · hora: 16:22
# antes: installer directory absent
# depois: Windows installer uses winget when available and verifies runtime
# base: Ollama runtime connector
# assinatura: agent/llm · Engineering Agent · GOS3
# commit: registered by Git
$ErrorActionPreference = 'Stop'
if (Get-Command winget -ErrorAction SilentlyContinue) {
  winget install --id Ollama.Ollama --exact --accept-package-agreements --accept-source-agreements
} else {
  throw 'winget is required for the Windows installer. Install Ollama manually from the official distribution and rerun verification.'
}
$ollama = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollama) { throw 'Ollama executable was not found after installation. Restart the shell and rerun this script.' }
ollama --version
