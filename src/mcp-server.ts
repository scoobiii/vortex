/**
 * **GOS3** · agente: `Manus` · papel: `Maintainer / DevOps` (ver docs/team.md)
 * fase: `Onboarding → Runtime Federation` · data: `2026-08-30` · hora: `01:23:42 UTC`
 * antes: adaptador MCP implementado sem cabeçalho GOS3 no arquivo de entrada.
 * depois: servidor MCP integrado identificado com rastreabilidade GOS3 e ferramentas GitHub, Vortex, GoS3/S3 e Qwen local.
 * base: commit `e49ef90`
 * assinatura: `Manus · Maintainer / DevOps · GOS3`
 */
import { randomUUID, createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const execFileAsync = promisify(execFile);
const server = new McpServer({ name: "vortex-github-gos3", version: "0.1.0" });

function evidence(text: string, runtimeId = "local") {
  const stdout = text;
  return {
    contract_version: "0.1",
    invocation_id: randomUUID(),
    agent: "mcp-adapter",
    status: "success",
    executed: true,
    output: {
      stdout,
      stderr: "",
      exit_code: 0,
      duration_ms: 0,
      runtime_id: runtimeId,
      evidence_sha256: createHash("sha256").update(stdout).digest("hex"),
    },
  };
}

server.tool(
  "vortex_invoke",
  "Executa um comando no runtime local e retorna evidência estruturada conforme o contrato Vortex.",
  {
    command: z.string().min(1),
    args: z.array(z.string()).default([]),
    cwd: z.string().optional(),
    timeout_ms: z.number().int().positive().max(120000).default(30000),
  },
  async ({ command, args, cwd, timeout_ms }) => {
    const started = Date.now();
    try {
      const result = await execFileAsync(command, args, {
        cwd,
        timeout: timeout_ms,
        maxBuffer: 1024 * 1024,
        env: process.env,
      });
      const payload = {
        ...evidence(result.stdout, process.env.VORTEX_RUNTIME_ID ?? "local"),
        output: {
          ...evidence(result.stdout).output,
          stderr: result.stderr,
          duration_ms: Date.now() - started,
        },
      };
      return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
    } catch (error: any) {
      const stdout = error.stdout ?? "";
      const stderr = error.stderr ?? error.message ?? String(error);
      const payload = {
        contract_version: "0.1",
        invocation_id: randomUUID(),
        agent: "mcp-adapter",
        status: "failed",
        executed: true,
        output: {
          stdout,
          stderr,
          exit_code: typeof error.code === "number" ? error.code : 1,
          duration_ms: Date.now() - started,
          runtime_id: process.env.VORTEX_RUNTIME_ID ?? "local",
          evidence_sha256: createHash("sha256").update(`${stdout}\n${stderr}`).digest("hex"),
        },
      };
      return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], isError: true };
    }
  },
);

server.tool(
  "github_request",
  "Faz uma chamada autenticada à API REST do GitHub. O token é lido de GITHUB_TOKEN.",
  {
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
    path: z.string().regex(/^\//),
    body: z.record(z.unknown()).optional(),
  },
  async ({ method, path, body }) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return { content: [{ type: "text", text: "GITHUB_TOKEN não configurado." }], isError: true };
    const response = await fetch(`${process.env.GITHUB_API_URL ?? "https://api.github.com"}${path}`, {
      method,
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    return { content: [{ type: "text", text }], isError: !response.ok };
  },
);

const s3 = () => new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
});

server.tool(
  "gos3_list_buckets",
  "Lista os buckets S3 acessíveis pelas credenciais configuradas.",
  {},
  async () => {
    const result = await s3().send(new ListBucketsCommand({}));
    return { content: [{ type: "text", text: JSON.stringify(result.Buckets ?? [], null, 2) }] };
  },
);

server.tool(
  "gos3_list_objects",
  "Lista objetos de um bucket S3.",
  { bucket: z.string().min(1), prefix: z.string().optional() },
  async ({ bucket, prefix }) => {
    const result = await s3().send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
    return { content: [{ type: "text", text: JSON.stringify(result.Contents ?? [], null, 2) }] };
  },
);

server.tool(
  "gos3_get_object",
  "Lê um objeto S3 como texto UTF-8.",
  { bucket: z.string().min(1), key: z.string().min(1) },
  async ({ bucket, key }) => {
    const result = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const text = await result.Body?.transformToString("utf-8");
    return { content: [{ type: "text", text: text ?? "" }] };
  },
);

server.tool(
  "gos3_put_object",
  "Grava texto UTF-8 em um objeto S3.",
  { bucket: z.string().min(1), key: z.string().min(1), content: z.string() },
  async ({ bucket, key, content }) => {
    await s3().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: content, ContentType: "text/plain; charset=utf-8" }));
    return { content: [{ type: "text", text: JSON.stringify({ bucket, key, bytes: Buffer.byteLength(content) }) }] };
  },
);

server.tool(
  "gos3_delete_object",
  "Exclui um objeto S3.",
  { bucket: z.string().min(1), key: z.string().min(1) },
  async ({ bucket, key }) => {
    await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return { content: [{ type: "text", text: JSON.stringify({ bucket, key, deleted: true }) }] };
  },
);

server.tool(
  "qwen_chat",
  "Envia uma solicitação ao Qwen local servido pelo llama.cpp; o modelo não é carregado dentro do processo MCP.",
  {
    prompt: z.string().min(1),
    temperature: z.number().min(0).max(2).default(0.2),
    max_tokens: z.number().int().positive().max(1024).default(256),
  },
  async ({ prompt, temperature, max_tokens }) => {
    const baseUrl = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL ?? "qwen2.5-coder:0.5b",
        messages: [{ role: "user", content: prompt }],
        stream: false,
        options: { temperature, num_predict: max_tokens, num_ctx: Number(process.env.OLLAMA_CONTEXT ?? 2048) },
      }),
    });
    const text = await response.text();
    return { content: [{ type: "text", text }], isError: !response.ok };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
