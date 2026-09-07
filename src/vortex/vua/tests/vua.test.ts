import assert from 'node:assert/strict';
import { BaseUniversalAdapter, createExecutionProof } from '../adapter';
import { RegistryMcpBridge } from '../mcp';
import { AdapterRegistry } from '../registry';
import { ExecutionRequest, ExecutionResult } from '../types';

class FixtureAdapter extends BaseUniversalAdapter<Record<string, unknown>> {
  readonly identity = { id: 'fixture', name: 'Fixture Adapter', version: '1.0.0', status: 'active' as const };
  capabilities() {
    return [
      { id: 'fixture.echo', description: 'Echo input', destructive: false, offline: true },
      { id: 'fixture.destroy', description: 'Destructive fixture', destructive: true, offline: false },
    ];
  }
  validate(request: ExecutionRequest<Record<string, unknown>>) {
    const capabilityResult = this.capabilities().filter((c) => request.requestedCapabilities.includes(c.id));
    const errors = request.adapterId !== this.identity.id ? ['ADAPTER_ID_MISMATCH'] : [];
    if (capabilityResult.length !== request.requestedCapabilities.length) errors.push('CAPABILITY_NOT_SUPPORTED');
    return { valid: errors.length === 0, errors, warnings: [] };
  }
  protected async executeValidated(request: ExecutionRequest<Record<string, unknown>>): Promise<ExecutionResult> {
    const now = new Date().toISOString();
    return { requestId: request.requestId, success: true, startedAt: now, finishedAt: now, evidence: [{ kind: 'echo', value: request.proposal }] };
  }
}

async function main(): Promise<void> {
  const adapter = new FixtureAdapter();
  const registry = new AdapterRegistry();
  registry.register(adapter);
  assert.equal(registry.has('fixture'), true);
  assert.equal(registry.list().length, 1);
  assert.throws(() => registry.register(adapter), /ADAPTER_ALREADY_REGISTERED/);

  const bridge = new RegistryMcpBridge(registry);
  assert.equal(bridge.listTools().length, 2);
  const result = await bridge.callTool({ name: 'fixture.fixture.echo', arguments: { hello: 'world' } });
  assert.equal(result.success, true);

  const request: ExecutionRequest = {
    requestId: 'req-1', protocol: 'vua/v1', adapterId: 'fixture', proposal: {}, requestedCapabilities: ['fixture.echo'],
  };
  const proof = createExecutionProof(request, result);
  assert.match(proof.proofHash, /^[a-f0-9]{64}$/);
  assert.equal(proof.protocol, 'vua/v1');

  console.log('VUA tests: PASS');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
