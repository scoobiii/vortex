# Vortex Local-First / Offline Runtime

**Status:** implemented on `feat/local-first-execution-proof`

Vortex agora trata conectividade como otimização, não como pré-requisito para execução ou geração de evidência.

## Garantias

```text
execute locally
    ↓
measure
    ↓
Execution Proof
    ↓
SHA-256 over canonical JSON
    ↓
persist locally
    ↓
[offline] keep pending
    ↓
[online] synchronize
    ↓
remote acknowledgment
```

A perda de rede não apaga uma prova já persistida. A fila local só marca um item como sincronizado depois que o endpoint remoto o aceita.

## Local storage

Por padrão:

```text
~/.vortex/data/
├── proofs/
├── benchmarks/
└── sync-state.json
```

Pode ser sobrescrito por `VORTEX_DATA_DIR`.

Os arquivos são gravados primeiro em arquivo temporário e depois renomeados atomicamente. O modo local não depende de banco remoto, GitHub ou cloud.

## Execution Proof

Cada execução registrada contém:

- `execution_id`;
- agente/modelo;
- URI e commit base do repositório;
- proposta e `change_hash`;
- comando, exit code e duração;
- métricas de testes quando disponíveis;
- hashes de stdout/stderr e artefatos;
- versão da policy;
- `proof.hash` SHA-256 calculado sobre a representação canônica do envelope sem o próprio hash.

A mesma entrada canônica produz o mesmo hash, permitindo comparação e auditoria determinísticas.

## Benchmark

O benchmark é derivado do Execution Proof, não de uma declaração textual do agente:

```text
PASS = exit_code == 0 && tests.failed == 0
```

Quando não existem métricas de testes, `total/passed/failed` são `0`; isso não deve ser interpretado como "zero testes executados". Significa apenas que essa dimensão não foi fornecida pela execução.

## Synchronization protocol

O cliente envia:

```text
POST /v1/sync
Content-Type: application/json
Authorization: Bearer <optional-token>
```

Envelope:

```json
{
  "protocol": "vortex-sync/v1",
  "device_id": "device-01",
  "proofs": [],
  "benchmarks": []
}
```

O servidor rejeita payloads malformados, protocolos desconhecidos, hashes de proof fora do formato SHA-256 e batches acima de 1000 registros.

## CLI

Ver fila local:

```bash
npm run vortex:status
```

Sincronizar:

```bash
VORTEX_SYNC_URL=https://example.invalid/v1/sync \
VORTEX_DEVICE_ID=device-01 \
npm run vortex:sync
```

`VORTEX_SYNC_TOKEN` é opcional e, quando configurado, é enviado como Bearer token.

## Automatic retry

`SyncWorker` tenta sincronizar imediatamente ao iniciar e novamente em intervalo configurável. Falhas de rede são silenciosas para o worker e preservam os registros pendentes.

## Security boundary

O endpoint de sincronização não executa comandos recebidos. Ele recebe apenas envelopes de evidência/benchmark e persiste registros validados.

O token de sincronização é uma camada de autenticação de transporte; ele **não substitui** identidade criptográfica, assinatura de proof, autorização de runtime ou policy do Vortex. Essas camadas continuam sendo evolução do protocolo.

## Android / Desktop

Android e desktop podem usar a mesma API de domínio. O transporte pode ser:

```text
Desktop/Linux → Unix socket / localhost
Windows       → named pipe / localhost
Android       → Binder/IPC ou LAN
Remote        → HTTPS
```

Nenhum desses transportes é embutido no formato do Execution Proof. Isso mantém o protocolo independente do dispositivo.

## Limite explícito

Persistir um Execution Proof local comprova a integridade do registro criado pelo runtime; não transforma automaticamente uma execução em prova de side-effect externo. Para fechar essa propriedade, o runtime ainda precisa produzir observações/receipts de efeito adequadas à operação.
