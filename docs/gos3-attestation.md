# GOS3 Attestation e Trust Registry

## Objetivo

O runtime Vortex calcula um `evidence_hash` para proteger a integridade da evidência. A atestação GOS3 adiciona uma assinatura Ed25519 sobre um envelope canonicalizado, permitindo verificar se a evidência foi produzida por uma chave pública confiável.

Hash e assinatura têm funções diferentes:

| Campo | Função |
|---|---|
| `evidence_hash` | Detecta alteração no conteúdo da evidência |
| `evidence_signature` | Autentica a chave que assinou o envelope |
| `agent_id` | Identidade declarada do agente |
| `runtime_id` | Identifica o sandbox/runtime que executou |
| `key_id` | Seleciona a chave pública confiável |

## Trust registry

`src/gos3_trust_registry.json` contém somente chaves públicas. A chave privada nunca deve ser commitada, colocada em `.env`, enviada ao chat ou incluída em logs.

Exemplo de entrada:

```json
{
  "schema": "vortex-gos3/trust-registry/0.1",
  "keys": [
    {
      "key_id": "manus-termux-2026-01",
      "agent_id": "manus",
      "provider": "Manus",
      "runtime_id": "termux-a23-001",
      "algorithm": "Ed25519",
      "public_key": "ssh-ed25519 AAAA...",
      "status": "active",
      "valid_from": "2026-08-29T00:00:00Z",
      "valid_until": null
    }
  ]
}
```

A inclusão, rotação e revogação de chaves deve passar por revisão de PR. Para revogar uma chave, use `status: revoked`; não apague silenciosamente o registro histórico.

## Formato da atestação

```json
{
  "schema": "vortex-gos3/attestation/0.1",
  "agent_id": "manus",
  "runtime_id": "termux-a23-001",
  "key_id": "manus-termux-2026-01",
  "evidence_hash": "sha256:...",
  "issued_at": "2026-08-29T18:00:00Z",
  "nonce": "unique-run-value",
  "evidence_signature": "base64:..."
}
```

A assinatura cobre um domínio separado e os campos de identidade, runtime, chave, hash, timestamp e nonce. Campos alterados depois da assinatura invalidam a verificação.

## Verificação fail-closed

O CLI continua funcionando sem atestação no modo `local-no-connector`. Quando `--attestation` é fornecido, `--trust-registry` também é obrigatório e o gate exige `ATTESTATION_VERIFIED` com status `pass`.

```bash
python3 src/vortex_gos3.py . \
  --agent manus \
  --attestation .vortex/manus-attestation.json \
  --trust-registry src/gos3_trust_registry.json \
  --memory .vortex/memory.jsonl
```

A verificação rejeita:

- schema de atestação desconhecido;
- atestação incompleta;
- agente diferente do esperado;
- `key_id` inexistente ou revogado;
- algoritmo diferente de Ed25519;
- associação incorreta entre chave e agente;
- associação incorreta entre chave e runtime;
- timestamp fora da validade da chave ou no futuro;
- assinatura Base64 inválida;
- assinatura que não corresponde ao envelope canonicalizado.

Uma rejeição produz `ATTESTATION_VERIFIED: missing`, `signature_status: rejected` e `gate: FAIL` quando a atestação foi solicitada.

## Provisionamento local

A chave privada deve permanecer fora do repositório, por exemplo:

```text
$HOME/.config/vortex-gos3/keys/manus-ed25519
```

Use permissões restritivas:

```bash
chmod 700 "$HOME/.config/vortex-gos3" "$HOME/.config/vortex-gos3/keys"
chmod 600 "$HOME/.config/vortex-gos3/keys/manus-ed25519"
```

Somente a chave pública deve ser copiada ao trust registry. Ao mudar de sandbox, gere uma nova chave e um novo `runtime_id`, ou documente uma delegação/handoff confiável.

## Limitações atuais

A implementação não assina commits Git e não transforma automaticamente a saída do LLM em uma atestação. Ela verifica uma atestação JSON que já foi produzida pelo runtime. Também não implementa ainda persistência de nonces usados para impedir replay entre instalações independentes; esse controle deve ser adicionado antes de usar a atestação como autorização de escrita remota.
