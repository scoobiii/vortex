# PLAYBOOK — Vortex / GOS3

Convenções de processo pro time NxN (qualquer agente/humano que mexer neste repo).
Formalizado a partir de práticas que já apareciam soltas em `docs/handoff.md`
e em commits anteriores, nunca antes reunidas num arquivo único.

## 1. Governança de mudanças em contrato/segurança

Mudança em `specs/invocation-contract.md`, em qualquer draft de versão futura
do contrato (`docs/proposals/invocation-contract-*`), ou em qualquer coisa que
afete segurança/acesso **nunca é merge automático**, mesmo que pareça pequena
ou vinda de outro agente do GOS3. Decisão passa pelo PO-humano antes de virar
implementação.

Isso vale mesmo quando a mudança chega via `git pull`/`fetch` de `origin/main`
— divergência de contrato se resolve com diff explícito e decisão registrada,
não com pull cego.

## 2. Cabeçalho GOS3 (obrigatório em arquivo novo ou editado por um agente)

Todo arquivo criado ou editado por um agente do GOS3 — não só documentos,
também specs e propostas — leva este bloco no topo:

```markdown
> **GOS3** · agente: `<nome>` · papel: `<papel>` (ver docs/team.md)
> fase: `<fase do backlog>` · data: `<AAAA-MM-DD>`
> antes: <estado de 1 linha antes desta mudança>
> depois: <o que esta mudança entrega/altera>
> base: commit `<hash>` (se aplicável — ancestral que este arquivo parte)
```

Objetivo: qualquer agente (ou humano) que pegar o repo depois sabe o antes/durante/depois,
por quem e quando — sem precisar reconstruir isso via `git log` ou perguntar.

Não é retroativo por padrão — só se aplica a partir de agora, em arquivos
que um agente de fato criar ou tocar. Arquivos antigos não ganham o cabeçalho
só por terem sido lidos ou referenciados.

---

**scoobiii/vortex** · GOS3
