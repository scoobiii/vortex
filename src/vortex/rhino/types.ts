// Vortex / GOS3 v2.4 — Rhino CAD Connector
// Rule: mexeu → testa → valida → publica.

export type RhinoOperation =
  | { type: "box"; name?: string; origin: [number, number, number]; size: [number, number, number] }
  | { type: "cylinder"; name?: string; base: [number, number, number]; radius: number; height: number }
  | { type: "sphere"; name?: string; center: [number, number, number]; radius: number }
  | { type: "hole"; name?: string; center: [number, number, number]; radius: number; depth: number }
  | { type: "fillet"; radius: number; object?: string }
  | { type: "boolean_difference"; target: string; cutter: string }
  | { type: "export"; format: "3dm" | "step" | "iges"; path: string };

export interface RhinoSceneProposal {
  protocol_version: "vortex-rhino/v1";
  units: "mm" | "cm" | "m" | "in";
  operations: RhinoOperation[];
  metadata?: Record<string, string>;
}

export interface RhinoValidationResult {
  valid: boolean;
  errors: string[];
}

export interface RhinoExecutionResult {
  exit_code: number;
  stdout: string;
  stderr: string;
  artifact_paths: string[];
  metrics?: { duration_ms?: number; objects_created?: number };
}

export interface RhinoExecutor {
  execute(script: string): Promise<RhinoExecutionResult>;
}
