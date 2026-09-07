import { createHash } from "node:crypto";
import { canonicalize } from "./canonical-json";

export function sha256Text(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

export function sha256Json(value: unknown): string {
  return sha256Text(canonicalize(value));
}
