> **GOS3** · Vortex Foundation conformance artifact

# Vortex MCP — Reference Implementation

TypeScript reference implementation of the **Vortex MCP Execution
Governance Profile** — a spec-first perfil normativo sobre MCP para
execução governada de agentes. Ver `spec/vortex-mcp.md` para a tese
completa.

> Esta é uma **implementação de referência**, não a especificação. A
> especificação (`spec/*.md`) é o produto; esta implementação existe
> para prová-la executável e para servir de vetor de interoperabilidade
> com portas em outras linguagens (Go, Rust, Java, Python, C#).

## Estrutura

```
spec/                       # documentos normativos (a fonte de verdade)
src/
  types.ts                  # tipos normativos compartilhados
  canonicalize.ts           # JCS (RFC 8785) + SHA-256
  identity.ts                # Ed25519 keygen/sign/verify
  key-registry.ts            # key discovery (mecanismo "registry")
  policy.ts                   # motor de política (automatic/required/prohibited)
  gos3.ts                      # onboarding de sessão/recurso
  sandbox.ts                    # enforcement de escopo (fs/net/process/timeout)
  replay-store.ts                # anti-replay por request_id
  proof.ts                        # construção + assinatura do ExecutionProof
  engine.ts                        # pipeline REQUEST→...→PROOF (o núcleo real)
  verifier.ts                       # verificador independente
  connector.ts                       # interface que um conector implementa
  connectors/filesystem.ts            # conector de referência (repository.read/write)
  server.ts                            # transporte MCP (stdio) — expõe vortex.*
  verifier-cli.ts                       # CLI standalone de verificação
policies/vortex-development.json       # política de exemplo
test/conformance/                       # suíte adversarial (forge/replay/escalate/escape/tamper)
```

## Instalação

```bash
npm install
npm run build
```

## Rodando o servidor MCP

```bash
node dist/src/server.js
```

Variáveis de ambiente opcionais:

| var                        | default                                  |
|-----------------------------|-------------------------------------------|
| `VORTEX_RUNTIME_ID`          | UUID gerado                               |
| `VORTEX_AGENT_ID`            | `agent/llm`                               |
| `VORTEX_PRINCIPAL_ID`        | `scoobiii`                                |
| `VORTEX_POLICY_PATH`         | `policies/vortex-development.json`        |
| `VORTEX_KEY_REGISTRY_PATH`   | `.vortex-keys.json` (criado automaticamente) |
| `VORTEX_SANDBOX_ROOT`        | `process.cwd()`                           |

Para usar como MCP server em um cliente (Claude Desktop, etc.), aponte
para `node dist/src/server.js` no `command`/`args` da configuração MCP.

## Tools MCP expostas

- `vortex.inspect` — leitura, sem efeitos colaterais
- `vortex.propose` — descreve uma mudança pretendida, nunca executa
- `vortex.execute` — executa uma operação autorizada e limitada
- `vortex.branch.write` — escrita de estado persistente (normalmente exige aprovação humana via GOS3)
- `vortex.gos3.onboard` — abre uma sessão GOS3 autorizando recursos para operações mutáveis subsequentes
- `vortex.identity` — retorna a identidade criptográfica do runtime (para key discovery)

Todas as chamadas retornam `{ status, output, execution_proof }` — o
`execution_proof` é sempre um objeto assinado (Ed25519), mesmo em caso
de negação (`executed: false`).

## Exemplo de fluxo (onboard → execute → verify)

```jsonc
// 1. abrir sessão GOS3
{ "name": "vortex.gos3.onboard", "arguments": { "resources": ["repo:scoobiii/vortex"] } }

// 2. executar escrita governada
{
  "name": "vortex.execute",
  "arguments": {
    "request_id": "req-001",
    "operation": "repository.write",
    "scope": { "repository": "scoobiii/vortex", "branch": "feat/example" },
    "gos3_session_id": "<id retornado acima>",
    "args": { "path": "/abs/path/dentro/do/sandbox/arquivo.txt", "content": "..." }
  }
}
```

## Verificação independente

```bash
node dist/src/verifier-cli.js proof.json .vortex-keys.json
# { "ok": true }  ou  { "ok": false, "status": "...", "reason": "..." }
```

O verificador não consulta o runtime do servidor — ele recebe apenas o
proof serializado e um registro de chaves, e reproduz canonicalização
JCS + verificação de assinatura Ed25519 de forma independente
(`spec/verification.md`).

## Testes

```bash
npm run build
npm run test:conformance
```

Roda a suíte adversarial completa: **FORGE**, **REPLAY**, **ESCALATE**,
**ESCAPE**, **TAMPER** — ver `spec/conformance.md` para a definição de
cada classe.

## Política de exemplo

`policies/vortex-development.json`:

```json
{
  "policy_id": "vortex-development",
  "policy_version": "1",
  "rules": {
    "repository.read":  { "approval": "automatic", "allowed_scopes": { "repository": "*" } },
    "repository.write": { "approval": "required",  "allowed_scopes": { "repository": "scoobiii/*", "branch": "feat/*" } },
    "repository.merge_main": { "approval": "prohibited" },
    "repository.publish":    { "approval": "prohibited" }
  }
}
```

## Portando para outra linguagem

O contrato a reproduzir é `src/engine.ts` (o pipeline) + `src/proof.ts`
+ `src/canonicalize.ts` + `src/identity.ts`. Qualquer porta
(`vortex-mcp-go`, `vortex-mcp-rust`, `vortex-mcp-python`,
`vortex-mcp-java`) deve:

1. produzir `ExecutionProof`s que verifiquem no `vortex-verifier` desta
   implementação (interoperabilidade via JCS + Ed25519 canônicos);
2. passar sua própria suíte adversarial equivalente a
   `test/conformance/`.

## Nível de conformidade desta implementação

**Vortex Full Conformance** — MCP + GOS3 + Authorization + Sandbox +
Execution + Proof + Independent Verification + Cryptographic Identity
+ Anti-Replay + suíte adversarial completa (12/12 testes passando).
