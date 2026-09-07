#!/usr/bin/env node
// GOS3 · agente: agent/llm · papel: Engineering Agent · PO: scoobiii
// fase: Technical Refinement → Governance Enforcement · data: 2026-09-07 · hora: registrada pelo Git
// antes: o CI aceitava qualquer ocorrência de GOS3 nas primeiras 20 linhas.
// depois: o gate valida os campos de proveniência do cabeçalho GOS3 em todos os arquivos de texto alterados.
// base: commit `feat/rhino-cad-connector`
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registrado pelo Git no commit que contém esta alteração.

const { execFileSync } = require("node:child_process");
const { readFileSync, existsSync } = require("node:fs");

const baseSha = process.env.BASE_SHA || process.argv[2];
if (!baseSha) {
  console.error("check-headers: BASE_SHA is required");
  process.exit(1);
}

const binaryExtensions = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".zip", ".gz", ".tar", ".pdf", ".woff", ".woff2",
]);

const required = [
  /GOS3/,
  /agente\s*:/i,
  /papel\s*:/i,
  /fase\s*:/i,
  /data\s*:/i,
  /hora\s*:/i,
  /antes\s*:/i,
  /depois\s*:/i,
  /base\s*:/i,
  /assinatura\s*:/i,
  /commit\s*:/i,
];

function changedFiles() {
  const output = execFileSync("git", ["diff", "--name-only", `${baseSha}...HEAD`], { encoding: "utf8" });
  return output.split(/\r?\n/).filter(Boolean);
}

let failures = 0;
for (const file of changedFiles()) {
  if (!existsSync(file)) continue;
  const lower = file.toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot >= 0 && binaryExtensions.has(lower.slice(dot))) {
    console.log(`SKIP binary: ${file}`);
    continue;
  }

  const header = readFileSync(file, "utf8").split(/\r?\n/).slice(0, 20).join("\n");
  const missing = required.filter((pattern) => !pattern.test(header)).map((pattern) => pattern.source);
  if (missing.length > 0) {
    console.error(`FAIL: ${file}`);
    console.error(`  missing: ${missing.join(", ")}`);
    failures += 1;
  } else {
    console.log(`PASS: ${file}`);
  }
}

if (failures > 0) {
  console.error(`check-headers: FAIL (${failures} file(s))`);
  process.exit(1);
}
console.log("check-headers: PASS");
