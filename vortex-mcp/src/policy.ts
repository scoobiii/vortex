/**
 * spec/authorization.md, spec §15 (Approval).
 * "tenho acesso" != "estou autorizada a executar": this module is the
 * single place that turns a capability + scope request into
 * AUTHORIZED / POLICY_DENIED / ONBOARD_REQUIRED (human approval).
 */
import { readFileSync } from "node:fs";
import type { AuthorizationContext, VortexPolicy } from "./types.js";
import { VortexError } from "./types.js";

export function loadPolicy(path: string): VortexPolicy {
  return JSON.parse(readFileSync(path, "utf8")) as VortexPolicy;
}

export type PolicyDecision =
  | { decision: "automatic" }
  | { decision: "required"; reason: string }
  | { decision: "prohibited"; reason: string };

/**
 * Pure function: given a policy and a requested authorization context,
 * decide whether the capability+scope is automatic, needs human
 * approval, or is outright prohibited. Never mutates state; the
 * caller (server.ts) is responsible for enforcing the "required"
 * path (i.e. not proceeding without a recorded approval).
 */
export function evaluatePolicy(
  policy: VortexPolicy,
  ctx: AuthorizationContext,
): PolicyDecision {
  const rule = policy.rules[ctx.capability];
  if (!rule) {
    return { decision: "prohibited", reason: `no rule for capability '${ctx.capability}'` };
  }

  if (rule.allowed_scopes) {
    for (const [key, allowedValue] of Object.entries(rule.allowed_scopes)) {
      const requested = ctx.scope[key];
      if (!scopeMatches(allowedValue, requested)) {
        return {
          decision: "prohibited",
          reason: `scope.${key}='${String(requested)}' not permitted by policy '${policy.policy_id}' (allowed: ${JSON.stringify(allowedValue)})`,
        };
      }
    }
  }

  if (rule.approval === "prohibited") {
    return { decision: "prohibited", reason: `capability '${ctx.capability}' is prohibited by policy` };
  }
  if (rule.approval === "required") {
    return { decision: "required", reason: `capability '${ctx.capability}' requires human approval` };
  }
  return { decision: "automatic" };
}

function scopeMatches(allowed: unknown, requested: unknown): boolean {
  if (allowed === "*") return true;
  if (typeof allowed === "string" && typeof requested === "string") {
    if (allowed.endsWith("/*")) {
      return requested.startsWith(allowed.slice(0, -1));
    }
    return allowed === requested;
  }
  if (Array.isArray(allowed)) {
    return allowed.some((a) => scopeMatches(a, requested));
  }
  return allowed === requested;
}

/** Throws VortexError(POLICY_DENIED) — used at the enforcement boundary. */
export function assertAuthorized(policy: VortexPolicy, ctx: AuthorizationContext): void {
  const result = evaluatePolicy(policy, ctx);
  if (result.decision === "prohibited") {
    throw new VortexError("POLICY_DENIED", result.reason);
  }
  if (result.decision === "required") {
    throw new VortexError("ONBOARD_REQUIRED", result.reason);
  }
}
