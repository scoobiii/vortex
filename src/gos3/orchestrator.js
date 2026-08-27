// **GOS3** · compatibility shim
// Canonical implementation lives in orchestrator.ts. This file exists because
// package.json's Qwen smoke-test/runtime references resolve through .js paths.
export * from "./orchestrator.ts";
