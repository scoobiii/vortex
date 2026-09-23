#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { KeyRegistry } from "./key-registry.js";
import { verifyExecutionProof } from "./verifier.js";
import type { ExecutionProof } from "./types.js";

const [, , proofPath, registryPath] = process.argv;

if (!proofPath || !registryPath) {
  console.error("usage: vortex-verifier <execution-proof.json> <key-registry.json>");
  process.exit(2);
}

const proof = JSON.parse(readFileSync(proofPath, "utf8")) as ExecutionProof;
const registry = new KeyRegistry(registryPath);

const result = verifyExecutionProof(proof, registry);

if (result.ok) {
  console.log(JSON.stringify({ ok: true }, null, 2));
  process.exit(0);
} else {
  console.log(JSON.stringify(result, null, 2));
  process.exit(1);
}
