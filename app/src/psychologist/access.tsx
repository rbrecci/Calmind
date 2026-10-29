import { createContext, useContext } from 'react';
import type { ConsentTerm, Profile } from '@/api/psychologist/types';

export type Access = { term: ConsentTerm; profile: Profile | null; refresh: () => void };
export const AccessContext = createContext<Access | null>(null);
export function usePsychologistAccess() {
  const access = useContext(AccessContext);
  if (!access) throw new Error('Área do psicólogo indisponível.');
  return access;
}
