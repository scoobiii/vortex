import type { CapabilityDeclaration, SandboxScope } from "./types.js";

/**
 * spec §6/§16 — a connector implements one or more capabilities.
 * The server (not the connector) is responsible for identity,
 * authorization, GOS3 onboarding, replay checks and proof
 * generation; the connector only performs the bounded operation
 * once all of that has already passed.
 */
export interface VortexConnector {
  readonly connectorId: string;
  readonly capabilities: CapabilityDeclaration[];

  /** Read-only. Must not produce side effects. */
  inspect(operation: string, args: Record<string, unknown>, sandbox: SandboxScope): Promise<unknown>;

  /** Must NOT execute; returns a description of the intended change. */
  propose(operation: string, args: Record<string, unknown>, sandbox: SandboxScope): Promise<unknown>;

  /** Executes a previously-authorized mutating operation. */
  execute(operation: string, args: Record<string, unknown>, sandbox: SandboxScope): Promise<unknown>;
}
