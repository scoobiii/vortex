/**
 * spec/gos3.md — "Um agente não modifica um recurso simplesmente
 * porque consegue acessá-lo." GOS3 is the onboarding/authorization
 * layer for a resource+session; it is a contract of entry, not a
 * cryptographic guarantee (that's identity.ts + canonicalize.ts).
 */
import { randomUUID } from "node:crypto";
import type { Gos3Session } from "./types.js";
import { VortexError } from "./types.js";

export class Gos3Registry {
  private sessions = new Map<string, Gos3Session>();

  onboard(principalId: string, agentId: string, resources: string[], ttlMs = 15 * 60_000): Gos3Session {
    const now = Date.now();
    const session: Gos3Session = {
      gos3_session_id: `gos3-${randomUUID()}`,
      principal_id: principalId,
      agent_id: agentId,
      resources,
      issued_at: new Date(now).toISOString(),
      expires_at: new Date(now + ttlMs).toISOString(),
    };
    this.sessions.set(session.gos3_session_id, session);
    return session;
  }

  /** Throws ONBOARD_REQUIRED if session missing/expired, or resource not covered. */
  requireOnboarded(sessionId: string | undefined, resource: string): Gos3Session {
    if (!sessionId) {
      throw new VortexError("ONBOARD_REQUIRED", "no gos3_session_id supplied for a mutating operation");
    }
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new VortexError("ONBOARD_REQUIRED", `unknown gos3_session_id '${sessionId}'`);
    }
    if (Date.parse(session.expires_at) < Date.now()) {
      throw new VortexError("ONBOARD_REQUIRED", `gos3_session_id '${sessionId}' expired`);
    }
    const covered = session.resources.some((r) => resourceMatches(r, resource));
    if (!covered) {
      throw new VortexError("ONBOARD_REQUIRED", `resource '${resource}' not onboarded in session '${sessionId}'`);
    }
    return session;
  }
}

function resourceMatches(pattern: string, resource: string): boolean {
  if (pattern === resource) return true;
  if (pattern.endsWith("/*")) return resource.startsWith(pattern.slice(0, -1));
  return false;
}
