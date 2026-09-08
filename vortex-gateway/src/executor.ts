// GOS3 · Vortex Foundation conformance artifact
import type { VortexConnector } from "./types.js";

export class ExecutionTimeoutError extends Error {
  constructor(timeout_ms: number) {
    super(`execution exceeded timeout of ${timeout_ms}ms`);
    this.name = "ExecutionTimeoutError";
  }
}

export interface ExecuteArgs {
  connector: VortexConnector;
  operation: string;
  input: unknown;
  request_id: string;
  credential?: unknown;
  timeout_ms: number;
}

export interface ExecuteResult {
  output: unknown;
}

const DEFAULT_TIMEOUT_MS = 30_000;
export const DEFAULT_EXECUTION_TIMEOUT_MS = DEFAULT_TIMEOUT_MS;

/**
 * Runs a connector's invoke() under an enforced wall-clock timeout, using
 * a real AbortController signal so well-behaved connectors can cancel
 * in-flight work (e.g. abort a fetch, close a file handle) rather than
 * merely being ignored after the fact. If the connector does not honor
 * the signal, the Gateway still reports TIMEOUT to the caller and does
 * not wait for the connector's promise to settle.
 */
export async function executeWithTimeout(args: ExecuteArgs): Promise<ExecuteResult> {
  const controller = new AbortController();
  const timeout_ms = args.timeout_ms > 0 ? args.timeout_ms : DEFAULT_TIMEOUT_MS;

  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new ExecutionTimeoutError(timeout_ms));
    }, timeout_ms);
  });

  const invokePromise = args.connector.invoke(args.input, {
    request_id: args.request_id,
    operation: args.operation,
    credential: args.credential,
    signal: controller.signal,
  });

  try {
    const output = await Promise.race([invokePromise, timeoutPromise]);
    return { output };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
