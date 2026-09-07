// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent
// fase: Connector Federation → GitHub MCP
// data: 2026-09-07
// hora: 00:00
// antes: MCP boundary was documentation only
// depois: executable MCP-facing operation descriptor
// base: GitHub connector request contract
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git

import type { GitHubInvokeRequest } from "../adapter/index";
export interface GitHubMcpToolRequest extends GitHubInvokeRequest { protocol: "mcp"; }
export function toGatewayRequest(request: GitHubMcpToolRequest): GitHubInvokeRequest { return { ...request, connector_id: "github" }; }
