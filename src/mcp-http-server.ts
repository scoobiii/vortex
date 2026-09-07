/**
 * Data:            2026-09-05
 * Diretório:       src/mcp-http-server.ts
  * Responsabilidade: Expõe servidor MCP via HTTP Streamable com autenticação por token.
 * Versão:          1.0.0
 * Assinatura:      ASSINATURA-DESCONHECIDA (sem histórico git)
 */


import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerTools } from "./tools.js";

const HOST = process.env.MCP_HTTP_HOST ?? "127.0.0.1";
const PORT = Number(process.env.MCP_HTTP_PORT ?? 8787);
const MCP_TOKEN = process.env.MCP_TOKEN;

if (!MCP_TOKEN || MCP_TOKEN.length < 24) {
  throw new Error("Defina MCP_TOKEN com pelo menos 24 caracteres.");
}

type Session = {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
};

const sessions = new Map<string, Session>();

function authorized(req: IncomingMessage): boolean {
  const supplied = req.headers.authorization?.replace(/^Bearer\\s+/i, "") ?? "";
  const a = Buffer.from(supplied);
  const b = Buffer.from(MCP_TOKEN!);
  return a.length === b.length && timingSafeEqual(a, b);
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : undefined;
}

const httpServer = createServer(async (req, res) => {
  if (req.url !== "/mcp") return json(res, 404, { error: "not_found" });
  if (!authorized(req)) return json(res, 401, { error: "unauthorized" });

  try {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let session = sessionId ? sessions.get(sessionId) : undefined;

    if (req.method === "POST" && !session) {
      const mcp = new McpServer({ name: "vortex-github-gos3", version: "0.2.0" });
      registerTools(mcp);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, { server: mcp, transport });
        },
      });
      transport.onclose = () => {
        if (transport.sessionId) sessions.delete(transport.sessionId);
      };
      await mcp.connect(transport);
      session = { server: mcp, transport };
    }

    if (!session) return json(res, 404, { error: "invalid_or_missing_session" });

    const body = req.method === "POST" ? await readBody(req) : undefined;
    await session.transport.handleRequest(req, res, body);
  } catch (error) {
    if (!res.headersSent) json(res, 500, { error: "internal_error" });
    else res.end();
    console.error(error);
  }
});

httpServer.listen(PORT, HOST, () => {
  console.error(`Vortex MCP HTTP ativo em http://${HOST}:${PORT}/mcp`);
});
