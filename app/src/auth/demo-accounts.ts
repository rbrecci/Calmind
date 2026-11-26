import type { LoginInput } from '../api/types.ts';

export type DemoAccount = { key: string; email: string; label: string };

// Contas dos seeders do backend (UserSeeder, BondSeeder, ClosingDemoSeeder). Admin fica de fora:
// o app recusa esse perfil.
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { key: 'paciente', email: 'elizabeth.bennet@example.com', label: 'Paciente com vínculo (Elizabeth)' },
  { key: 'paciente-2', email: 'harry.potter@example.com', label: 'Paciente menor, sem vínculo (Harry)' },
  { key: 'paciente-3', email: 'frodo.bolseiro@example.com', label: 'Paciente sem vínculo (Frodo)' },
  { key: 'paciente-4', email: 'samwise.gamgee@example.com', label: 'Paciente com pedido pendente (Samwise)' },
  { key: 'psicologa', email: 'hermione.granger@example.com', label: 'Psicóloga com paciente (Hermione)' },
  { key: 'psicologo-2', email: 'atticus.finch@example.com', label: 'Psicólogo sem paciente (Atticus)' },
  { key: 'psicologa-pendente', email: 'jane.marple@example.com', label: 'Psicóloga aguardando aprovação (Jane)' },
];

export type DemoEnv = {
  EXPO_PUBLIC_DEMO_LOGIN?: string;
  EXPO_PUBLIC_DEMO_PASSWORD?: string;
};

export function isDemoLoginEnabled(env: DemoEnv): boolean {
  return env.EXPO_PUBLIC_DEMO_LOGIN === 'true' && Boolean(env.EXPO_PUBLIC_DEMO_PASSWORD);
}

export function demoCredentials(env: DemoEnv, key: string | undefined): LoginInput | null {
  if (!isDemoLoginEnabled(env)) return null;
  const account = DEMO_ACCOUNTS.find((candidate) => candidate.key === key);
  return account ? { email: account.email, password: env.EXPO_PUBLIC_DEMO_PASSWORD ?? '' } : null;
}

// O Expo só embute EXPO_PUBLIC_* lidas por extenso (process.env.NOME); por isso o objeto é
// montado aqui, e não com process.env inteiro.
export const demoEnv: DemoEnv = {
  EXPO_PUBLIC_DEMO_LOGIN: process.env.EXPO_PUBLIC_DEMO_LOGIN,
  EXPO_PUBLIC_DEMO_PASSWORD: process.env.EXPO_PUBLIC_DEMO_PASSWORD,
};
