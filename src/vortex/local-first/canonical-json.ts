// Vortex / GOS3 v2.4 — Local-first Runtime
// Rule: mexeu → testa → valida → publica.
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value !== null && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return Object.keys(object).sort().reduce<Record<string, unknown>>((out, key) => {
      out[key] = sortValue(object[key]);
      return out;
    }, {});
  }
  return value;
}
