#!/usr/bin/env python3
import json
import tempfile
import unittest
from pathlib import Path

from src.vortex_agents import AgentRegistry, ImperativeDispatcher
from src.vortex_gos3 import GitHubConnector, Memory, Orchestrator


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

    def test_connector_write_response_never_claims_signature(self):
        connector = GitHubConnector("owner/repo", token="test-token", allow_write=True)
        connector._request = lambda method, path, body=None: {"commit": {"sha": "abc123"}}
        result = connector.write_file("README.md", "YQ==", "test")
        self.assertTrue(result["write_executed"])
        self.assertFalse(result["git_signed_commit"])
        self.assertEqual(result["signature_status"], "not_verified")


if __name__ == "__main__":
    unittest.main()
