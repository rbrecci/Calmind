import type { ButtonVariant } from './button';

export type ConfirmationKind = 'default' | 'destructive';

// Quem confirma uma ação destrutiva leva a cor dela, para o toque final não parecer o de
// sempre. Desistir nunca é a ação principal.
export function confirmationVariants(kind: ConfirmationKind = 'default'): { confirm: ButtonVariant; cancel: ButtonVariant } {
  return { confirm: kind === 'destructive' ? 'destructive' : 'primary', cancel: 'secondary' };
}
