// GOS3 · Vortex Foundation conformance artifact
import type { InvokeRequest } from "./types.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const ID_RE = /^[A-Za-z0-9._-]{1,128}$/;

/**
 * Structural validation of an InvokeRequest, independent of any connector
 * or credential registry (that resolution happens later in the pipeline —
 * see connector-registry.ts / credential-broker.ts). This function only
 * asks: "is this a well-formed request at all?"
 */
export function validateInvokeRequest(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { valid: false, errors: ["request must be a JSON object"] };
  }

  const v = value as Record<string, unknown>;

  if (typeof v.request_id !== "string" || !REQUEST_ID_RE.test(v.request_id)) {
    errors.push("request_id must be a non-empty string matching " + REQUEST_ID_RE);
  }
  if (typeof v.connector_id !== "string" || !ID_RE.test(v.connector_id)) {
    errors.push("connector_id must be a non-empty string matching " + ID_RE);
  }
  if (typeof v.operation !== "string" || v.operation.length === 0) {
    errors.push("operation must be a non-empty string");
  }
  if (!("input" in v)) {
    errors.push("input is required (use null explicitly if there is none)");
  }
  if (v.credential_id !== undefined && typeof v.credential_id !== "string") {
    errors.push("credential_id, if present, must be a string");
  }
  if (v.timeout_ms !== undefined) {
    if (typeof v.timeout_ms !== "number" || !Number.isFinite(v.timeout_ms) || v.timeout_ms <= 0) {
      errors.push("timeout_ms, if present, must be a positive finite number");
    }
  }
  if (v.metadata !== undefined) {
    if (typeof v.metadata !== "object" || v.metadata === null || Array.isArray(v.metadata)) {
      errors.push("metadata, if present, must be a JSON object");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function isInvokeRequest(value: unknown): value is InvokeRequest {
  return validateInvokeRequest(value).valid;
}
