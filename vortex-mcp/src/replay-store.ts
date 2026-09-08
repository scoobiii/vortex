// GOS3 · Vortex Foundation conformance artifact
/**
 * spec §14 Anti-replay: "proof válido != proof executável novamente".
 *
 * SECURITY FIX: the previous version split this into two calls —
 * `assertFresh(id)` (check) at the start of the pipeline and `consume(id)`
 * (mark) only after execution completed. Every `await` between those two
 * calls (sandbox timeout wrapping, connector dispatch) was a window where
 * N concurrent requests carrying the SAME request_id could all pass
 * `assertFresh()` — none had been consumed yet — and all proceed to
 * execute. That is a classic check-then-act race, and it defeats the
 * exact property anti-replay exists to guarantee.
 *
 * `reserve()` closes the window by making check-and-mark a single
 * synchronous operation with no `await` in between. JavaScript's
 * single-threaded event loop guarantees no other call can interleave
 * inside a synchronous function body, so this is atomic without needing
 * any external locking — as long as callers reserve() BEFORE any `await`
 * for that request_id, which engine.ts now does at the very top of
 * handle(), before touching policy/sandbox/dispatch.
 *
 * This intentionally removes the previous "retry a request_id that failed
 * before execution" allowance: the spec's normative rule (§14) does not
 * carve out an exception for failed-but-unconsumed request_ids, and
 * trying to preserve that allowance is exactly what reintroduced the
 * race. A caller that wants retry semantics should mint a new request_id
 * per attempt — that is what request_id is for.
 */
import { VortexError } from "./types.js";

export class ReplayStore {
  private reserved = new Set<string>();

  /**
   * Atomically checks-and-marks `requestId` as consumed. Returns `true` if
   * this call was the one that reserved it (i.e. it was fresh), `false` if
   * it was already reserved by a prior (possibly concurrent) call.
   */
  private tryReserve(requestId: string): boolean {
    if (this.reserved.has(requestId)) return false;
    this.reserved.add(requestId);
    return true;
  }

  /** Throws REPLAY_REJECTED if request_id was already reserved; otherwise reserves it. */
  reserve(requestId: string): void {
    if (!this.tryReserve(requestId)) {
      throw new VortexError("REPLAY_REJECTED", `request_id '${requestId}' already consumed`);
    }
  }
}
