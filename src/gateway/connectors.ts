/** GOS3 · Built-in connectors for the production MVP. */
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { Connector, ConnectorContext, ConnectorManifest, ConnectorStatus } from "./types";

abstract class BaseConnector implements Connector {
  abstract manifest(): ConnectorManifest;
  async health(): Promise<ConnectorStatus> { return "healthy"; }
  abstract invoke(operation: string, input: unknown, context: ConnectorContext): Promise<unknown>;
}

export class EchoConnector extends BaseConnector {
  manifest(): ConnectorManifest {
    return { id: "vortex.connector.echo", name: "Echo", version: "1.0.0", kind: "local", operations: ["echo", "health"], credential_type: "none", description: "Deterministic local connector for smoke tests and development." };
  }
  async invoke(operation: string, input: unknown): Promise<unknown> {
    if (operation === "health") return { healthy: true };
    if (operation !== "echo") throw new Error(`operation not supported: ${operation}`);
    return { echoed: input };
  }
}

export class HttpJsonConnector extends BaseConnector {
  constructor(private readonly endpoint: string) { super(); }
  manifest(): ConnectorManifest {
    return { id: "vortex.connector.http-json", name: "HTTP JSON", version: "1.0.0", kind: "remote", operations: ["invoke", "health"], credential_type: "bearer_env", description: "Allowlisted HTTP JSON connector for remote services." };
  }
  async health(): Promise<ConnectorStatus> {
    try { await this.invoke("health", {} , { requestId: "health", timeoutMs: 2_000 }); return "healthy"; } catch { return "unavailable"; }
  }
  async invoke(operation: string, input: unknown, context: ConnectorContext): Promise<unknown> {
    if (operation !== "invoke" && operation !== "health") throw new Error(`operation not supported: ${operation}`);
    const url = new URL(this.endpoint);
    if (url.protocol !== "https:" && process.env.NODE_ENV === "production") throw new Error("remote connectors require HTTPS in production");
    const body = JSON.stringify({ operation, input, request_id: context.requestId });
    const client = url.protocol === "https:" ? httpsRequest : httpRequest;
    return new Promise((resolve, reject) => {
      const req = client({ hostname: url.hostname, port: url.port || undefined, path: `${url.pathname}${url.search}`, method: "POST", timeout: context.timeoutMs, headers: { "content-type": "application/json", "content-length": Buffer.byteLength(body), ...(context.credential ? { authorization: `Bearer ${context.credential}` } : {}) } }, (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { data += chunk; if (data.length > 1_000_000) req.destroy(new Error("remote response too large")); });
        res.on("end", () => { if ((res.statusCode ?? 500) >= 400) return reject(new Error(`remote connector returned ${res.statusCode}`)); try { resolve(JSON.parse(data)); } catch { reject(new Error("remote connector returned invalid JSON")); } });
      });
      req.on("timeout", () => req.destroy(new Error("remote connector timeout")));
      req.on("error", reject);
      req.write(body); req.end();
    });
  }
}
