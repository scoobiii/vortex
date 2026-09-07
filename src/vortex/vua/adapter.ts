// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent — VUA P&D
// fase: Runtime Federation → VUA Contract
// data: 2026-09-07
// hora: 16:22
// antes: VUA proof dependia de canonical-json inexistente nesta árvore
// depois: canonicalização local determinística, sem dependência externa
// base: VUA v1 experimental
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git
import { createHash } from 'node:crypto';
import { AdapterIdentity, Capability, ExecutionProof, ExecutionRequest, ExecutionResult, UniversalAdapter, ValidationResult } from './types';

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(',')}}`;
}

export function validateCapabilities(request: ExecutionRequest, capabilities: readonly Capability[]): ValidationResult {
  const available = new Map(capabilities.map((capability) => [capability.id, capability]));
  const errors: string[] = [];
  for (const requested of request.requestedCapabilities) {
    const capability = available.get(requested);
    if (!capability) errors.push(`CAPABILITY_NOT_SUPPORTED:${requested}`);
    else if (capability.destructive && request.context?.allowDestructive !== true) errors.push(`DESTRUCTIVE_CAPABILITY_REQUIRES_EXPLICIT_ALLOW:${requested}`);
  }
  return { valid: errors.length === 0, errors, warnings: [] };
}

export abstract class BaseUniversalAdapter<TProposal = unknown> implements UniversalAdapter<TProposal> {
  abstract readonly identity: AdapterIdentity;
  abstract capabilities(): readonly Capability[];
  abstract validate(request: ExecutionRequest<TProposal>): ValidationResult;
  protected abstract executeValidated(request: ExecutionRequest<TProposal>): Promise<ExecutionResult>;
  async execute(request: ExecutionRequest<TProposal>): Promise<ExecutionResult> {
    const validation = this.validate(request);
    if (!validation.valid) throw new Error(`VUA_VALIDATION_FAILED:${validation.errors.join('|')}`);
    return this.executeValidated(request);
  }
}

export function createExecutionProof(request: ExecutionRequest, result: ExecutionResult, repositoryStateHash?: string, changeHash?: string): ExecutionProof {
  const unsigned = { protocol: 'vua/v1' as const, request, result, repositoryStateHash, changeHash };
  const proofHash = createHash('sha256').update(canonicalize(unsigned)).digest('hex');
  return { ...unsigned, proofHash };
}
