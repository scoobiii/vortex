# Registro de Conversa: Auditoria de Sandbox & Bug Fix no Subprocesso

**Data**: 2026-08-16 / 2026-08-17  
**Participantes**: Sobrinho SJ (PO / Operador), Gemini / GPT Maintainer Agent  
**Contexto**: Eliminação de mocks, correção de shadowing no Node.js e implementação de terminação via `SIGKILL`.

---

## 1. O Problema Identificado

O operador do sistema detectou que o código gerado continha dois erros críticos que impediam a prova de execução confiável:

### Bug 1: Shadowing da variável global `process`
```typescript
// ❌ CÓDIGO COM ERRO (Temporal Dead Zone ReferenceError)
const process = spawn("python3", [scriptPath], {
  timeout: timeoutMs,
  env: { PATH: process.env.PATH }, // Tentativa de acessar 'process' antes de sua inicialização!
});
```

### Bug 2: Falsa alegação de `SIGKILL`
O `child_process.spawn` do Node.js com a opção `{ timeout: timeoutMs }` envia `SIGTERM` por padrão. Scripts Python podem interceptar `SIGTERM` e continuar em execução como processos zumbis. O parâmetro `killSignal: "SIGKILL"` é obrigatório para garantir o encerramento do processo pelo kernel.

---

## 2. A Solução Implementada

O contrato de invocação foi refatorado em `/src/server/vortexContract.ts`:

```typescript
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export interface ExecutionProof {
  node_id: string;
  claim: "executed" | "failed" | "not_executed";
  runtime: {
    engine: string;
    arch: string;
    verifiable_via: string;
  };
  proof: {
    stdout_raw: string;
    exit_code: number | null;
    duration_ms: number;
  };
  input_hash: string;
  output_hash: string;
  timestamp: string;
}

const sha256 = (s: string) => createHash("sha256").update(s, "utf-8").digest("hex");

export async function executeRealPython(
  nodeId: string,
  code: string,
  timeoutMs = 5000
): Promise<ExecutionProof> {
  const startedAt = Date.now();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "vortex-sandbox-"));
  const scriptPath = path.join(tempDir, "script.py");
  await fs.writeFile(scriptPath, code, "utf-8");

  // ✅ Capturado ANTES do spawn, sem shadowing de 'process'
  const inheritedPath = process.env.PATH ?? "/usr/bin:/bin";

  const result = await new Promise<{ stdout: string; stderr: string; exitCode: number | null }>(
    (resolve) => {
      const child = spawn("python3", [scriptPath], {
        timeout: timeoutMs,
        killSignal: "SIGKILL", // ✅ Terminação forçada garantida
        env: { PATH: inheritedPath }, // ✅ Sem vazar tokens ou credenciais de ambiente
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (d) => { stdout += d.toString(); });
      child.stderr.on("data", (d) => { stderr += d.toString(); });

      child.on("close", (code) => resolve({ stdout, stderr, exitCode: code }));
      child.on("error", (err) => resolve({ stdout: "", stderr: err.message, exitCode: null }));
    }
  );

  await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

  const durationMs = Date.now() - startedAt;
  const stdoutRaw = result.stderr ? `${result.stdout}\n${result.stderr}` : result.stdout;

  return {
    node_id: nodeId,
    claim: result.exitCode === 0 ? "executed" : "failed",
    runtime: {
      engine: "CPython 3.10 (subprocess real, node:child_process.spawn)",
      arch: os.arch(),
      verifiable_via: "python3 --version",
    },
    proof: {
      stdout_raw: stdoutRaw,
      exit_code: result.exitCode,
      duration_ms: durationMs,
    },
    input_hash: sha256(code),
    output_hash: sha256(stdoutRaw),
    timestamp: new Date().toISOString(),
  };
}
```

---

## 3. Decisões do Conselho Técnico

1. **Caminho 1**: Eliminar imediatamente todo e qualquer fallback simulado que retorne texto formatado disfarçado de provider externo.
2. **Caminho 2**: Todo subprocesso e chamada externa deve retornar estritamente a estrutura `ExecutionProof` com hashes de entrada e saída.
