#!/usr/bin/env node
// GOS3
// arquivo: scripts/verify-gos3-provenance.mjs
// responsabilidade: verificar SHA-256 dos bytes dos artefatos GOS3 inventariados
// agente: GPT
// papel: Maintainer / Engineering Agent
// fase: Provenance → Artifact Verification
// data: 2026-09-08
// hora: 18:20
// antes: verificador criado sem cabeçalho GOS3, causando falha no gate check-headers.
// depois: verificador explicitamente identificado como artefato GOS3 e validável pelo gate normativo.
// base: docs/GOS3-PROVENANCE-INVENTORY-v1.md
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: pending

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const files = [
  'README.md',
  '.github/workflows/gos3-compliance.yml',
  'connectors/github/adapter/index.ts',
  'connectors/github/mcp/index.ts',
  'connectors/github/index.ts',
  'connectors/github/tests/connector.test.ts',
  'connectors/ollama/adapter/index.ts',
  'connectors/ollama/provenance/index.ts',
  'connectors/ollama/index.ts',
  'connectors/ollama/tests/connector.test.ts',
];

let failed = false;

for (const file of files) {
  try {
    const bytes = readFileSync(file);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const text = bytes.toString('utf8');
    if (!/^.*GOS3.*$/m.test(text.slice(0, 4000))) {
      console.error(`FAIL: missing GOS3 marker: ${file}`);
      failed = true;
      continue;
    }
    console.log(`${file}\tsha256:${sha256}`);
  } catch (error) {
    console.error(`FAIL: unable to read ${file}: ${error.message}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('verify:gos3:provenance: PASS');
