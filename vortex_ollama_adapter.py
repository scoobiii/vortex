#!/usr/bin/env python3
# GOS3 — Vortex ↔ Ollama Adapter
# Responsabilidade: bridge local OpenAI-compatible -> Ollama with explicit structured output and execution evidence.
"""Hardened local OpenAI-compatible bridge for an Ollama runtime.

This adapter is intentionally a compatibility bridge, not the Vortex runtime.
It fails closed for unsupported structured-output requests and does not equate
an HTTP 200 with model execution: execution evidence requires a completed
Ollama generation with positive generation telemetry.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def compact_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def sha256(value: Any) -> str:
    return sha256_text(compact_json(value))


def read_json_body(handler: BaseHTTPRequestHandler) -> dict[str, Any]:
    length = int(handler.headers.get("Content-Length", "0"))
    if length <= 0 or length > 2_000_000:
        raise ValueError("corpo ausente ou maior que 2 MB")
    value = json.loads(handler.rfile.read(length).decode("utf-8"))
    if not isinstance(value, dict):
        raise ValueError("o corpo deve ser um objeto JSON")
    return value


def messages_to_prompt(messages: Any) -> str:
    if not isinstance(messages, list) or not messages:
        raise ValueError("messages deve ser uma lista não vazia")
    parts: list[str] = []
    for item in messages:
        if not isinstance(item, dict) or not isinstance(item.get("content"), str):
            raise ValueError("cada message precisa de role e content textual")
        parts.append(f"{item.get('role', 'user')}: {item['content']}")
    return "\n".join(parts)


def ollama_format_from_openai(response_format: Any) -> Any:
    """Translate OpenAI-compatible response_format to Ollama's format field."""
    if response_format is None:
        return None
    if not isinstance(response_format, dict):
        raise ValueError("response_format deve ser um objeto")
    kind = response_format.get("type")
    if kind == "json_object":
        return "json"
    if kind == "json_schema":
        spec = response_format.get("json_schema")
        if not isinstance(spec, dict) or not isinstance(spec.get("schema"), dict):
            raise ValueError("response_format.json_schema.schema deve ser um objeto")
        return spec["schema"]
    raise ValueError(f"response_format não suportado: {kind!r}")


def validate_schema_minimal(value: Any, schema: dict[str, Any], path: str = "$" ) -> None:
    """Small stdlib-only validator for the JSON Schema subset used by Vortex.

    It intentionally implements only the constraints needed by the adapter's
    structured-output contract, avoiding a runtime dependency on jsonschema.
    """
    typ = schema.get("type")
    if typ == "object":
        if not isinstance(value, dict):
            raise ValueError(f"{path}: esperado objeto")
        required = schema.get("required", [])
        for key in required:
            if key not in value:
                raise ValueError(f"{path}: campo obrigatório ausente: {key}")
        if schema.get("additionalProperties") is False:
            allowed = set(schema.get("properties", {}))
            extra = set(value) - allowed
            if extra:
                raise ValueError(f"{path}: propriedades não permitidas: {sorted(extra)}")
        for key, subschema in schema.get("properties", {}).items():
            if key in value and isinstance(subschema, dict):
                validate_schema_minimal(value[key], subschema, f"{path}.{key}")
    elif typ == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path}: esperado string")
        if "minLength" in schema and len(value) < int(schema["minLength"]):
            raise ValueError(f"{path}: string curta demais")
        if "maxLength" in schema and len(value) > int(schema["maxLength"]):
            raise ValueError(f"{path}: string longa demais")
        if "enum" in schema and value not in schema["enum"]:
            raise ValueError(f"{path}: valor fora da allowlist")
        if "const" in schema and value != schema["const"]:
            raise ValueError(f"{path}: valor diferente de const")
    elif typ == "array":
        if not isinstance(value, list):
            raise ValueError(f"{path}: esperado array")
    elif typ == "number" and (not isinstance(value, (int, float)) or isinstance(value, bool)):
        raise ValueError(f"{path}: esperado número")
    elif typ == "integer" and (not isinstance(value, int) or isinstance(value, bool)):
        raise ValueError(f"{path}: esperado inteiro")
    elif typ == "boolean" and not isinstance(value, bool):
        raise ValueError(f"{path}: esperado booleano")


def extract_structured_output(text: str, response_format: Any) -> tuple[str, Any | None]:
    """Parse structured output and validate it; fenced Markdown is not accepted."""
    if response_format is None:
        return text, None
    try:
        value = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError("structured output inválido: resposta não é JSON puro") from exc
    if response_format.get("type") == "json_schema":
        schema = response_format.get("json_schema", {}).get("schema")
        if not isinstance(schema, dict):
            raise ValueError("schema ausente")
        validate_schema_minimal(value, schema)
    return text, value


def ollama_generate(config: argparse.Namespace, model: str, prompt: str, options: dict[str, Any], structured_format: Any = None) -> tuple[dict[str, Any], float]:
    body: dict[str, Any] = {"model": model, "prompt": prompt, "stream": False, "options": options}
    if structured_format is not None:
        body["format"] = structured_format
    request = urllib.request.Request(
        config.ollama_url.rstrip("/") + "/api/generate",
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    started = time.perf_counter_ns()
    try:
        with urllib.request.urlopen(request, timeout=config.timeout) as response:
            raw = response.read()
            status = response.status
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:1000]
        raise RuntimeError(f"Ollama HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"não foi possível acessar Ollama em {config.ollama_url}: {exc.reason}") from exc
    elapsed_ms = (time.perf_counter_ns() - started) / 1e6
    payload = json.loads(raw.decode("utf-8"))
    if not isinstance(payload, dict):
        raise RuntimeError("Ollama retornou JSON não-objeto")
    payload["_adapter_http_status"] = status
    return payload, elapsed_ms


def execution_proof(invocation_id: str, request_body: dict[str, Any], upstream: dict[str, Any], elapsed_ms: float, model: str, output_text: str) -> dict[str, Any]:
    eval_count = upstream.get("eval_count")
    eval_duration = upstream.get("eval_duration")
    done = upstream.get("done") is True
    executed = done and isinstance(eval_count, int) and eval_count > 0 and isinstance(eval_duration, int) and eval_duration > 0 and isinstance(output_text, str)
    output_hash = sha256_text(output_text)
    request_hash = sha256(request_body)
    evidence_core = {
        "invocation_id": invocation_id,
        "request_hash": request_hash,
        "output_hash": output_hash,
        "model": model,
        "runtime_id": "ollama-local-termux-cpu",
        "executed": executed,
        "exit_code": 0 if executed else 1,
        "ollama_done": done,
        "eval_count": eval_count,
        "eval_duration": eval_duration,
    }
    evidence_hash = sha256(evidence_core)
    return {
        **evidence_core,
        "evidence_hash": evidence_hash,
        "duration_ms": elapsed_ms,
        "created_at": now_iso(),
    }


class AdapterHandler(BaseHTTPRequestHandler):
    server_version = "GOS3-Vortex-Ollama-Adapter/1.1"

    @property
    def config(self) -> argparse.Namespace:
        return self.server.config  # type: ignore[attr-defined]

    def log_message(self, fmt: str, *args: Any) -> None:
        sys.stderr.write("[%s] %s\n" % (now_iso(), fmt % args))

    def send_json(self, status: int, payload: dict[str, Any]) -> None:
        raw = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self) -> None:
        if self.path == "/health":
            self.send_json(200, {"status": "ok", "adapter": "gos3-vortex-ollama", "upstream": self.config.ollama_url})
            return
        if self.path == "/v1/models":
            self.send_json(200, {"object": "list", "data": [{"id": self.config.model, "object": "model", "created": int(time.time()), "owned_by": "ollama"}]})
            return
        self.send_json(404, {"error": {"message": "rota não encontrada"}})

    def do_POST(self) -> None:
        try:
            body = read_json_body(self)
            if self.path == "/v1/chat/completions":
                status, result = self.handle_openai(body)
            elif self.path == "/vortex/invoke":
                status, result = self.handle_vortex(body)
            else:
                self.send_json(404, {"error": {"message": "rota não encontrada"}})
                return
            self.send_json(status, result)
        except (ValueError, RuntimeError, json.JSONDecodeError) as exc:
            self.send_json(400, {"error": {"message": str(exc), "type": type(exc).__name__}})
        except Exception as exc:
            self.send_json(500, {"error": {"message": str(exc), "type": type(exc).__name__}})

    def handle_openai(self, body: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        invocation_id = str(body.get("invocation_id") or uuid.uuid4())
        model = str(body.get("model") or self.config.model)
        prompt = messages_to_prompt(body.get("messages"))
        response_format = body.get("response_format")
        structured_format = ollama_format_from_openai(response_format)
        options = {"temperature": body.get("temperature", 0.0), "num_predict": body.get("max_tokens", self.config.max_tokens)}
        upstream, elapsed_ms = ollama_generate(self.config, model, prompt, options, structured_format)
        output_text = upstream.get("response")
        if not isinstance(output_text, str):
            raise RuntimeError("Ollama não retornou response textual")
        if response_format is not None:
            extract_structured_output(output_text, response_format)
        evidence = execution_proof(invocation_id, body, upstream, elapsed_ms, model, output_text)
        if not evidence["executed"]:
            return 422, {"error": {"message": "execução não comprovada", "type": "execution_unproven"}, "invocation_id": invocation_id, "evidence": evidence}
        prompt_tokens = upstream.get("prompt_eval_count")
        output_tokens = upstream.get("eval_count")
        result = {"id": "chatcmpl-" + invocation_id, "object": "chat.completion", "created": int(time.time()), "model": model, "choices": [{"index": 0, "message": {"role": "assistant", "content": output_text}, "finish_reason": "stop"}], "usage": {"prompt_tokens": prompt_tokens, "completion_tokens": output_tokens, "total_tokens": (prompt_tokens + output_tokens) if isinstance(prompt_tokens, int) and isinstance(output_tokens, int) else None}, "invocation_id": invocation_id, "vortex_evidence": evidence}
        return 200, result

    def handle_vortex(self, body: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        invocation_id = str(body.get("invocation_id") or uuid.uuid4())
        agent = body.get("agent", "unknown")
        input_data = body.get("input") or body.get("prompt")
        prompt = input_data.get("prompt") or input_data.get("content") if isinstance(input_data, dict) else input_data
        if not isinstance(prompt, str) or not prompt:
            raise ValueError("/vortex/invoke requer input.prompt ou prompt")
        model = str(body.get("model") or self.config.model)
        options = {"temperature": body.get("temperature", 0.0), "num_predict": body.get("max_tokens", self.config.max_tokens)}
        response_format = body.get("response_format")
        structured_format = ollama_format_from_openai(response_format)
        upstream, elapsed_ms = ollama_generate(self.config, model, prompt, options, structured_format)
        output_text = upstream.get("response")
        if not isinstance(output_text, str):
            raise RuntimeError("Ollama não retornou response textual")
        if response_format is not None:
            extract_structured_output(output_text, response_format)
        evidence = execution_proof(invocation_id, body, upstream, elapsed_ms, model, output_text)
        status = "success" if evidence["executed"] else "execution_unproven"
        http_status = 200 if evidence["executed"] else 422
        return http_status, {"contract_version": body.get("contract_version", "0.1"), "invocation_id": invocation_id, "agent": agent, "status": status, "executed": evidence["executed"], "runtime_id": "ollama-local-termux-cpu", "request_hash": evidence["request_hash"], "output": {"text": output_text, "output_hash": evidence["output_hash"]}, "execution_evidence": evidence, "telemetry": {"duration_ms": elapsed_ms, "prompt_eval_count": upstream.get("prompt_eval_count"), "eval_count": upstream.get("eval_count"), "eval_duration": upstream.get("eval_duration")}, "evidence": evidence}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--ollama-url", default="http://127.0.0.1:11434")
    parser.add_argument("--model", default="qwen2.5-coder:0.5b")
    parser.add_argument("--max-tokens", type=int, default=128)
    parser.add_argument("--timeout", type=float, default=600.0)
    parser.add_argument("--evidence-dir", default="evidence")
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), AdapterHandler)
    server.config = args  # type: ignore[attr-defined]
    print(f"GOS3 Vortex↔Ollama adapter ouvindo em http://{args.host}:{args.port}", flush=True)
    print(f"Ollama upstream: {args.ollama_url}; evidências: {args.evidence_dir}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nencerrando", flush=True)
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
