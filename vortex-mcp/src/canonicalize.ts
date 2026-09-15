// GOS3 · Vortex Foundation conformance artifact
/**
 * spec/execution-proof.md §11 — Canonicalization.
 * Adopts JSON Canonicalization Scheme (JCS, RFC 8785) rather than a
 * bespoke Vortex canonicalization. This guarantees that independent
 * implementations (Java, Go, Rust, Python, TypeScript) that each use
 * a conformant JCS library produce byte-identical signing input.
 */
import { createRequire } from "node:module";
import { createHash } from "node:crypto";

const require = createRequire(import.meta.url);
const canonicalizeImpl = require("canonicalize") as (value: unknown) => string | undefined;

export function jcs(value: unknown): string {
  const out = canonicalizeImpl(value);
  if (out === undefined) {
    throw new Error("JCS canonicalization failed: value is not JSON-serializable");
  }
  return out;
}

export function sha256Hex(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export function sha256Tagged(data: string | Buffer): string {
  return `sha256:${sha256Hex(data)}`;
}

/**
 * Produces the exact byte sequence that must be signed / verified for
 * an ExecutionProof: JCS(proof without `signature`) → UTF-8 bytes.
 * spec/execution-proof.md §11, §12.
 */
export function signableBytes(proofWithoutSignature: unknown): Buffer {
  return Buffer.from(jcs(proofWithoutSignature), "utf8");
}
