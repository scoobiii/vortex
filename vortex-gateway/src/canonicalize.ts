import { createHash } from "node:crypto";

/**
 * Deterministic JSON canonicalization: object keys sorted recursively,
 * no whitespace. This is intentionally dependency-free (no `canonicalize`
 * package) so the Gateway has zero runtime dependencies. It is sufficient
 * for JSON-compatible values (objects, arrays, strings, numbers, booleans,
 * null) which is the entire domain of InvokeRequest.input / connector output.
 *
 * NaN, Infinity, undefined, functions, symbols and bigints are not valid
 * JSON — canonicalize() throws on them rather than silently coercing,
 * because a silent coercion would make input_hash / output_hash lie about
 * what was actually hashed.
 */
export function canonicalize(value: unknown): string {
  return stringify(value);
}

function stringify(value: unknown): string {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "number") {
    if (!Number.isFinite(value as number)) {
      throw new TypeError("canonicalize: non-finite number is not valid JSON");
    }
    return JSON.stringify(value);
  }
  if (t === "boolean" || t === "string") return JSON.stringify(value);
  if (t === "undefined") {
    throw new TypeError("canonicalize: undefined is not valid JSON");
  }
  if (t === "function" || t === "symbol" || t === "bigint") {
    throw new TypeError(`canonicalize: ${t} is not valid JSON`);
  }
  if (Array.isArray(value)) {
    return "[" + value.map((v) => stringify(v)).join(",") + "]";
  }
  // plain object
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const parts = keys.map((k) => `${JSON.stringify(k)}:${stringify(obj[k])}`);
  return "{" + parts.join(",") + "}";
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** sha256 of the canonical form of a value, prefixed per Vortex convention. */
export function hashValue(value: unknown): string {
  return "sha256:" + sha256Hex(canonicalize(value));
}
