import type { AuthContext, Authenticator } from "./types.js";

/**
 * Reference authenticator: a static bearer-token allowlist.
 *
 * Vortex Gateway Specification v1 mandates that the Gateway authenticate
 * its caller (MUST) but does not mandate a mechanism (mTLS, OIDC, static
 * token, etc.) — this mirrors the parent Vortex MCP philosophy of
 * "a protocol specification, not an implementation". Production
 * deployments should supply their own Authenticator (e.g. OIDC token
 * verification) rather than relying on this reference implementation.
 */
export class StaticTokenAuthenticator implements Authenticator {
  #tokens: Map<string, string>;

  constructor(tokens: Record<string, string>) {
    this.#tokens = new Map(Object.entries(tokens));
  }

  authenticate(token: string | undefined): AuthContext {
    if (!token) return { authenticated: false };
    const caller_id = this.#tokens.get(token);
    if (!caller_id) return { authenticated: false };
    return { authenticated: true, caller_id };
  }
}

/** Authenticator that accepts nothing — useful as an explicit "closed" default. */
export class DenyAllAuthenticator implements Authenticator {
  authenticate(_token: string | undefined): AuthContext {
    return { authenticated: false };
  }
}
