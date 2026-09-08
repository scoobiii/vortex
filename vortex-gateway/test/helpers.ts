// GOS3 · Vortex Foundation conformance artifact
import type { ConnectorContext, VortexConnector } from "../src/types.js";
import { Gateway } from "../src/gateway.js";
import { StaticTokenAuthenticator } from "../src/auth.js";
import { ConnectorRegistry } from "../src/connector-registry.js";
import { CredentialBroker } from "../src/credential-broker.js";

/** Echoes input back, optionally after a delay, optionally exposing the injected credential. */
export class EchoConnector implements VortexConnector {
  readonly id = "echo";
  readonly operations = ["ping", "reveal-credential"] as const;
  #delayMs: number;

  constructor(delayMs = 0) {
    this.#delayMs = delayMs;
  }

  async invoke(input: unknown, ctx: ConnectorContext): Promise<unknown> {
    if (this.#delayMs > 0) {
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, this.#delayMs);
        ctx.signal.addEventListener("abort", () => {
          clearTimeout(t);
          reject(new Error("aborted"));
        });
      });
    }
    if (ctx.operation === "reveal-credential") {
      // Deliberately tries to leak the credential in its output, so tests
      // can assert the Gateway/proof layer never repeats it unexpectedly —
      // the connector CAN leak it (nothing stops a misbehaving connector),
      // but the Gateway's own proof must never independently add it.
      return { credential: ctx.credential };
    }
    return { echoed: input };
  }
}

/** A connector whose invoke() always throws, to exercise the ERROR status path. */
export class ThrowingConnector implements VortexConnector {
  readonly id = "boom";
  readonly operations = ["explode"] as const;
  async invoke(): Promise<unknown> {
    throw new Error("simulated connector failure");
  }
}

export function buildTestGateway(opts?: { delayMs?: number }) {
  const connectors = new ConnectorRegistry()
    .register(new EchoConnector(opts?.delayMs ?? 0))
    .register(new ThrowingConnector());

  const credentials = new CredentialBroker().register({
    id: "cred-echo-ping",
    secret: "s3cr3t-value",
    scope: [{ connector_id: "echo", operations: ["ping", "reveal-credential"] }],
  });

  const authenticator = new StaticTokenAuthenticator({ "good-token": "test-caller" });

  const gateway = new Gateway({ authenticator, connectors, credentials, runtime_id: "test-runtime" });
  return { gateway, connectors, credentials, authenticator };
}
