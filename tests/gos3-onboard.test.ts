/**
 * GOS3
 * arquivo: tests/gos3-onboard.test.ts
 * responsabilidade: regressão do contrato onboard, bloqueio pré-CI e hashes antes/depois
 * agente: agent/llm
 * papel: Engineering Agent
 * fase: onboard
 * data: 2026-09-07
 * hora: 00:00
 * antes: sha256:pending
 * depois: pending
 * base: commit:main
 * assinatura: P0 scoobiii : Agente GPT
 * commit: pending
 */

import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  applyAgentChange,
  assertOnboarded,
  hashBody,
  onboardFile,
  parseGos3Header,
  preflightChangedFile,
  validateOnboardHeader,
} from "../src/gos3/onboard";

const options = {
  file: "src/example.ts",
  responsabilidade: "exemplo executável para teste de onboarding",
  agente: "agent/llm",
  papel: "Engineering Agent",
  date: "2026-09-07",
  time: "20:30",
  baseCommit: "abc123",
  assinatura: "P0 scoobiii : Agente GPT",
};

function expectThrow(fn: () => unknown, message: string): void {
  assert.throws(fn, new RegExp(message));
}

const blank = onboardFile("", options);
assert.equal(blank.phase, "onboard");
assert.equal(blank.onboarded, true);
assert.equal(blank.header.arquivo, options.file);
assert.equal(blank.header.fase, "onboard");
assert.equal(blank.header.antes, hashBody(""));
assert.equal(blank.header.depois, "pending");
assert.equal(blank.header.base, "commit:abc123");
assert.equal(parseGos3Header(blank.content)?.fase, "onboard");
validateOnboardHeader(blank.content, options.file);

const readyBody = "export const answer = 41;\n";
const ready = onboardFile(readyBody, options);
assert.equal(ready.originalBody, readyBody);
assert.equal(ready.header.antes, `sha256:${crypto.createHash("sha256").update(readyBody).digest("hex")}`);
assert.match(ready.content, /^\/\*\n \* GOS3\n/);

const changed = applyAgentChange(ready, "export const answer = 42;\n", { date: "2026-09-07", time: "20:31" });
assert.equal(changed.changed, true);
assert.equal(changed.header.fase, "implementation");
assert.equal(changed.header.antes, ready.originalHash);
assert.equal(changed.header.depois, `sha256:${crypto.createHash("sha256").update("export const answer = 42;\n").digest("hex")}`);
assert.equal(changed.header.commit, "pending");
assert.deepEqual(preflightChangedFile(changed.content, options.file), { header: changed.header, bodyHash: changed.finalHash });

expectThrow(() => validateOnboardHeader(changed.content, options.file), "phase must start at onboard");

const tampered = changed.content.replace("answer = 42", "answer = 43");
expectThrow(() => preflightChangedFile(tampered, options.file), "depois hash mismatch");

expectThrow(() => preflightChangedFile(readyBody, options.file), "canonical header is missing or invalid");

const fakeSession = { ...ready, phase: "implementation" as const };
expectThrow(() => assertOnboarded(fakeSession as never), "agent must onboard");

const python = onboardFile("print('ok')\n", { ...options, file: "scripts/example.py" });
assert.match(python.content, /^# GOS3\n# arquivo: scripts\/example\.py\n/);
assert.equal(parseGos3Header(python.content)?.fase, "onboard");

const html = onboardFile("<main>ok</main>\n", { ...options, file: "docs/example.html" });
assert.match(html.content, /^<!--\nGOS3\narquivo: docs\/example\.html\n/);
assert.equal(parseGos3Header(html.content)?.fase, "onboard");

console.log("GOS3 ONBOARD CONTRACT: PASS");
console.log(`blank.before=${blank.header.antes}`);
console.log(`changed.after=${changed.header.depois}`);
console.log("pre-CI gate: PASS");
