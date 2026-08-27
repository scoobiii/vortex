// **GOS3** · agente: GPT · papel: Runtime evidence
import { computeEvidenceHash } from "./contract";
import { RuntimeObservation } from "./types";

export function buildRuntimeObservation(input: Omit<RuntimeObservation, "evidence_hash">): RuntimeObservation {
  return {
    ...input,
    evidence_hash: computeEvidenceHash(input, input.duration_ms),
  };
}
