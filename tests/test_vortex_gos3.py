#!/usr/bin/env python3
import base64
import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from src.vortex_agents import AgentRegistry, ImperativeDispatcher
from src.vortex_gos3 import (
    AttestationVerifier,
    GitHubConnector,
    Memory,
    Orchestrator,
    TrustRegistry,
)


class VortexGOS3Tests(unittest.TestCase):
    def test_no_connector_mode_passes_with_local_proofs(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = Orchestrator(Path.cwd(), Path(tmp) / "memory.jsonl").run("audit")
            self.assertEqual(result["mode"], "local-no-connector")
            self.assertEqual(result["gate"], "PASS")
            self.assertEqual(result["actions"][0]["agent_plan"]["claim"], "planned")
            self.assertFalse(result["actions"][0]["agent_plan"]["write_executed"])
            self.assertTrue(result["evidence_hash"].startswith("sha256:"))

    def test_memory_hash_chain_verifies(self):
        with tempfile.TemporaryDirectory() as tmp:
            memory = Memory(Path(tmp) / "memory.jsonl")
            memory.append({"type": "first"})
            memory.append({"type": "second"})
            self.assertEqual(memory.verify()["valid"], True)
            self.assertEqual(memory.verify()["events"], 2)

    def test_memory_tampering_is_detected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "memory.jsonl"
            memory = Memory(path)
            memory.append({"type": "first"})
            record = json.loads(path.read_text().strip())
            record["type"] = "tampered"
            path.write_text(json.dumps(record) + "\n")
            self.assertFalse(memory.verify()["valid"])

    def test_github_write_is_denied_by_default(self):
        connector = GitHubConnector("owner/repo", token="test-token")
        with self.assertRaises(RuntimeError):
            connector.write_file("README.md", "YQ==", "test")

    def test_implementer_registry_contains_xai_zai_yai(self):
        registry = AgentRegistry()
        self.assertEqual({agent.id for agent in registry.implementers()}, {"manus", "xai", "zai", "yai"})
        self.assertEqual(ImperativeDispatcher(registry).plan("xai", "read_repo")["claim"], "planned")

    def test_silent_reviewer_cannot_be_imperative(self):
        result = ImperativeDispatcher().plan("claude", "read_repo")
        self.assertEqual(result["claim"], "rejected")

    def test_readme_protocol_text_does_not_trigger_unproven_claim(self):
        readme = "O contrato exige executed: true quando houver evidência."
        findings = Orchestrator._findings(readme, {"status": ""})
        self.assertNotIn(
            "UNPROVEN_EXECUTION_CLAIM",
            {finding["code"] for finding in findings},
        )

    def test_structured_claim_without_hash_triggers_finding(self):
        claim = {"executed": True, "exit_code": 0}
        findings = Orchestrator._findings(
            "README sem claim operacional",
            {"status": ""},
            claim,
        )
        self.assertIn(
            "UNPROVEN_EXECUTION_CLAIM",
            {finding["code"] for finding in findings},
        )

    def test_structured_claim_with_hash_is_accepted(self):
        claim = {"executed": True, "exit_code": 0, "evidence_hash": "sha256:test"}
        findings = Orchestrator._findings("README", {"status": ""}, claim)
        self.assertNotIn(
            "UNPROVEN_EXECUTION_CLAIM",
            {finding["code"] for finding in findings},
        )

    def _signed_attestation(self, tmp, agent="manus", runtime="termux-a23-001"):
        private = Ed25519PrivateKey.generate()
        key_id = "manus-test-key"
        public = private.public_key().public_bytes(
            serialization.Encoding.OpenSSH,
            serialization.PublicFormat.OpenSSH,
        ).decode()
        registry_path = Path(tmp) / "trust.json"
        registry_path.write_text(json.dumps({
            "schema": "vortex-gos3/trust-registry/0.1",
            "keys": [{
                "key_id": key_id,
                "agent_id": agent,
                "runtime_id": runtime,
                "algorithm": "Ed25519",
                "public_key": public,
                "status": "active",
            }],
        }))
        attestation = {
            "schema": "vortex-gos3/attestation/0.1",
            "agent_id": agent,
            "runtime_id": runtime,
            "key_id": key_id,
            "evidence_hash": "sha256:test-evidence",
            "issued_at": dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
            "nonce": "nonce-1",
        }
        signed = AttestationVerifier._canonical_envelope(attestation)
        attestation["evidence_signature"] = "base64:" + base64.b64encode(private.sign(signed)).decode()
        attestation_path = Path(tmp) / "attestation.json"
        attestation_path.write_text(json.dumps(attestation))
        return attestation_path, registry_path, attestation

    def test_trusted_attestation_verifies(self):
        with tempfile.TemporaryDirectory() as tmp:
            _, registry_path, attestation = self._signed_attestation(tmp)
            result = AttestationVerifier(TrustRegistry(registry_path)).verify(attestation, expected_agent="manus")
            self.assertEqual(result["signature_status"], "verified")

    def test_unknown_key_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            _, registry_path, attestation = self._signed_attestation(tmp)
            attestation["key_id"] = "unknown"
            with self.assertRaises(ValueError):
                AttestationVerifier(TrustRegistry(registry_path)).verify(attestation, expected_agent="manus")

    def test_invalid_signature_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            _, registry_path, attestation = self._signed_attestation(tmp)
            attestation["evidence_signature"] = "base64:" + base64.b64encode(b"invalid").decode()
            with self.assertRaises(ValueError):
                AttestationVerifier(TrustRegistry(registry_path)).verify(attestation, expected_agent="manus")

    def test_attestation_requirement_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            _, registry_path, attestation = self._signed_attestation(tmp)
            attestation["evidence_signature"] = "base64:" + base64.b64encode(b"invalid").decode()
            attestation_path = Path(tmp) / "attestation.json"
            attestation_path.write_text(json.dumps(attestation))
            result = Orchestrator(
                Path.cwd(), Path(tmp) / "memory.jsonl", attestation_path=attestation_path,
                trust_registry_path=registry_path,
            ).run("audit", "manus")
            self.assertEqual(result["gate"], "FAIL")
            self.assertIn("ATTESTATION_VERIFIED", {p["name"] for p in result["proofs"]})

    def test_connector_write_response_never_claims_signature(self):
        connector = GitHubConnector("owner/repo", token="test-token", allow_write=True)
        connector._request = lambda method, path, body=None: {"commit": {"sha": "abc123"}}
        result = connector.write_file("README.md", "YQ==", "test")
        self.assertTrue(result["write_executed"])
        self.assertFalse(result["git_signed_commit"])
        self.assertEqual(result["signature_status"], "not_verified")


if __name__ == "__main__":
    unittest.main()
