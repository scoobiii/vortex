#!/usr/bin/env python3
"""Declarative agent registry and fail-closed imperative dispatcher."""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List


@dataclass(frozen=True)
class AgentSpec:
    id: str
    role: str
    status: str
    imperative: bool
    provider: str
    capabilities: List[str]


class AgentRegistry:
    def __init__(self, manifest: Path | None = None):
        manifest = manifest or Path(__file__).with_name("agents_manifest.json")
        data = json.loads(manifest.read_text(encoding="utf-8"))
        self.agents: Dict[str, AgentSpec] = {
            item["id"]: AgentSpec(**item) for item in data.get("agents", [])
        }

    def get(self, agent_id: str) -> AgentSpec:
        if agent_id not in self.agents:
            raise KeyError(f"unknown agent: {agent_id}")
        return self.agents[agent_id]

    def active(self) -> List[AgentSpec]:
        return [agent for agent in self.agents.values() if agent.status == "active"]

    def implementers(self) -> List[AgentSpec]:
        return [agent for agent in self.agents.values() if agent.role == "implementer"]


class ImperativeDispatcher:
    """Produces an auditable action plan; execution is a separate gated step."""

    def __init__(self, registry: AgentRegistry | None = None):
        self.registry = registry or AgentRegistry()

    def plan(self, agent_id: str, action: str, requires_connector: bool = False) -> dict:
        agent = self.registry.get(agent_id)
        if not agent.imperative:
            return {"claim": "rejected", "reason": "agent is silent/reviewer", "agent": agent_id, "action": action}
        if action not in agent.capabilities:
            return {"claim": "rejected", "reason": "capability not declared", "agent": agent_id, "action": action}
        if requires_connector:
            return {
                "claim": "planned",
                "agent": agent_id,
                "action": action,
                "connector_required": True,
                "write_executed": False,
                "next": "obtain connector proof before execution",
            }
        return {
            "claim": "planned",
            "agent": agent_id,
            "action": action,
            "connector_required": False,
            "write_executed": False,
            "next": "run local gated executor",
        }
