import { AdapterRegistry } from './registry';
import { ExecutionRequest, ExecutionResult } from './types';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface VuaMcpBridge {
  listTools(): readonly McpToolDefinition[];
  callTool(call: McpToolCall): Promise<ExecutionResult>;
}

export class RegistryMcpBridge implements VuaMcpBridge {
  public constructor(private readonly registry: AdapterRegistry) {}

  public listTools(): readonly McpToolDefinition[] {
    return this.registry.list().flatMap((adapter) =>
      adapter.capabilities.map((capability) => ({
        name: `${adapter.id}.${capability}`,
        description: `Vortex capability ${capability} exposed by ${adapter.name}`,
        inputSchema: { type: 'object', additionalProperties: true },
      })),
    );
  }

  public async callTool(call: McpToolCall): Promise<ExecutionResult> {
    const separator = call.name.indexOf('.');
    if (separator <= 0) throw new Error(`MCP_INVALID_TOOL_NAME:${call.name}`);
    const adapterId = call.name.slice(0, separator);
    const capability = call.name.slice(separator + 1);
    const adapter = this.registry.get(adapterId);
    const request: ExecutionRequest = {
      requestId: crypto.randomUUID(),
      protocol: 'vua/v1',
      adapterId,
      proposal: call.arguments,
      requestedCapabilities: [capability],
    };
    return adapter.execute(request);
  }
}
