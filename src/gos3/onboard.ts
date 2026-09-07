/**
 * GOS3
 * arquivo: src/gos3/onboard.ts
 * responsabilidade: contrato de entrada do agente no arquivo antes da alteração
 * agente: agent/llm
 * papel: Engineering Agent
 * fase: implementation
 * data: 2026-09-07
 * hora: 18:10
 * antes: sha256:pending
 * depois: sha256:pending
 * base: commit:1a4f271425f6ce8ebbad8c8aae0bd75a59a9c787
 * assinatura: P0 scoobiii : Agente GPT
 * commit: pending
 */

import crypto from "node:crypto";
import path from "node:path";

export type Gos3Phase = "onboard" | "implementation";

export interface Gos3Header {
  arquivo: string;
  responsabilidade: string;
  agente: string;
  papel: string;
  fase: Gos3Phase;
  data: string;
  hora: string;
  antes: string;
  depois: string;
  base: string;
  assinatura: string;
  commit: string;
}

export interface OnboardOptions {
  file: string;
  responsabilidade: string;
  agente?: string;
  papel?: string;
  date?: string;
  time?: string;
  baseCommit: string;
  assinatura?: string;
}

export interface OnboardSession {
  header: Gos3Header;
  originalBody: string;
  originalHash: string;
  content: string;
  phase: "onboard";
  onboarded: true;
}

export interface ChangedFile {
  header: Gos3Header;
  originalHash: string;
  finalHash: string;
  content: string;
  changed: boolean;
}

const REQUIRED_KEYS = [
  "arquivo", "responsabilidade", "agente", "papel", "fase", "data", "hora",
  "antes", "depois", "base", "assinatura", "commit",
] as const;

const BLOCK_END_RE = /^(?:\*\/|-->)\s*$/;

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function commentStyle(file: string): "block" | "hash" | "html" {
  const ext = path.extname(file).toLowerCase();
  if ([".py", ".sh", ".bash", ".zsh", ".yaml", ".yml", ".toml", ".ini", ".conf"].includes(ext)) return "hash";
  if ([".html", ".htm", ".xml", ".svg"].includes(ext)) return "html";
  return "block";
}

function headerLines(header: Gos3Header): string[] {
  return [
    "GOS3",
    `arquivo: ${header.arquivo}`,
    `responsabilidade: ${header.responsabilidade}`,
    `agente: ${header.agente}`,
    `papel: ${header.papel}`,
    `fase: ${header.fase}`,
    `data: ${header.data}`,
    `hora: ${header.hora}`,
    `antes: ${header.antes}`,
    `depois: ${header.depois}`,
    `base: ${header.base}`,
    `assinatura: ${header.assinatura}`,
    `commit: ${header.commit}`,
  ];
}

function renderHeader(header: Gos3Header, file: string): string {
  const lines = headerLines(header);
  const style = commentStyle(file);
  if (style === "hash") return `${lines.map((line) => `# ${line}`).join("\n")}\n\n`;
  if (style === "html") return `<!--\n${lines.join("\n")}\n-->\n\n`;
  return `/*\n${lines.map((line) => ` * ${line}`).join("\n")}\n */\n\n`;
}

function splitHeader(content: string): { header: string | null; body: string } {
  const normalized = content.replace(/\r\n/g, "\n");
  if (!normalized) return { header: null, body: "" };
  const lines = normalized.split("\n");
  const first = lines[0].trim();

  if (first === "# GOS3") {
    let end = 0;
    while (end + 1 < lines.length && /^#\s+/.test(lines[end + 1])) end += 1;
    return { header: lines.slice(0, end + 1).join("\n"), body: lines.slice(end + 1).join("\n").replace(/^\n+/, "") };
  }

  if (first === "/*" || first === "<!--") {
    const end = lines.findIndex((line, index) => index > 0 && BLOCK_END_RE.test(line.trim()));
    if (end < 0) return { header: null, body: normalized };
    return { header: lines.slice(0, end + 1).join("\n"), body: lines.slice(end + 1).join("\n").replace(/^\n+/, "") };
  }

  return { header: null, body: normalized };
}

function parseHeader(headerText: string | null): Gos3Header | null {
  if (!headerText) return null;
  const raw = headerText
    .replace(/^\/\*\n?/, "")
    .replace(/\n?\*\/$/, "")
    .replace(/^<!--\n?/, "")
    .replace(/\n?-->$/, "")
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").replace(/^\s*#\s?/, "").trim())
    .filter(Boolean);
  if (raw[0] !== "GOS3") return null;
  const values: Record<string, string> = {};
  for (const line of raw.slice(1)) {
    const separator = line.indexOf(":");
    if (separator <= 0) continue;
    values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  if (!REQUIRED_KEYS.every((key) => values[key])) return null;
  if (values.fase !== "onboard" && values.fase !== "implementation") return null;
  return values as Gos3Header;
}

export function parseGos3Header(content: string): Gos3Header | null {
  return parseHeader(splitHeader(content).header);
}

export function bodyWithoutGos3Header(content: string): string {
  return splitHeader(content).body;
}

export function hashBody(content: string): string {
  return `sha256:${sha256(bodyWithoutGos3Header(content))}`;
}

export function validateOnboardHeader(content: string, expectedFile?: string): Gos3Header {
  const header = parseGos3Header(content);
  if (!header) throw new Error("GOS3 onboarding blocked: canonical header is missing or invalid");
  if (header.fase !== "onboard") throw new Error(`GOS3 onboarding blocked: phase must start at onboard, got ${header.fase}`);
  if (expectedFile && header.arquivo !== expectedFile) throw new Error(`GOS3 onboarding blocked: arquivo mismatch (${header.arquivo} != ${expectedFile})`);
  return header;
}

export function onboardFile(content: string, options: OnboardOptions): OnboardSession {
  const existing = parseGos3Header(content);
  if (existing && existing.arquivo !== options.file) {
    throw new Error(`GOS3 onboarding blocked: arquivo mismatch (${existing.arquivo} != ${options.file})`);
  }
  const body = bodyWithoutGos3Header(content);
  const originalHash = `sha256:${sha256(body)}`;
  const header: Gos3Header = existing
    ? { ...existing, arquivo: options.file, fase: "onboard", antes: originalHash, depois: "pending", base: `commit:${options.baseCommit}`, commit: "pending" }
    : {
        arquivo: options.file,
        responsabilidade: options.responsabilidade,
        agente: options.agente ?? "agent/llm",
        papel: options.papel ?? "Engineering Agent",
        fase: "onboard",
        data: options.date ?? new Date().toISOString().slice(0, 10),
        hora: options.time ?? new Date().toISOString().slice(11, 16),
        antes: originalHash,
        depois: "pending",
        base: `commit:${options.baseCommit}`,
        assinatura: options.assinatura ?? "P0 scoobiii : Agente GPT",
        commit: "pending",
      };
  const rendered = renderHeader(header, options.file);
  return { header, originalBody: body, originalHash, content: `${rendered}${body}`, phase: "onboard", onboarded: true };
}

export function assertOnboarded(session: OnboardSession): void {
  if (!session.onboarded || session.phase !== "onboard") throw new Error("GOS3 access blocked: agent must onboard before modifying the file");
  validateOnboardHeader(session.content, session.header.arquivo);
}

export function applyAgentChange(session: OnboardSession, newBody: string, options: { date?: string; time?: string } = {}): ChangedFile {
  assertOnboarded(session);
  const finalHash = `sha256:${sha256(newBody)}`;
  const header: Gos3Header = {
    ...session.header,
    fase: "implementation",
    data: options.date ?? session.header.data,
    hora: options.time ?? session.header.hora,
    antes: session.originalHash,
    depois: finalHash,
    commit: "pending",
  };
  const content = `${renderHeader(header, header.arquivo)}${newBody}`;
  return { header, originalHash: session.originalHash, finalHash, content, changed: newBody !== session.originalBody };
}

export function preflightChangedFile(content: string, expectedFile?: string): { header: Gos3Header; bodyHash: string } {
  const header = parseGos3Header(content);
  if (!header) throw new Error("GOS3 preflight blocked: canonical header is missing or invalid");
  if (expectedFile && header.arquivo !== expectedFile) throw new Error(`GOS3 preflight blocked: arquivo mismatch (${header.arquivo} != ${expectedFile})`);
  const actualHash = `sha256:${sha256(bodyWithoutGos3Header(content))}`;
  if (header.fase === "implementation" && header.depois !== actualHash) throw new Error(`GOS3 preflight blocked: depois hash mismatch for ${header.arquivo}`);
  return { header, bodyHash: actualHash };
}
