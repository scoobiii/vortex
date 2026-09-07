/** GOS3 · Vortex Gateway integration tests. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createGatewayServer } from "./server";
import { ConnectorRegistry } from "./registry";
import { EchoConnector } from "./connectors";

async function request(port: number, path: string, body?: unknown, token?: string): Promise<{ status: number; json: any }> {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = createServer; void req;
    const client = require("node:http").request({ hostname: "127.0.0.1", port, path, method: body === undefined ? "GET" : "POST", headers: { ...(payload ? { "content-type": "application/json", "content-length": Buffer.byteLength(payload) } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) } }, (res: any) => { let data = ""; res.setEncoding("utf8"); res.on("data", (chunk: string) => data += chunk); res.on("end", () => resolve({ status: res.statusCode, json: JSON.parse(data) })); });
    client.on("error", reject); if (payload) client.write(payload); client.end();
  });
}

(async () => {
  process.env.NODE_ENV = "production"; process.env.VORTEX_GATEWAY_TOKEN = "test-token";
  const registry = new ConnectorRegistry(); registry.register(new EchoConnector());
  const server = createGatewayServer(registry); await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as any).port;
  try {
    assert.equal((await request(port, "/health")).status, 200);
    assert.equal((await request(port, "/v1/connectors")).status, 401);
    const result = await request(port, "/v1/invoke", { request_id: "test-1", connector_id: "vortex.connector.echo", operation: "echo", input: { ok: true } }, "test-token");
    assert.equal(result.status, 200); assert.equal(result.json.executed, true); assert.equal(result.json.proof.connector_id, "vortex.connector.echo");
    const rejected = await request(port, "/v1/invoke", { request_id: "test-2", connector_id: "vortex.connector.unknown", operation: "echo" }, "test-token");
    assert.equal(rejected.status, 400);
    console.log("gateway tests: PASS");
  } finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
})().catch((err) => { console.error(err); process.exit(1); });
