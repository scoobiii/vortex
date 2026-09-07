> **GOS3** · Vortex Universal Connector Gateway · Production MVP

# Vortex Universal Connector Gateway — MVP produtivo

Este módulo entrega o primeiro núcleo executável do Vortex Universal Connector: um gateway HTTP local-first, um registry fail-closed, conectores built-in, leases efêmeras de credenciais e Execution Proofs com hashes de entrada e saída.

## O que está incluído

- `POST /v1/invoke` para invocações padronizadas.
- `GET /v1/connectors` para descoberta autenticada.
- `GET /health` para liveness.
- Registry com validação de IDs e operações.
- Conector local `vortex.connector.echo` para smoke test determinístico.
- Conector remoto HTTP JSON opcional, habilitado por `VORTEX_HTTP_CONNECTOR_ENDPOINT`.
- Credential Broker que lê credenciais somente em runtime e emite leases de 30 segundos.
- Autenticação Bearer para rotas protegidas.
- Limite de corpo de 1 MB, timeout entre 100 ms e 120 s e HTTPS obrigatório para conectores remotos em produção.
- Execution Proof sem material secreto.

## Execução local

```bash
npm ci
npm run build
VORTEX_GATEWAY_TOKEN=dev-token npm run gateway
```

Em outro terminal:

```bash
curl http://127.0.0.1:8787/health
curl -H 'Authorization: Bearer dev-token' \\
  -H 'Content-Type: application/json' \\
  -d '{"request_id":"demo-1","connector_id":"vortex.connector.echo","operation":"echo","input":{"message":"hello"}}' \\
  http://127.0.0.1:8787/v1/invoke
```

## Configuração

| Variável | Padrão | Uso |
|---|---|---|
| `VORTEX_HOST` | `127.0.0.1` | Endereço de escuta; usar `0.0.0.0` somente atrás de firewall/proxy. |
| `VORTEX_PORT` | `8787` | Porta HTTP. |
| `VORTEX_GATEWAY_TOKEN` | ausente | Bearer token para rotas protegidas; obrigatório em produção. |
| `VORTEX_RUNTIME_ID` | `local` | Identidade do processo/runtime no Execution Proof. |
| `VORTEX_HTTP_CONNECTOR_ENDPOINT` | ausente | Endpoint HTTPS do conector remoto JSON. |
| `VORTEX_CREDENTIAL_<ID>` | ausente | Segredo de runtime para uma credencial referenciada pelo request. |
| `NODE_ENV` | ausente | Com `production`, bloqueia HTTP remoto sem TLS. |

O MVP usa variáveis de ambiente como adaptador inicial de secret manager. Em produção corporativa, o próximo adaptador deve resolver os mesmos leases a partir de Vault, cloud secret manager ou HSM, sem alterar o contrato do gateway.

## Request

```json
{
  "request_id": "req-123",
  "connector_id": "vortex.connector.echo",
  "operation": "echo",
  "input": {"message": "hello"},
  "timeout_ms": 30000
}
```

## Response e prova

```json
{
  "request_id": "req-123",
  "connector_id": "vortex.connector.echo",
  "status": "success",
  "executed": true,
  "output": {"echoed": {"message": "hello"}},
  "proof": {
    "proof_version": "1",
    "request_id": "req-123",
    "connector_id": "vortex.connector.echo",
    "executed": true,
    "status": "success",
    "input_hash": "sha256...",
    "output_hash": "sha256...",
    "runtime_id": "local"
  }
}
```

O proof comprova a resposta observada pelo gateway. Ele ainda não é uma prova criptográfica de efeito externo do sistema remoto. Para esse nível, o conector deve evoluir para emitir receipts assinados e a integração deve validar o efeito no destino.

## Produção

O gateway deve ser executado atrás de TLS terminante, autenticação forte, rate limiting, observabilidade e secret manager. O token Bearer simples é adequado ao MVP protegido por rede; para multi-tenant, deve ser substituído por OAuth/OIDC ou mTLS com autorização por tenant, conector e operação.

O processo não persiste segredos nem respostas. O registry é construído explicitamente no startup. Conectores desconhecidos e operações não declaradas falham fechados.

## Testes

```bash
npm ci
npm run build
npm run test:gateway
python3 tests/contract_test.py
python3 tests/change_validation_policy_test.py
npm run test:grok
```

## Próximas extensões de produção

1. Adaptador de secret manager externo e rotação automática.
2. OAuth/OIDC, RBAC/ABAC e isolamento por tenant.
3. Receipts assinados para efeitos externos.
4. Fila local-first e sincronização idempotente.
5. Conectores oficiais para GitHub, Manus e LLMs locais/remotos.
6. Imagem OCI, SBOM, assinatura de release e deployment Kubernetes.
