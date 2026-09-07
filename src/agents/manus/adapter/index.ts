/**
 * Data:            2026-08-16
 * Diretório:       src/agents/manus/adapter/index.ts
  * Responsabilidade: Scaffold público do adapter Manus que bloqueia execução sem runtime aprovado.
 * Versão:          1.0.0
 * Assinatura:      scoobiii <sobrinhosj@gmail.com>
 */


/**
 * GOS3 · scaffold público; não declara runtime produtivo.
 */
export const manifest = {
  name: 'manus',
  displayName: 'Manus',
  accountType: 'agent' as const,
  contractVersion: '0.1' as const,
  approvalRequired: true,
};

export async function invoke(): Promise<never> {
  throw new Error('Adapter scaffold: provision runtime and approval before execution.');
}
