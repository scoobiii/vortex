// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent — VUA P&D
// fase: Runtime Federation → VUA Registry
// data: 2026-09-07
// hora: 16:22
// antes: nenhum registro executável de adapters VUA
// depois: registry tipado com unicidade e descoberta de capabilities
// base: VUA v1 experimental
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git
import { UniversalAdapter } from './types';
export interface AdapterDescriptor { id: string; name: string; version: string; status: 'active' | 'experimental' | 'deprecated'; environments: readonly string[]; capabilities: readonly string[]; offline: boolean; }
export class AdapterRegistry {
  private readonly adapters = new Map<string, UniversalAdapter>();
  register(adapter: UniversalAdapter): void { const id = adapter.identity.id; if (this.adapters.has(id)) throw new Error(`ADAPTER_ALREADY_REGISTERED:${id}`); this.adapters.set(id, adapter); }
  get(id: string): UniversalAdapter { const adapter = this.adapters.get(id); if (!adapter) throw new Error(`ADAPTER_NOT_FOUND:${id}`); return adapter; }
  has(id: string): boolean { return this.adapters.has(id); }
  list(): readonly AdapterDescriptor[] { return [...this.adapters.values()].map((adapter) => ({ id: adapter.identity.id, name: adapter.identity.name, version: adapter.identity.version, status: adapter.identity.status, environments: adapter.identity.environments ?? [], capabilities: adapter.capabilities().map((capability) => capability.id), offline: adapter.capabilities().every((capability) => capability.offline) })); }
}
