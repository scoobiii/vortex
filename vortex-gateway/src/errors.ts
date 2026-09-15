// GOS3 · Vortex Foundation conformance artifact
/** Best-effort field extraction from a possibly-malformed raw request, for proof purposes only. */
export function bestEffortField(raw: unknown, key: string): string {
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    const v = (raw as Record<string, unknown>)[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return "unknown";
}

export function bestEffortInput(raw: unknown): unknown {
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw) && "input" in (raw as object)) {
    return (raw as Record<string, unknown>).input;
  }
  return null;
}
