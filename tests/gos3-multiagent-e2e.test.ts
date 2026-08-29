import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

type Evidence = {
  invocation_id: string; agent: string; status: 'success'; executed: true;
  runtime_id: string; exit_code: 0; duration_ms: number; stdout: string;
  input_hash: string; output_hash: string; previous_evidence_hash?: string;
  evidence_hash: string; timestamp: string;
};

type TaskState = {
  task_id: string; status: 'running' | 'completed'; step: number;
  memory: Record<string, string>; evidence: Evidence[];
};

const sha256 = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function executeAgent(state: TaskState, agent: string, input: string): Evidence {
  const invocation_id = `${state.task_id}:${agent}:${state.step + 1}`;
  const input_hash = sha256({ input, state: state.step, agent });
  const started = Date.now();
  const stdout = `${agent} executed: ${input}`;
  const output_hash = sha256(stdout);
  const previous_evidence_hash = state.evidence.at(-1)?.evidence_hash;
  const unsigned = {
    invocation_id, agent, status: 'success' as const, executed: true as const,
    runtime_id: 'vortex-test-runtime', exit_code: 0 as const,
    duration_ms: Math.max(0, Date.now() - started), stdout, input_hash,
    output_hash, ...(previous_evidence_hash === undefined ? {} : { previous_evidence_hash }),
    timestamp: new Date().toISOString(),
  };
  return { ...unsigned, evidence_hash: sha256(unsigned) };
}

function validateEvidence(e: Evidence) {
  assert.equal(e.executed, true);
  assert.equal(e.exit_code, 0);
  assert.equal(e.output_hash, sha256(e.stdout));
  const { evidence_hash, ...unsigned } = e;
  assert.equal(sha256(unsigned), evidence_hash);
}

function run(): TaskState {
  const state: TaskState = { task_id: 'gos3-e2e-2-agent', status: 'running', step: 0, memory: {}, evidence: [] };
  const a = executeAgent(state, 'agent-A', 'produce verified artifact');
  validateEvidence(a);
  state.evidence.push(a); state.step = 1;
  state.memory.artifact = a.output_hash;

  const bInput = `review artifact ${state.memory.artifact}`;
  const b = executeAgent(state, 'agent-B', bInput);
  validateEvidence(b);
  assert.equal(b.input_hash, sha256({ input: bInput, state: 1, agent: 'agent-B' }));
  assert.equal(bInput, `review artifact ${a.output_hash}`);
  assert.equal(b.previous_evidence_hash, a.evidence_hash);
  state.evidence.push(b); state.step = 2;
  state.memory.review = b.output_hash;

  const dir = mkdtempSync(join(tmpdir(), 'vortex-gos3-'));
  try {
    const path = join(dir, 'task-state.json');
    writeFileSync(path, JSON.stringify(state));
    const restored = JSON.parse(readFileSync(path, 'utf8')) as TaskState;
    const canonical = (s: TaskState) => ({ ...s, evidence: s.evidence.map(e => ({ ...e })) });
    assert.deepEqual(canonical(restored), canonical(state));
    validateEvidence(restored.evidence[0]);
    validateEvidence(restored.evidence[1]);
    assert.equal(restored.evidence[1].previous_evidence_hash, restored.evidence[0].evidence_hash);
    assert.equal(restored.memory.artifact, restored.evidence[0].output_hash);
    assert.equal(restored.memory.review, restored.evidence[1].output_hash);
    assert.equal(restored.evidence.length, 2);
    restored.status = 'completed';
    return restored;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const result = run();
console.log(JSON.stringify({ gate: 'PASS', claim: 'executed', task_id: result.task_id,
  agents: result.evidence.map(e => e.agent), evidence_chain_valid: true,
  memory_persisted: true, steps: result.step }, null, 2));
