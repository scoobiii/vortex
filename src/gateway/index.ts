/** GOS3 · Vortex Universal Connector Gateway entrypoint. */
import { createGatewayServer } from "./server";
import { ConnectorRegistry } from "./registry";
import { EchoConnector, HttpJsonConnector } from "./connectors";

const registry = new ConnectorRegistry();
registry.register(new EchoConnector());
if (process.env.VORTEX_HTTP_CONNECTOR_ENDPOINT) registry.register(new HttpJsonConnector(process.env.VORTEX_HTTP_CONNECTOR_ENDPOINT));

const host = process.env.VORTEX_HOST ?? "127.0.0.1";
const port = Number(process.env.VORTEX_PORT ?? 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("VORTEX_PORT must be a valid TCP port");

if (require.main === module) {
  const server = createGatewayServer(registry);
  server.listen(port, host, () => console.log(`Vortex Gateway listening on http://${host}:${port}`));
  const shutdown = () => server.close(() => process.exit(0));
  process.once("SIGINT", shutdown); process.once("SIGTERM", shutdown);
}

export { registry, createGatewayServer };
