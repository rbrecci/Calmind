import type { PatientBond } from '../api/patient/types.ts';

export function selectBond(bonds: PatientBond[]): PatientBond | null {
  const order = { active: 0, pending: 1, ended: 2 };
  return [...bonds].sort((a, b) => order[a.status] - order[b.status] || b.id - a.id)[0] ?? null;
}
