/**
 * GOS3
 * arquivo: src/agents/qwen05b/adapter/onboarded.ts
 * responsabilidade: impedir invocação Qwen para alteração de arquivo sem onboarding
 * agente: agent/llm
 * papel: Engineering Agent
 * fase: onboard
 * data: 2026-09-07
 * hora: 00:00
 * antes: sha256:pending
 * depois: pending
 * base: commit:main
 * assinatura: P0 scoobiii : Agente GPT
 * commit: pending
 */

import { invoke, type QwenConfig, type QwenEvidence } from "./index";
import { assertOnboarded, type OnboardSession } from "../../../gos3/onboard";

export interface QwenOnboardedInvocation {
  session: OnboardSession;
  prompt: string;
  config?: QwenConfig;
}

export async function invokeOnboarded(request: QwenOnboardedInvocation): Promise<QwenEvidence> {
  assertOnboarded(request.session);
  const systemContract = [
    "GOS3 ONBOARD COMPLETE.",
    `arquivo: ${request.session.header.arquivo}`,
    `responsabilidade: ${request.session.header.responsabilidade}`,
    `fase: ${request.session.header.fase}`,
    `antes: ${request.session.originalHash}`,
    `base: ${request.session.header.base}`,
    "You may generate the requested change, but the caller must apply it through the GOS3 change gate.",
  ].join("\n");
  return invoke(`${systemContract}\n\n${request.prompt}`, request.config);
}
