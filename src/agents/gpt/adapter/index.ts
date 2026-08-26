// **GOS3** · agente: GPT · papel: Adapter
import { computeEvidenceHash, validateRequest, validateResponse, validateRuntimeObservation } from "./contract";
import { InvocationRequest, InvocationResponse, InvocationContext, RuntimeExecutor, RuntimeObservation } from "./types";

const defaultContext: InvocationContext = {
  sandbox: true,
  timeout_ms: 30_000,
};

/**
 * GPT adapter deliberately has no fake runtime and no local `executed=true` path.
 * A success requires an observed RuntimeExecutor supplied by the host.
 */
export async function invoke(raw: unknown, runtime?: RuntimeExecutor): Promise<InvocationResponse> {
  const start = Date.now();
  try {
    validateRequest(raw);
    const req = raw as InvocationRequest;
    const ctx: InvocationContext = { ...defaultContext, ...(req.context ?? {}) };

    if (ctx.dry_run) {
      return {
        contract_version: "0.1",
        invocation_id: req.invocation_id,
        agent: "gpt",
        status: "error",
        executed: false,
        output: { stdout: "", stderr: "dry_run: execution not requested", exit_code: 0 },
        duration_ms: Date.now() - start,
        truncated: false,
        error: "dry_run",
      };
    }

    if (!runtime) {
      return {
        contract_version: "0.1",
        invocation_id: req.invocation_id,
        agent: "gpt",
        status: "error",
        executed: false,
        output: { stdout: "", stderr: "no authorized runtime executor supplied", exit_code: 1 },
        duration_ms: Date.now() - start,
        truncated: false,
        error: "runtime_unavailable",
      };
    }

    const observation: RuntimeObservation = await runtime.execute(req, ctx);
    validateRuntimeObservation(observation);

    const response: InvocationResponse = {
      contract_version: "0.1",
      invocation_id: req.invocation_id,
      agent: "gpt",
      status: observation.exit_code === 0 ? "success" : "error",
      executed: observation.exit_code === 0,
      output: {
        stdout: observation.stdout,
        stderr: observation.stderr,
        exit_code: observation.exit_code,
      },
      duration_ms: observation.duration_ms,
      truncated: observation.truncated,
      evidence_hash: computeEvidenceHash(observation, observation.duration_ms),
      runtime: observation,
    };

    validateResponse(response);
    return response;
  } catch (err) {
    return {
      contract_version: "0.1",
      invocation_id: (raw as Partial<InvocationRequest>)?.invocation_id ?? "unknown",
      agent: "gpt",
      status: "error",
      executed: false,
      output: { stdout: "", stderr: err instanceof Error ? err.message : String(err), exit_code: 1 },
      duration_ms: Date.now() - start,
      truncated: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
