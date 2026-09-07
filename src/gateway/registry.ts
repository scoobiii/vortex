/** GOS3 · Connector registry · fail closed by default. */
import { Connector, ConnectorManifest } from "./types";

export class ConnectorRegistry {
  private readonly connectors = new Map<string, Connector>();

  register(connector: Connector): void {
    const manifest = connector.manifest();
    if (!/^vortex\.connector\.[a-z0-9-]+$/.test(manifest.id)) {
      throw new Error(`invalid connector id: ${manifest.id}`);
    }
    if (this.connectors.has(manifest.id)) {
      throw new Error(`connector already registered: ${manifest.id}`);
    }
    if (!manifest.operations.length) {
      throw new Error(`connector has no operations: ${manifest.id}`);
    }
    this.connectors.set(manifest.id, connector);
  }

  get(id: string): Connector {
    const connector = this.connectors.get(id);
    if (!connector) throw new Error(`connector not found: ${id}`);
    return connector;
  }

  manifests(): ConnectorManifest[] {
    return [...this.connectors.values()].map((connector) => connector.manifest());
  }
}
