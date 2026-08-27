// **GOS3** · compatibility shim
// Canonical implementation lives in runtime-loop.ts.
// Keep the .js entrypoint so Node/ESM resolution from orchestrator.ts works
// in environments that preserve explicit .js import specifiers.
export * from "./runtime-loop.ts";
