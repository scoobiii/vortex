/**
 * GOS3 · Vortex Universal Connector Gateway · production MVP HTTP server.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { createServer, IncomingMessage, Server, ServerResponse } from "node:http";
import { ConnectorRegistry } from "./registry";
import { EnvironmentCredentialBroker } from "./credential-broker";
import { ExecutionProof, InvokeRequest, InvokeResponse } from "./types";

const MAX_BODY_BYTES = 1_000_000;
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_REQUESTS_PER_MINUTE = 120;
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const seenRequests = new Set<string>();

function hash(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function json(res: ServerResponse, status: number, body: unknown): void { res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" }); res.end(JSON.stringify(body)); }
function authOk(req: IncomingMessage): boolean {
  const expected = process.env.VORTEX_GATEWAY_TOKEN;
  if (!expected) return false;
  const supplied = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const a = Buffer.from(supplied); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
function rateOk(req: IncomingMessage): boolean {
  const key = req.socket.remoteAddress ?? "unknown"; const now = Date.now(); const current = requestCounts.get(key);
  if (!current || current.resetAt <= now) { requestCounts.set(key, { count: 1, resetAt: now + 60_000 }); return true; }
  current.count += 1; return current.count <= Number(process.env.VORTEX_GATEWAY_RATE_LIMIT ?? MAX_REQUESTS_PER_MINUTE);
}
function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = ""; let bytes = 0;
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => { bytes += Buffer.byteLength(chunk); if (bytes > MAX_BODY_BYTES) { reject(new Error("request body too large")); req.destroy(); return; } body += chunk; });
    req.on("end", () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error("invalid JSON")); } });
    req.on("error", reject);
  });
}
function validRequest(raw: unknown): InvokeRequest {
  if (!raw || typeof raw !== "object") throw new Error("request must be an object");
  const req = raw as Partial<InvokeRequest>;
  if (!req.request_id || !/^[A-Za-z0-9_.:-]{1,128}$/.test(req.request_id)) throw new Error("invalid request_id");
  if (!req.connector_id || !/^vortex\.connector\.[a-z0-9-]+$/.test(req.connector_id)) throw new Error("invalid connector_id");
  if (!req.operation || !/^[A-Za-z0-9_.:-]{1,64}$/.test(req.operation)) throw new Error("invalid operation");
  const timeout = req.timeout_ms ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isInteger(timeout) || timeout < 100 || timeout > 120_000) throw new Error("timeout_ms must be between 100 and 120000");
  return { ...req, timeout_ms: timeout } as InvokeRequest;
}

export function createGatewayServer(registry: ConnectorRegistry, broker = new EnvironmentCredentialBroker()): Server {
  return createServer(async (req, res) => {
    try {
      if (!rateOk(req)) return json(res, 429, { error: { code: "rate_limited", message: "too many requests" } });
      if (req.method === "GET" && req.url === "/health") return json(res, 200, { status: "ok", runtime_id: process.env.VORTEX_RUNTIME_ID ?? "local" });
      if (req.method === "GET" && req.url === "/v1/connectors") {
        if (!authOk(req)) return json(res, 401, { error: { code: "unauthorized", message: "authentication required" } });
        const manifests = await Promise.all(registry.manifests().map(async (manifest) => ({ ...manifest, status: await registry.get(manifest.id).health() })));
        return json(res, 200, { connectors: manifests });
      }
      if (req.method !== "POST" || req.url !== "/v1/invoke") return json(res, 404, { error: { code: "not_found", message: "route not found" } });
      if (!authOk(req)) return json(res, 401, { error: { code: "unauthorized", message: "authentication required" } });
      const request = validRequest(await readBody(req));
      const connector = registry.get(request.connector_id);
      if (!connector.manifest().operations.includes(request.operation)) return json(res, 403, { error: { code: "operation_not_authorized", message: "operation is not declared by connector" } });
      const replayKey = `${request.connector_id}:${request.request_id}`;
      if (seenRequests.has(replayKey)) return json(res, 409, { error: { code: "replay_detected", message: "request_id was already used" } });
      seenRequests.add(replayKey);
      const started = Date.now(); const startedAt = new Date(started).toISOString();
      const lease = broker.issue(request.credential_id, request.connector_id);
      const credential = lease && lease.expiresAt > Date.now() ? lease.value : undefined;
      let output: unknown; let status: InvokeResponse["status"] = "success"; let error: InvokeResponse["error"] | undefined;
      try { output = await connector.invoke(request.operation, request.input, { requestId: request.request_id, timeoutMs: request.timeout_ms!, credential }); }
      catch (err) { status = String(err).includes("timeout") ? "timeout" : "error"; error = { code: status, message: err instanceof Error ? err.message : String(err) }; }
      const completed = Date.now();
      const proof: ExecutionProof = { proof_version: "1", request_id: request.request_id, connector_id: request.connector_id, executed: status === "success", status, input_hash: hash(request.input ?? null), output_hash: hash(output ?? error ?? null), started_at: startedAt, completed_at: new Date(completed).toISOString(), duration_ms: completed - started, runtime_id: process.env.VORTEX_RUNTIME_ID ?? "local", ...(request.credential_id ? { credential_id: request.credential_id } : {}) };
      return json(res, status === "success" ? 200 : 502, { request_id: request.request_id, connector_id: request.connector_id, status, executed: proof.executed, ...(status === "success" ? { output } : { error }), proof });
    } catch (err) { return json(res, 400, { error: { code: "invalid_request", message: err instanceof Error ? err.message : String(err) } }); }
  });
}
