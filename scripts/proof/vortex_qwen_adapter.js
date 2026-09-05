#!/usr/bin/env node
/**
 * GOS3 · Vortex execution-proof adapter
 * Purpose: prove the local OpenAI-compatible Qwen path without secrets.
 * This is a proof adapter, not a production agent connector.
 */

const crypto = require("node:crypto");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function evidenceHash(evidence) {
  return sha256(canonical(evidence));
}

async function invoke(request, { baseUrl = "http://127.0.0.1:8080/v1" } = {}) {
  const started = process.hrtime.bigint();
  const requestJson = canonical(request);
  const requestHash = sha256(requestJson);
  const invocationId = request.invocation_id;
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  const failed = (status, error, stdoutHash) => ({
    invocation_id: invocationId,
    agent: "qwen-local",
    executed: false,
    status,
    exit_code: 1,
    duration_ms: Number(process.hrtime.bigint() - started) / 1e6,
    request_hash: requestHash,
    execution_evidence: null,
    output: null,
    stdout_hash: stdoutHash,
    error,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: requestJson,
    });
    const text = await response.text();
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    const stdoutHash = sha256(text);

    if (!response.ok) return failed("http_error", `HTTP ${response.status}: ${text.slice(0, 500)}`, stdoutHash);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return failed("invalid_json", "HTTP 200 without valid JSON completion", stdoutHash);
    }

    const output = parsed.choices?.[0]?.message?.content;
    const completionTokens = Number(parsed.usage?.completion_tokens || 0);
    const responseId = parsed.id;

    // HTTP 200 is transport success only. Execution is proven only by a valid
    // completion object with an id, non-empty output and positive token count.
    if (typeof responseId !== "string" || !responseId || typeof output !== "string" || !output || !Number.isInteger(completionTokens) || completionTokens <= 0) {
      return failed("execution_unproven", "HTTP 200 did not contain independently usable completion evidence", stdoutHash);
    }

    const outputHash = sha256(output);
    const executionEvidence = {
      response_id: responseId,
      request_hash: requestHash,
      stdout_hash: stdoutHash,
      output_hash: outputHash,
      invocation_id: invocationId,
      executed: true,
      exit_code: 0,
      completion_tokens: completionTokens,
    };

    return {
      invocation_id: invocationId,
      agent: "qwen-local",
      executed: true,
      status: "success",
      exit_code: 0,
      duration_ms: durationMs,
      completion_tokens: completionTokens,
      tok_per_s: completionTokens / (durationMs / 1000),
      request_hash: requestHash,
      stdout_hash: stdoutHash,
      output: { text: output, output_hash: outputHash, stdout_hash: stdoutHash },
      execution_evidence: {
        ...executionEvidence,
        evidence_hash: evidenceHash(executionEvidence),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failed("transport_error", message, sha256(message));
  }
}

module.exports = { invoke, sha256, canonical, evidenceHash };
