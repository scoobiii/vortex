// Vortex / GOS3 v2.4 — Rhino CAD Connector tests
// Rule: mexeu → testa → valida → publica.

import assert from "node:assert/strict";
import { renderPython, RhinoAdapter, validateProposal } from "../adapter";
import { RhinoSceneProposal } from "../types";

const proposal: RhinoSceneProposal = {
  protocol_version: "vortex-rhino/v1",
  units: "mm",
  operations: [
    { type: "box", name: "base", origin: [0, 0, 0], size: [100, 60, 20] },
    { type: "cylinder", name: "pin", base: [50, 30, 0], radius: 5, height: 20 },
    { type: "export", format: "step", path: "/tmp/vortex-part.step" }
  ]
};

const valid = validateProposal(proposal);
assert.equal(valid.valid, true);
assert.equal(valid.errors.length, 0);

const script = renderPython(proposal);
assert.match(script, /rs\.AddBox/);
assert.match(script, /rs\.AddCylinder/);
assert.match(script, /vortex-part\.step/);
assert.match(script, /VORTEX_RHINO_EXECUTION_READY/);

const bad = validateProposal({
  ...proposal,
  operations: [{ type: "box", name: "bad name", origin: [0, 0, 0], size: [100, 0, 20] }]
});
assert.equal(bad.valid, false);
assert.ok(bad.errors.some((error) => error.includes("invalid characters")));
assert.ok(bad.errors.some((error) => error.includes("size[1]")));

let received = "";
const adapter = new RhinoAdapter({
  async execute(scriptToRun) {
    received = scriptToRun;
    return { exit_code: 0, stdout: "ok", stderr: "", artifact_paths: ["/tmp/vortex-part.step"] };
  }
});
const result = await adapter.execute(proposal);
assert.equal(result.exit_code, 0);
assert.match(received, /VORTEX_RHINO_EXECUTION_READY/);

console.log("Rhino adapter tests: PASS");
