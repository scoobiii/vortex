// GOS3 · Vortex Foundation benchmark gate
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = process.env.VORTEX_ROOT ?? dirname(dirname(fileURLToPath(import.meta.url)));
const moduleName = process.argv.includes('--module') ? process.argv[process.argv.indexOf('--module') + 1] : '';
if (!['gateway', 'mcp'].includes(moduleName)) throw new Error('--module gateway|mcp is required');
function percentile(values, p) { const sorted = [...values].sort((a, b) => a - b); if (!sorted.length) return 0; return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]; }
async function gatewayBench() {
  const mod = await import(pathToFileURL(join(root, 'vortex-gateway', 'dist', 'src', 'index.js')).href);
  const { Gateway, StaticTokenAuthenticator, ConnectorRegistry, CredentialBroker } = mod;
  class BenchConnector { id = 'bench'; operations = ['ping']; async invoke(input) { return { ok: input.value + 1 }; } }
  const gateway = new Gateway({ authenticator: new StaticTokenAuthenticator({ token: 'bench-agent' }), connectors: new ConnectorRegistry().register(new BenchConnector()), credentials: new CredentialBroker(), runtime_id: 'ci-benchmark' });
  const samples = []; const count = 1000; let errors = 0; const start = performance.now();
  for (let i = 0; i < count; i++) { const t = performance.now(); try { await gateway.invoke({ request_id: `bench-${i}`, connector_id: 'bench', operation: 'ping', input: { value: i } }, 'bench-agent'); } catch { errors++; } samples.push(performance.now() - t); }
  const elapsed = performance.now() - start; const concurrent = 200; const stressStart = performance.now();
  const results = await Promise.allSettled(Array.from({ length: concurrent }, (_, i) => gateway.invoke({ request_id: `stress-${i}`, connector_id: 'bench', operation: 'ping', input: { value: i } }, 'bench-agent')));
  const stressErrors = results.filter(r => r.status === 'rejected').length; const stressElapsed = performance.now() - stressStart;
  return { module: 'gateway', count, duration_ms: Number(elapsed.toFixed(3)), ops_per_sec: Number((count / (elapsed / 1000)).toFixed(3)), p50_ms: Number(percentile(samples, 50).toFixed(3)), p95_ms: Number(percentile(samples, 95).toFixed(3)), p99_ms: Number(percentile(samples, 99).toFixed(3)), error_rate: errors / count, stress_concurrency: concurrent, stress_ops_per_sec: Number((concurrent / (stressElapsed / 1000)).toFixed(3)), stress_errors: stressErrors };
}
async function mcpBench() {
  const [canonical, proof, identity] = await Promise.all([import(pathToFileURL(join(root, 'vortex-mcp', 'dist', 'canonicalize.js')).href), import(pathToFileURL(join(root, 'vortex-mcp', 'dist', 'proof.js')).href), import(pathToFileURL(join(root, 'vortex-mcp', 'dist', 'identity.js')).href)]);
  const keypair = identity.generateKeypair('ci-benchmark-key'); const ctx = { principal_id: 'ci-principal', agent_id: 'ci-agent', policy_id: 'ci-policy', policy_version: '1', capability: 'bench', scope: {} };
  const samples = []; const count = 1000; let errors = 0; const start = performance.now();
  for (let i = 0; i < count; i++) { const t = performance.now(); try { proof.buildAndSignProof({ requestId: `bench-${i}`, runtimeId: 'ci-benchmark', connectorId: 'bench', operation: 'execute', ctx, input: { value: i }, output: { ok: true }, executed: true, status: 'EXECUTION_SUCCESS', startedAt: new Date(0), completedAt: new Date(1), keypair }); } catch { errors++; } samples.push(performance.now() - t); }
  const elapsed = performance.now() - start; const stress = 200; const stressStart = performance.now();
  const results = await Promise.allSettled(Array.from({ length: stress }, (_, i) => Promise.resolve().then(() => proof.buildAndSignProof({ requestId: `stress-${i}`, runtimeId: 'ci-benchmark', connectorId: 'bench', operation: 'execute', ctx, input: { value: i }, output: { ok: true }, executed: true, status: 'EXECUTION_SUCCESS', startedAt: new Date(0), completedAt: new Date(1), keypair }))));
  const stressErrors = results.filter(r => r.status === 'rejected').length; const stressElapsed = performance.now() - stressStart;
  return { module: 'mcp', count, duration_ms: Number(elapsed.toFixed(3)), ops_per_sec: Number((count / (elapsed / 1000)).toFixed(3)), p50_ms: Number(percentile(samples, 50).toFixed(3)), p95_ms: Number(percentile(samples, 95).toFixed(3)), p99_ms: Number(percentile(samples, 99).toFixed(3)), error_rate: errors / count, stress_concurrency: stress, stress_ops_per_sec: Number((stress / (stressElapsed / 1000)).toFixed(3)), stress_errors: stressErrors, canonicalization_hash: createHash('sha256').update(canonical.jcs({ benchmark: 'foundation', count })).digest('hex') };
}
console.log(JSON.stringify(moduleName === 'gateway' ? await gatewayBench() : await mcpBench()));
