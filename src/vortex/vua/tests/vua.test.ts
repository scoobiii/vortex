// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent — VUA P&D
// fase: Runtime Federation → VUA Tests
// data: 2026-09-07
// hora: 16:22
// antes: contrato VUA não tinha teste executável na árvore atual
// depois: teste de registry, MCP, validação destrutiva e proof hash
// base: VUA v1 experimental
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git
import assert from 'node:assert/strict';
import { BaseUniversalAdapter, createExecutionProof } from '../adapter';
import { RegistryMcpBridge } from '../mcp';
import { AdapterRegistry } from '../registry';
import { ExecutionRequest, ExecutionResult } from '../types';
class FixtureAdapter extends BaseUniversalAdapter<Record<string, unknown>> {
  readonly identity = { id: 'fixture', name: 'Fixture Adapter', version: '1.0.0', status: 'active' as const };
  capabilities() { return [{ id: 'fixture.echo', description: 'Echo input', destructive: false, offline: true }, { id: 'fixture.destroy', description: 'Destructive fixture', destructive: true, offline: false }]; }
  validate(request: ExecutionRequest<Record<string, unknown>>) { const errors = request.adapterId !== this.identity.id ? ['ADAPTER_ID_MISMATCH'] : []; const requested = new Set(this.capabilities().map((c) => c.id)); for (const capability of request.requestedCapabilities) if (!requested.has(capability)) errors.push(`CAPABILITY_NOT_SUPPORTED:${capability}`); return { valid: errors.length === 0, errors, warnings: [] }; }
  protected async executeValidated(request: ExecutionRequest<Record<string, unknown>>): Promise<ExecutionResult> { const now = new Date().toISOString(); return { requestId: request.requestId, success: true, startedAt: now, finishedAt: now, evidence: [{ kind: 'echo', value: request.proposal }] }; }
}
async function main(): Promise<void> {
  const adapter = new FixtureAdapter(); const registry = new AdapterRegistry(); registry.register(adapter); assert.equal(registry.has('fixture'), true); assert.equal(registry.list().length, 1); assert.throws(() => registry.register(adapter), /ADAPTER_ALREADY_REGISTERED/);
  const bridge = new RegistryMcpBridge(registry); assert.equal(bridge.listTools().length, 2); const result = await bridge.callTool({ name: 'fixture.fixture.echo', arguments: { hello: 'world' } }); assert.equal(result.success, true);
  const request: ExecutionRequest = { requestId: 'req-1', protocol: 'vua/v1', adapterId: 'fixture', proposal: {}, requestedCapabilities: ['fixture.echo'] }; const proof = createExecutionProof(request, result); assert.match(proof.proofHash, /^[a-f0-9]{64}$/); assert.equal(proof.protocol, 'vua/v1');
  console.log('VUA tests: PASS');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
