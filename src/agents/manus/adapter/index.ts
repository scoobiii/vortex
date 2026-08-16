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
