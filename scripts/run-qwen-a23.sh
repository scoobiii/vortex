#!/data/data/com.termux/files/usr/bin/bash
# GOS3 · agente: Manus · papel: Maintainer / DevOps
# fase: Onboarding → Runtime Federation · data: 2026-08-30 · hora: 01:23:42 UTC
# antes: script de runtime local sem cabeçalho GOS3.
# depois: inicialização rastreável do Qwen/llama.cpp no A23.
# base: commit e49ef90 · assinatura: Manus · Maintainer / DevOps · GOS3
set -euo pipefail

MODEL_PATH="${MODEL_PATH:-$HOME/models/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf}"
LLAMA_SERVER="${LLAMA_SERVER:-$HOME/llama.cpp/build/bin/llama-server}"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8080}"
THREADS="${THREADS:-4}"
CONTEXT="${CONTEXT:-2048}"

if [ ! -x "$LLAMA_SERVER" ]; then
  echo "llama-server não encontrado ou não executável: $LLAMA_SERVER" >&2
  exit 1
fi
if [ ! -f "$MODEL_PATH" ]; then
  echo "Modelo não encontrado: $MODEL_PATH" >&2
  exit 1
fi

exec "$LLAMA_SERVER" \
  -m "$MODEL_PATH" \
  --host "$HOST" \
  --port "$PORT" \
  -c "$CONTEXT" \
  -t "$THREADS" \
  -b 64 \
  -ub 32 \
  --parallel 1 \
  --cont-batching \
  --no-mmap 2>/dev/null
