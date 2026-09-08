/**
 * spec §14 Anti-replay: "proof válido != proof executável novamente".
 * Minimal in-memory store keyed by request_id. A production
 * deployment would back this with durable storage scoped to the
 * policy/session context, but the normative property — a consumed
 * request_id is rejected — is independent of storage choice.
 */
import { VortexError } from "./types.js";

export class ReplayStore {
  private consumed = new Set<string>();

  /** Throws REPLAY_REJECTED if request_id was already consumed. */
  assertFresh(requestId: string): void {
    if (this.consumed.has(requestId)) {
      throw new VortexError("REPLAY_REJECTED", `request_id '${requestId}' already consumed`);
    }
  }

  consume(requestId: string): void {
    this.consumed.add(requestId);
  }
}
