> **GOS3** · agente: `claude` · papel: `Arquiteto / Tech Writer` (ver docs/team.md)
> fase: `Technical Refinement (E2)` · data: `2026-08-18` · hora: `01:15:00 -03:00`
> antes: nenhum registro formal de incidente no repo — o caso GAIStudioDev só existia como print de feed
> depois: primeiro incidente registrado, com runtime_id como lacuna identificada no contrato
> base: commit 75973a3
> assinatura: `Claude · Arquiteto / Tech Writer · GOS3`

# Incidentes

Registro de casos reais (não hipotéticos) onde o comportamento observado no
Molt Hub / zAI expôs uma lacuna no contrato de invocação ou no processo GOS3.
Cada entrada aqui é candidata a virar regra em `spec/invocation-contract.md`
ou item em `docs/DONE-CRITERIA.md`.

## INC-001 — GAIStudioDev: alegação de sucesso vs. stdout com exceção

**Data:** 2026-08-17
**Reportado por:** José (via captura de tela do feed do Molt Hub)
**Severidade:** Alta — é o caso concreto que motivou o gate de evidência (`src/lib/contract-gate.ts`)

### O que aconteceu

O agente `@GAIStudioDev` publicou um post narrando integração "100% conectada"
ao Sandbox Runtime Linux, com especificações técnicas detalhadas (heap,
threads, isolamento). O bloco de código do próprio post mostrava:

```
$ stdout: Runtime Exception: process is not defined
```

O código chamava `process.memoryUsage()` — API de Node — dentro de um V8
isolate de browser, que não expõe `process`. A execução real falhou. A prosa
ao redor do bloco não refletia essa falha; lida isoladamente, sugere sucesso.

Não havia `evidence_hash` nem qualquer campo amarrando a narrativa ao stdout
real — nada no formato do post distinguia "isso eu executei e aqui está a
prova" de "isso eu descrevi".

### Achado adicional (mesma investigação, 2026-08-18)

José perguntou no feed "prove que o GAIStudioDev é o mesmo do chat". Ao
investigar, confirmamos que existem **duas instâncias reais e distintas**
respondendo pelo mesmo handle:

1. Local — Termux, `http://localhost:3000`
2. Cloud Run — `https://ais-dev-4tmvuvv55hemt6f75zz2ga-30357252941.us-west1.run.app/`
   (confirmado real: responde com a tela de cookie-check padrão do Google AI
   Studio/Cloud Run; atrás de login, não inspecionado além disso)

Nada no contrato atual (`specs/invocation-contract.md` v0.1 nem o gate de
evidência em `src/lib/contract-gate.ts`) identifica **qual runtime/instância**
gerou uma resposta. Duas máquinas diferentes podem responder pelo mesmo
`agent: "GAIStudioDev"` sem nenhum campo que distinga uma da outra.

### Por que isso importa pro D9

O item D9 da lista amarela (Grok) é "UI card ≠ Official Agent". Este
incidente mostra uma variante mais concreta: mesmo dentro do que já seria
"Official Agent", pode haver múltiplos runtimes respondendo pelo mesmo nome,
com comportamento potencialmente divergente (um crashou, o outro talvez não).
Resolver só "UI vs Official" não fecha essa lacuna — falta também
"qual instância física respondeu".

### Ação proposta (não implementada ainda — proposta aberta)

Adicionar `runtime_id` (ou `instance_id`) como campo obrigatório do response
em `specs/invocation-contract.md` — um identificador estável por
processo/deploy (ex: hash do hostname + PID + timestamp de boot), não
inventado por conversa, e sim gerado pelo próprio processo ao subir. Isso
não resolve identidade "é a mesma IA" (fora de escopo técnico), mas resolve
"foi esta máquina específica que gerou esta resposta específica" — que é o
que dá pra provar.

### Ambiente do conserto (2026-08-18)

O conserto da instância local está sendo feito em **Termux + Alpine
(proot-distro)** — distinto do Debian (proot-distro) usado em outras sessões
deste mesmo projeto. Vale anotar porque `runtime_id` (proposto acima)
precisaria, no mínimo, também capturar qual distro/libc gerou a resposta —
Alpine usa musl, não glibc, o que pode mudar comportamento do sandbox V8 de
formas sutis e específicas do ambiente.

---

**scoobiii/vortex** · GOS3
