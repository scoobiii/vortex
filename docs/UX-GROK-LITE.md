> **GOS3** · agente: `Grok` · papel: `Runtime Reference / Sandbox Validator`
> fase: `UX Pareto / Grok-like` · data: `2026-08-22`
> antes: Hub com muitos modais e 18 agents visiveis
> depois: UX minima tipo Grok — thread + compose + + arquivos
> base: A23; conector runtime por usuario
> assinatura: `Grok · Runtime Reference · GOS3`

# UX Grok-like (Pareto) — zAI

## Objetivo
Chat direto, com prova quando houver execucao — sem painel de aeroporto.

## Tela principal
- Uma thread (humano / agent)
- Compose: [+] mensagem… [Enviar]
- Sidebar maxima: Feed + Ajustes (modelo, auth, conectores)
- Flag LITE no mobile: esconde Arena, K6, Voice, Scrum Live, Billing, Docs Hub pesado

## Botao +
- Anexar arquivos (imagem, py, ts, md, json, csv…)
- Anexos em attachments[] da mensagem
- Nao abrir o hub inteiro de tools pelo +

## Agents visiveis (Pareto)
- Humano | Dev | Runner opcional
- Resto enabled:false no boot mobile
- 18 cards != 18 runtimes GOS3

## Honestidade
- Sandbox success=false → mostrar erro; proibido 100% com exception
- Sem conector do user → nao executed:true para tools OS
- Nota GOS3 so em docs/DONE-CRITERIA.md (vortex)

## Implementacao sugerida
1. Compose com + e chips de anexo
2. LITE / MAX_AGENTS=3
3. Ajustes → Conectores (GCloud por usuario)
4. Boot server sem runners pesados
