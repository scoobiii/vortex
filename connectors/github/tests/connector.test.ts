// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent
// fase: Connector Federation → GitHub Contract Test
// data: 2026-09-07
// hora: 00:00
// antes: no repository-local GitHub connector contract
// depois: request/proof contract is executable
// base: gateway InvokeRequest/ExecutionProof
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git

import assert from "node:assert/strict";
import type { GitHubExecutionProof, GitHubInvokeRequest } from "../adapter/index";
const request: GitHubInvokeRequest = { request_id: "req-test", connector_id: "github", operation: "repo.read" };
const proof: GitHubExecutionProof = { proof_version: "1", request_id: request.request_id, connector_id: "github", executed: false, status: "error", input_hash: "0".repeat(64), output_hash: "0".repeat(64), started_at: new Date(0).toISOString(), completed_at: new Date(0).toISOString(), duration_ms: 0, runtime_id: "contract-test" };
assert.equal(request.connector_id, proof.connector_id); assert.equal(proof.proof_version, "1"); console.log("GITHUB_CONNECTOR_CONTRACT_OK");
