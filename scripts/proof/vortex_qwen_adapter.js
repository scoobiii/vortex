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
  return JSON.stringify(value, Object.keys(value).sort());
}

async function invoke(request, { baseUrl = "http://127.0.0.1:8080/v1" } = {}) {
  const started = process.hrtime.bigint();
  const requestJson = canonical(request);
  const requestHash = sha256(requestJson);
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: requestJson,
    });

    const text = await response.text();
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    const stdoutHash = sha256(text);

    if (!response.ok) {
      return {
        invocation_id: request.invocation_id,
        agent: "qwen-local",
        executed: false,
        status: "error",
        exit_code: 1,
        duration_ms: durationMs,
        request_hash: requestHash,
        stdout_hash: stdoutHash,
        evidence_hash: sha256(canonical({ request_hash: requestHash, stdout_hash: stdoutHash, executed: false })),
        error: `HTTP ${response.status}: ${text.slice(0, 500)}`,
      };
    }

    const parsed = JSON.parse(text);
    const usage = parsed.usage || {};
    const completionTokens = Number(usage.completion_tokens || 0);
    const evidence = {
      request_hash: requestHash,
      stdout_hash: stdoutHash,
      executed: true,
      exit_code: 0,
      invocation_id: request.invocation_id,
    };

    return {
      invocation_id: request.invocation_id,
      agent: "qwen-local",
      executed: true,
      status: "success",
      exit_code: 0,
      duration_ms: durationMs,
      completion_tokens: completionTokens,
      tok_per_s: completionTokens > 0 ? completionTokens / (durationMs / 1000) : 0,
      request_hash: requestHash,
      stdout_hash: stdoutHash,
      evidence_hash: sha256(canonical(evidence)),
      output: parsed.choices?.[0]?.message?.content ?? "",
    };
  } catch (error) {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    const message = error instanceof Error ? error.message : String(error);
    return {
      invocation_id: request.invocation_id,
      agent: "qwen-local",
      executed: false,
      status: "error",
      exit_code: 1,
      duration_ms: durationMs,
      request_hash: requestHash,
      stdout_hash: sha256(message),
      evidence_hash: sha256(canonical({ request_hash: requestHash, executed: false, error: message })),
      error: message,
    };
  }
}

module.exports = { invoke, sha256, canonical };
