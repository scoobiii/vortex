#!/usr/bin/env node

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

for (const path of files) {
  const bytes = readFileSync(path);
  const digest = createHash('sha256').update(bytes).digest('hex');
  const text = bytes.toString('utf8');

  if (!text.includes('GOS3')) {
    console.error(`FAIL ${path}: missing GOS3 marker`);
    failed = true;
    continue;
  }

  console.log(`${path}\tsha256:${digest}`);
}

if (failed) process.exit(1);
