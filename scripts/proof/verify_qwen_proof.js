#!/usr/bin/env node
/**
 * GOS3 · proof verifier. Fails closed on missing or invalid execution evidence.
 */

const fs = require("node:fs");
const crypto = require("node:crypto");

const file = process.argv[2] || "proof/results.json";
const proof = JSON.parse(fs.readFileSync(file, "utf8"));
const failures = [];

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

if (proof.schema !== "vortex.execution-proof.v1") failures.push("wrong schema");
if (!proof.comparison?.same_request) failures.push("direct/Vortex request mismatch");
if (!proof.comparison?.same_output) failures.push("direct/Vortex output hash mismatch");
if (!proof.direct?.executed || proof.direct?.exit_code !== 0) failures.push("direct execution not proven");
if (!proof.vortex?.executed || proof.vortex?.exit_code !== 0) failures.push("Vortex execution not proven");
if (!proof.vortex?.evidence_hash) failures.push("missing Vortex evidence_hash");
if (!proof.request_hash) failures.push("missing request_hash");
if (proof.request_hash !== proof.direct?.request_hash || proof.request_hash !== proof.vortex?.request_hash) failures.push("request_hash mismatch");
if (!Number.isFinite(proof.direct?.duration_ms) || proof.direct.duration_ms <= 0) failures.push("invalid direct duration");
if (!Number.isFinite(proof.vortex?.duration_ms) || proof.vortex.duration_ms <= 0) failures.push("invalid Vortex duration");
if (!Number.isInteger(proof.direct?.completion_tokens) || proof.direct.completion_tokens <= 0) failures.push("direct token count missing");
if (!Number.isInteger(proof.vortex?.completion_tokens) || proof.vortex.completion_tokens <= 0) failures.push("Vortex token count missing");

const expectedPromptHash = sha256(
  "Write a JavaScript function that returns the nth Fibonacci number. Keep it concise and include one example call."
);
if (proof.prompt_sha256 !== expectedPromptHash) failures.push("prompt hash changed");

if (proof.vortex?.evidence_hash) {
  const expectedEvidenceHash = sha256(canonical({
    request_hash: proof.vortex.request_hash,
    stdout_hash: proof.vortex.stdout_hash,
    output_hash: proof.vortex.output_hash,
    executed: proof.vortex.executed,
    exit_code: proof.vortex.exit_code,
    invocation_id: proof.vortex.invocation_id,
  }));
  if (proof.vortex.evidence_hash !== expectedEvidenceHash) {
    failures.push("Vortex evidence_hash mismatch");
  }
}

const markdown = [
  "## Vortex / Qwen execution proof",
  "",
  `**GATE: ${failures.length ? "FAIL" : "PASS"}**`,
  "",
  "| Metric | Direct | Vortex |",
  "|---|---:|---:|",
  `| Duration | ${proof.direct.duration_ms.toFixed(2)} ms | ${proof.vortex.duration_ms.toFixed(2)} ms |`,
  `| Completion tokens | ${proof.direct.completion_tokens} | ${proof.vortex.completion_tokens} |`,
  `| tok/s | ${proof.direct.tok_per_s.toFixed(2)} | ${proof.vortex.tok_per_s.toFixed(2)} |`,
  `| stdout hash | \`${proof.direct.stdout_hash}\` | \`${proof.vortex.stdout_hash}\` |`,
  `| request hash | \`${proof.request_hash}\` | \`${proof.request_hash}\` |`,
  "",
  `**Vortex overhead:** ${proof.comparison.overhead_ms.toFixed(2)} ms (${proof.comparison.overhead_percent.toFixed(2)}%)`,
  "",
  `**Evidence hash:** \`${proof.vortex.evidence_hash}\``,
  "",
  "This proves the measured run on this runner. It does **not** generalize tok/s to A23, Apple Silicon, GPU, or another runtime.",
  "",
  failures.length ? `Failures: ${failures.join("; ")}` : "No proof-gate failures.",
  "",
].join("\n");

fs.writeFileSync("proof/proof.md", markdown);
console.log(markdown);
if (failures.length) process.exit(1);
