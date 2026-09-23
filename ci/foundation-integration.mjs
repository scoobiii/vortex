// GOS3 · Vortex Foundation conformance artifact
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
const root = resolve(import.meta.dirname, '..');
const gw = await import(pathToFileURL(join(root, 'vortex-gateway', 'dist', 'src', 'index.js')).href);
const mcpProof = await import(pathToFileURL(join(root, 'vortex-mcp', 'dist', 'proof.js')).href);
const mcpIdentity = await import(pathToFileURL(join(root, 'vortex-mcp', 'dist', 'identity.js')).href);
if (!gw.Gateway || !gw.FilesystemConnector || !mcpProof.buildAndSignProof || !mcpIdentity.generateKeypair) throw new Error('foundation exports missing');
const dir = await mkdtemp(join(tmpdir(), 'vortex-foundation-int-'));
try {
  const gateway = new gw.Gateway({ authenticator: new gw.StaticTokenAuthenticator({ token: 'integration-agent' }), connectors: new gw.ConnectorRegistry().register(new gw.FilesystemConnector(dir)), credentials: new gw.CredentialBroker(), runtime_id: 'integration-gateway' });
  const result = await gateway.invoke({ request_id: 'integration-1', connector_id: 'filesystem', operation: 'write', input: { path: 'artifact.txt', content: 'foundation' } }, 'integration-agent');
  if (!result.ok || result.proof.executed !== true) throw new Error('Gateway real integration execution failed');
  const artifact = await readFile(join(dir, 'artifact.txt'), 'utf8');
  if (artifact !== 'foundation') throw new Error('Gateway artifact verification failed');
  const keypair = mcpIdentity.generateKeypair('integration-key');
  const proof = mcpProof.buildAndSignProof({ requestId: 'mcp-proof-1', runtimeId: 'integration-mcp', connectorId: 'filesystem', operation: 'write', ctx: { principal_id: 'p', agent_id: 'a', policy_id: 'policy', policy_version: '1', capability: 'filesystem.write', scope: {}, sandbox_id: 's' }, input: { path: 'artifact.txt' }, output: { bytes_written: 10 }, executed: true, status: 'EXECUTION_SUCCESS', startedAt: new Date(0), completedAt: new Date(10), keypair });
  if (!proof.signature || proof.identity.algorithm !== 'Ed25519') throw new Error('MCP signed proof integration failed');
  console.log(JSON.stringify({ gateway: 'PASS', gateway_artifact: artifact, mcp_signed_proof: 'PASS', mcp_proof_version: proof.proof_version }));
} finally { await rm(dir, { recursive: true, force: true }); }
