export type VuaProtocolVersion = 'vua/v1';

export type AdapterStatus = 'active' | 'experimental' | 'deprecated';

export interface AdapterIdentity {
  id: string;
  name: string;
  version: string;
  status: AdapterStatus;
}

export interface Capability {
  id: string;
  description: string;
  destructive: boolean;
  offline: boolean;
}

export interface ExecutionRequest<TProposal = unknown> {
  requestId: string;
  protocol: VuaProtocolVersion;
  adapterId: string;
  proposal: TProposal;
  requestedCapabilities: string[];
  context?: Record<string, unknown>;
}

export interface ExecutionEvidence {
  kind: string;
  value: unknown;
}

export interface ExecutionResult {
  requestId: string;
  success: boolean;
  startedAt: string;
  finishedAt: string;
  evidence: ExecutionEvidence[];
  metrics?: Record<string, number>;
  error?: { code: string; message: string };
}

export interface ExecutionProof {
  protocol: VuaProtocolVersion;
  request: ExecutionRequest;
  result: ExecutionResult;
  repositoryStateHash?: string;
  changeHash?: string;
  proofHash: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface UniversalAdapter<TProposal = unknown> {
  readonly identity: AdapterIdentity;
  capabilities(): readonly Capability[];
  validate(request: ExecutionRequest<TProposal>): ValidationResult;
  execute(request: ExecutionRequest<TProposal>): Promise<ExecutionResult>;
}
