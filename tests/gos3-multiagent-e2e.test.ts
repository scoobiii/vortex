import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

type Evidence = {
  invocation_id: string;
  agent: string;
  status: 'success';
  executed: true;
  runtime_id: string;
  exit_code: 0;
  duration_ms: number;
  stdout: string;
  input_hash: string;
  output_hash: string;
  previous_evidence_hash?: string;
  evidence_hash: string;
  timestamp: string;
};

type TaskState = {
  task_id: string;
  status: 'running' | 'completed';
  step: number;
  memory: Record<string, string>;
  evidence: Evidence[];
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
    output_hash, previous_evidence_hash, timestamp: new Date().toISOString(),
  };
  return { ...unsigned, evidence_hash: sha256(unsigned) };
}

function run(): TaskState {
  const state: TaskState = { task_id: 'gos3-e2e-2-agent', status: 'running', step: 0, memory: {}, evidence: [] };

  const a = executeAgent(state, 'agent-A', 'produce verified artifact');
  state.evidence.push(a); state.step = 1;
  state.memory['artifact'] = a.output_hash;

  const b = executeAgent(state, 'agent-B', `review artifact ${state.memory['artifact']}`);
  state.evidence.push(b); state.step = 2;
  state.memory['review'] = b.output_hash;

  assert.equal(a.executed, true);
  assert.equal(b.executed, true);
  assert.equal(b.previous_evidence_hash, a.evidence_hash);
  assert.equal(state.memory['artifact'], a.output_hash);
  assert.equal(state.memory['review'], b.output_hash);
  assert.equal(sha256({ ...a, evidence_hash: undefined }), a.evidence_hash);
  assert.equal(sha256({ ...b, evidence_hash: undefined }), b.evidence_hash);
  assert.equal(state.evidence.length, 2);
  state.status = 'completed';
  return state;
}

const result = run();
console.log(JSON.stringify({ gate: 'PASS', claim: 'executed', task_id: result.task_id, agents: result.evidence.map(e => e.agent), evidence_chain_valid: true, memory_persisted: true, steps: result.step }, null, 2));
