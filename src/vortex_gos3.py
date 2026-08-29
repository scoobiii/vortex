#!/usr/bin/env python3
"""Vortex GOS3 runtime: connector-aware, fail-closed and evidence-first."""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import datetime as dt
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    CRYPTOGRAPHY_AVAILABLE = True
except ImportError:  # assinatura é opcional no modo local; obrigatória na verificação
    serialization = None
    Ed25519PublicKey = None
    CRYPTOGRAPHY_AVAILABLE = False

try:
    from .vortex_agents import ImperativeDispatcher
except ImportError:  # CLI direto: python3 src/vortex_gos3.py
    from vortex_agents import ImperativeDispatcher


SCHEMA_VERSION = "vortex-gos3/0.1"


def canonical(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def evidence_hash(value: Any) -> str:
    return "sha256:" + hashlib.sha256(canonical(value).encode()).hexdigest()


ATTESTATION_DOMAIN = b"VORTEX-GOS3-EVIDENCE/1\\x00"


class AttestationError(ValueError):
    pass


class TrustRegistry:
    """Loads public keys only; private keys never belong in the repository."""

    def __init__(self, path: Path):
        self.path = path
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise AttestationError(f"trust registry unavailable: {path}") from exc
        self.keys = {item.get("key_id"): item for item in data.get("keys", []) if item.get("key_id")}

    def get(self, key_id: str) -> Dict[str, Any]:
        key = self.keys.get(key_id)
        if not key or key.get("status") != "active":
            raise AttestationError("untrusted-agent-key")
        if key.get("algorithm") != "Ed25519":
            raise AttestationError("unsupported-signature-algorithm")
        return key


class AttestationVerifier:
    def __init__(self, registry: TrustRegistry):
        self.registry = registry

    @staticmethod
    def _canonical_envelope(attestation: Dict[str, Any]) -> bytes:
        signed = {
            "schema": attestation.get("schema"),
            "agent_id": attestation.get("agent_id"),
            "runtime_id": attestation.get("runtime_id"),
            "key_id": attestation.get("key_id"),
            "evidence_hash": attestation.get("evidence_hash"),
            "issued_at": attestation.get("issued_at"),
            "nonce": attestation.get("nonce"),
        }
        return ATTESTATION_DOMAIN + canonical(signed).encode("utf-8")

    def verify(self, attestation: Dict[str, Any], expected_agent: Optional[str] = None) -> Dict[str, Any]:
        if not CRYPTOGRAPHY_AVAILABLE:
            raise AttestationError("cryptography dependency unavailable")
        required = ("schema", "agent_id", "runtime_id", "key_id", "evidence_hash", "issued_at", "nonce", "evidence_signature")
        if any(not attestation.get(field) for field in required):
            raise AttestationError("incomplete-attestation")
        if attestation.get("schema") != "vortex-gos3/attestation/0.1":
            raise AttestationError("unsupported-attestation-schema")
        if expected_agent and attestation["agent_id"] != expected_agent:
            raise AttestationError("agent-id-mismatch")
        key = self.registry.get(attestation["key_id"])
        if key.get("agent_id") != attestation["agent_id"]:
            raise AttestationError("key-agent-mismatch")
        if key.get("runtime_id") and key["runtime_id"] != attestation["runtime_id"]:
            raise AttestationError("runtime-id-mismatch")
        try:
            issued = dt.datetime.fromisoformat(attestation["issued_at"].replace("Z", "+00:00"))
        except ValueError as exc:
            raise AttestationError("invalid-issued-at") from exc
        now = dt.datetime.now(dt.timezone.utc)
        if issued > now + dt.timedelta(minutes=5):
            raise AttestationError("attestation-from-future")
        if key.get("valid_from") and issued < dt.datetime.fromisoformat(key["valid_from"].replace("Z", "+00:00")):
            raise AttestationError("key-not-valid-at-issued-at")
        if key.get("valid_until") and issued > dt.datetime.fromisoformat(key["valid_until"].replace("Z", "+00:00")):
            raise AttestationError("key-expired-at-issued-at")
        try:
            public_key = serialization.load_ssh_public_key(key["public_key"].encode("utf-8"))
            signature = base64.b64decode(attestation["evidence_signature"].removeprefix("base64:"), validate=True)
            public_key.verify(signature, self._canonical_envelope(attestation))
        except Exception as exc:
            raise AttestationError("invalid-evidence-signature") from exc
        return {"signature_status": "verified", "agent_id": attestation["agent_id"], "runtime_id": attestation["runtime_id"], "key_id": attestation["key_id"]}


@dataclass
class Proof:
    name: str
    status: str = "missing"
    evidence: Optional[str] = None
    detail: Optional[str] = None


@dataclass
class Memory:
    path: Path

    def append(self, event: Dict[str, Any]) -> Dict[str, Any]:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        previous = "genesis"
        if self.path.exists():
            lines = [line for line in self.path.read_text(encoding="utf-8").splitlines() if line.strip()]
            if lines:
                previous = json.loads(lines[-1])["event_hash"]
        record = {"schema": SCHEMA_VERSION, "previous_hash": previous, **event}
        record["event_hash"] = evidence_hash(record)
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(canonical(record) + "\n")
        return record

    def verify(self) -> Dict[str, Any]:
        if not self.path.exists():
            return {"valid": True, "events": 0, "reason": "empty"}
        previous = "genesis"
        count = 0
        for line in self.path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            record = json.loads(line)
            supplied = record.pop("event_hash")
            if record.get("previous_hash") != previous or supplied != evidence_hash(record):
                return {"valid": False, "events": count, "reason": "hash-chain-mismatch"}
            previous = supplied
            count += 1
        return {"valid": True, "events": count}


class ConnectorError(RuntimeError):
    pass


class LocalRepository:
    """Read-only local repository adapter. It never mutates Git state."""

    def __init__(self, root: Path):
        self.root = root.resolve()
        if not self.root.is_dir():
            raise ConnectorError(f"local repository not found: {self.root}")

    def read(self, relative: str) -> Optional[str]:
        path = (self.root / relative).resolve()
        if self.root not in path.parents and path != self.root:
            raise ConnectorError("path escapes repository")
        return path.read_text(encoding="utf-8", errors="replace") if path.is_file() else None

    def git(self, *args: str) -> str:
        result = subprocess.run(["git", "-C", str(self.root), *args], capture_output=True, text=True, timeout=10)
        if result.returncode:
            raise ConnectorError(result.stderr.strip() or f"git failed: {' '.join(args)}")
        return result.stdout.strip()

    def snapshot(self) -> Dict[str, Any]:
        return {
            "path": str(self.root),
            "head": self.git("rev-parse", "HEAD"),
            "branch": self.git("branch", "--show-current"),
            "status": self.git("status", "--short"),
            "remote": self.git("remote", "get-url", "origin") if self.git("remote") else None,
        }


class GitHubConnector:
    """Explicit GitHub API adapter. Writes are opt-in and never sign commits."""

    def __init__(self, repo: str, token: Optional[str] = None, allow_write: bool = False):
        self.repo = repo
        self.token = token or os.environ.get("GITHUB_TOKEN")
        self.allow_write = allow_write

    @property
    def available(self) -> bool:
        return bool(self.token and self.repo)

    def _request(self, method: str, path: str, body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.available:
            raise ConnectorError("GitHub connector unavailable: token or repo missing")
        request = urllib.request.Request("https://api.github.com/repos/" + self.repo + path, method=method)
        request.add_header("Accept", "application/vnd.github+json")
        request.add_header("Authorization", "Bearer " + self.token)
        request.add_header("X-GitHub-Api-Version", "2022-11-28")
        if body is not None:
            request.add_header("Content-Type", "application/json")
            request.data = json.dumps(body).encode()
        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                return json.loads(response.read().decode())
        except urllib.error.HTTPError as error:
            raise ConnectorError(f"GitHub API {error.code} for {method} {path}") from error

    def repo_metadata(self) -> Dict[str, Any]:
        data = self._request("GET", "")
        return {"full_name": data.get("full_name"), "default_branch": data.get("default_branch"), "sha": None}

    def read_file(self, path: str, ref: Optional[str] = None) -> Dict[str, Any]:
        suffix = "/contents/" + path
        if ref:
            suffix += "?ref=" + urllib.parse.quote(ref, safe="")
        data = self._request("GET", suffix)
        return {"path": path, "sha": data.get("sha"), "content": data.get("content"), "encoding": data.get("encoding")}

    def write_file(self, path: str, content_b64: str, message: str, sha: Optional[str] = None) -> Dict[str, Any]:
        if not self.allow_write:
            raise ConnectorError("write denied: pass explicit allow_write=True")
        body: Dict[str, Any] = {"message": message, "content": content_b64}
        if sha:
            body["sha"] = sha
        result = self._request("PUT", "/contents/" + path, body)
        commit = result.get("commit", {})
        return {"write_executed": True, "commit_sha": commit.get("sha"), "git_signed_commit": False, "signature_status": "not_verified"}


class NoConnector:
    available = False

    def repo_metadata(self) -> Dict[str, Any]:
        raise ConnectorError("no GitHub connector configured")


@dataclass
class Run:
    run_id: str
    target: str
    mode: str
    started_at: float
    attestation_required: bool = False
    proofs: List[Proof] = field(default_factory=list)
    findings: List[Dict[str, Any]] = field(default_factory=list)
    actions: List[Dict[str, Any]] = field(default_factory=list)

    def gate(self) -> str:
        required = {"REPO_IDENTIFIED", "ONBOARDING_READ", "POLICY_READ", "EVIDENCE_HASH"}
        if self.attestation_required:
            required.add("ATTESTATION_VERIFIED")
        present = {p.name for p in self.proofs if p.status == "pass"}
        return "PASS" if required <= present else "FAIL"


class Orchestrator:
    def __init__(
        self,
        repo_path: Path,
        memory_path: Path,
        github_repo: Optional[str] = None,
        allow_write: bool = False,
        attestation_path: Optional[Path] = None,
        trust_registry_path: Optional[Path] = None,
    ):
        self.local = LocalRepository(repo_path)
        self.memory = Memory(memory_path)
        self.github = GitHubConnector(github_repo, allow_write=allow_write) if github_repo else NoConnector()
        self.dispatcher = ImperativeDispatcher()
        self.attestation = None
        if attestation_path:
            if not trust_registry_path:
                raise AttestationError("trust-registry-required")
            attestation = json.loads(attestation_path.read_text(encoding="utf-8"))
            self.attestation = (attestation, TrustRegistry(trust_registry_path))

    def run(self, task: str, agent_id: str = "grok") -> Dict[str, Any]:
        run = Run(
            str(uuid.uuid4()),
            str(self.local.root),
            "github" if self.github.available else "local-no-connector",
            time.time(),
            attestation_required=bool(self.attestation),
        )
        agent_plan = self.dispatcher.plan(agent_id, "read_repo")
        run.actions.append({"agent_plan": agent_plan})
        snapshot = self.local.snapshot()
        run.proofs.append(Proof("REPO_IDENTIFIED", "pass", evidence_hash(snapshot), snapshot["head"]))
        readme = self.local.read("README.md") or ""
        onboarding = self.local.read("docs/PLAYBOOK.md") or self.local.read("AGENTS.md")
        policy = self.local.read("docs/PLAYBOOK.md") or self.local.read("spec/gos3-system-instruction.md")
        run.proofs.append(Proof("ONBOARDING_READ", "pass" if onboarding else "missing", evidence_hash(onboarding or ""), "local file" if onboarding else "not found"))
        run.proofs.append(Proof("POLICY_READ", "pass" if policy else "missing", evidence_hash(policy or ""), "local policy" if policy else "not found"))
        if self.github.available:
            run.proofs.append(Proof("CONNECTOR_PRESENT", "pass", evidence_hash({"repo": self.github.repo}), "GitHub connector configured"))
            run.actions.append({"action": "github_connector", "write_executed": False, "git_signed_commit": False})
        else:
            run.proofs.append(Proof("CONNECTOR_PRESENT", "not_applicable", detail="running in local-no-connector mode"))
        if self.attestation:
            attestation, registry = self.attestation
            try:
                verified = AttestationVerifier(registry).verify(attestation, expected_agent=agent_id)
                run.proofs.append(Proof("ATTESTATION_VERIFIED", "pass", evidence_hash(verified), "trusted Ed25519 agent attestation"))
                run.actions.append({"action": "gos3_attestation", **verified})
            except AttestationError as error:
                run.proofs.append(Proof("ATTESTATION_VERIFIED", "missing", detail=str(error)))
                run.actions.append({"action": "gos3_attestation", "signature_status": "rejected", "reason": str(error)})
        run.findings.extend(self._findings(readme, snapshot))
        evidence = {"run_id": run.run_id, "target": run.target, "mode": run.mode, "task": task, "snapshot": snapshot, "findings": run.findings, "proofs": [asdict(p) for p in run.proofs]}
        run.proofs.append(Proof("EVIDENCE_HASH", "pass", evidence_hash(evidence), "canonical run evidence"))
        result = {"schema": SCHEMA_VERSION, "run_id": run.run_id, "target": run.target, "agent": agent_id, "mode": run.mode, "gate": run.gate(), "proofs": [asdict(p) for p in run.proofs], "findings": run.findings, "actions": run.actions, "evidence_hash": run.proofs[-1].evidence, "duration_ms": round((time.time() - run.started_at) * 1000, 3)}
        self.memory.append({"type": "orchestration_run", "run_id": run.run_id, "task": task, "result": result})
        return result

    @staticmethod
    def _findings(
        readme: str,
        snapshot: Dict[str, Any],
        execution_claim: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Analyze repository facts and structured claims, not README prose."""
        findings: List[Dict[str, Any]] = []
        if not snapshot.get("status"):
            findings.append({"severity": "info", "code": "WORKTREE_CLEAN", "detail": "tracked worktree clean"})
        # Documentation may mention executed:true as a protocol rule. Only a
        # structured runtime claim can produce an unproven-execution finding.
        if (
            isinstance(execution_claim, dict)
            and execution_claim.get("executed") is True
            and not execution_claim.get("evidence_hash")
        ):
            findings.append({
                "severity": "high",
                "code": "UNPROVEN_EXECUTION_CLAIM",
                "detail": "structured execution claim lacks evidence_hash",
            })
        return findings


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Vortex GOS3 connector-aware orchestrator")
    parser.add_argument("repo", type=Path)
    parser.add_argument("--task", default="audit repository")
    parser.add_argument("--agent", default="grok")
    parser.add_argument("--memory", type=Path, default=Path(".vortex/memory.jsonl"))
    parser.add_argument("--github-repo", help="owner/name; requires GITHUB_TOKEN")
    parser.add_argument("--allow-write", action="store_true", help="enable explicit GitHub contents writes; never signs commits")
    parser.add_argument("--attestation", type=Path, help="structured GOS3 attestation JSON; makes the gate fail-closed")
    parser.add_argument("--trust-registry", type=Path, help="JSON registry containing trusted public keys")
    args = parser.parse_args(argv)
    try:
        result = Orchestrator(
            args.repo,
            args.memory,
            args.github_repo,
            args.allow_write,
            args.attestation,
            args.trust_registry,
        ).run(args.task, args.agent)
    except (ConnectorError, subprocess.SubprocessError, OSError, ValueError) as error:
        print(json.dumps({"schema": SCHEMA_VERSION, "claim": "failed", "error": str(error)}, indent=2), file=sys.stderr)
        return 1
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result["gate"] == "PASS" else 2


if __name__ == "__main__":
    raise SystemExit(main())
