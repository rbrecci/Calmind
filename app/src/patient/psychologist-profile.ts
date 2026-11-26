import type { PatientBond } from '../api/patient/types.ts';
import type { CatalogPsychologist } from '../api/types.ts';
import { selectBond } from './bonds.ts';

// O perfil do psicólogo visto pelo paciente junta duas fontes. O catálogo traz o perfil público,
// mas a API o recusa a quem tem vínculo ativo; por isso o vínculo traz os mesmos campos, com os
// mesmos nomes. Com vínculo ativo, então, a tela mostra o que o vínculo traz.
export type PsychologistProfileView = Pick<CatalogPsychologist, 'id' | 'name' | 'crp' | 'avatar_url' | 'cover_url'>
  & Partial<Pick<CatalogPsychologist, 'approach' | 'specialty' | 'modality' | 'region' | 'bio'>>;

export function needsCatalog(bonds: PatientBond[]): boolean {
  return !bonds.some((bond) => bond.status === 'active');
}

export function psychologistProfile(id: number, bonds: PatientBond[], catalog: CatalogPsychologist[] | null): {
  profile: PsychologistProfileView | null; bond: PatientBond | null; canRequest: boolean;
} {
  const bond = selectBond(bonds.filter((b) => b.psychologist.id === id && b.status !== 'ended'));
  const listed = catalog?.find((p) => p.id === id) ?? null;
  const fromBond = bond ? {
    ...bond.psychologist, id,
    avatar_url: bond.psychologist.avatar_url ?? null, cover_url: bond.psychologist.cover_url ?? null,
  } : null;
  // A API só aceita uma solicitação quando não há outra pendente nem vínculo ativo.
  const canRequest = !bonds.some((b) => b.status === 'active' || b.status === 'pending');
  return { profile: listed ? { ...listed, ...fromBond } : fromBond, bond, canRequest };
}
