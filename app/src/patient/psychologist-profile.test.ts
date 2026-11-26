import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import type { PatientBond } from '../api/patient/types.ts';
import type { CatalogPsychologist } from '../api/types.ts';
import { needsCatalog, psychologistProfile } from './psychologist-profile.ts';

const HERMIONE: CatalogPsychologist = {
  id: 1, name: 'Hermione Granger', crp: '06/000001', approach: 'Terapia cognitivo-comportamental', specialty: 'Ansiedade e estresse',
  modality: 'online', region: 'São Paulo, SP', bio: 'Atendo adolescentes e adultos com foco em ansiedade.',
  avatar_url: 'http://api.teste/users/2/avatar?v=1', cover_url: null,
};
const ATTICUS: CatalogPsychologist = { ...HERMIONE, id: 2, name: 'Atticus Finch', crp: '06/000002', approach: 'Psicanálise', bio: null };

function bond(status: PatientBond['status'], psychologistId = 1, id = 8): PatientBond {
  return {
    id, status, origin: 'catalog', requested_at: '2026-11-01T10:00:00-03:00', responded_at: null, ended_at: null, accepted_at: null,
    psychologist: {
      id: psychologistId, name: psychologistId === 1 ? 'Hermione Granger' : 'Atticus Finch', crp: '06/00000' + psychologistId,
      approach: HERMIONE.approach, specialty: HERMIONE.specialty, modality: HERMIONE.modality, region: HERMIONE.region, bio: HERMIONE.bio,
      avatar_url: null, cover_url: 'http://api.teste/users/2/cover?v=2',
    },
    unread_messages: 0,
  };
}

describe('psychologistProfile', () => {
  test('aberto do catálogo, sem vínculo, traz o perfil completo e libera a solicitação', () => {
    const view = psychologistProfile(1, [], [ATTICUS, HERMIONE]);
    assert.equal(view.profile?.name, 'Hermione Granger');
    assert.equal(view.profile?.bio, HERMIONE.bio);
    assert.equal(view.profile?.approach, HERMIONE.approach);
    assert.equal(view.bond, null);
    assert.equal(view.canRequest, true);
  });

  test('vínculo encerrado com outra pessoa não impede pedir de novo', () => {
    const view = psychologistProfile(1, [bond('ended', 2, 3)], [HERMIONE]);
    assert.equal(view.canRequest, true);
  });

  test('aberto pelo vínculo ativo, sem catálogo, mostra o que o vínculo traz e não oferece solicitar', () => {
    const view = psychologistProfile(1, [bond('active')], null);
    assert.equal(view.profile?.name, 'Hermione Granger');
    assert.equal(view.profile?.crp, '06/000001');
    assert.equal(view.profile?.cover_url, 'http://api.teste/users/2/cover?v=2');
    assert.equal(view.bond?.status, 'active');
    assert.equal(view.canRequest, false);
  });

  // O vínculo traz o perfil público com os nomes do catálogo, para a tela ter chips e Apresentação.
  test('aberto pelo vínculo ativo, sem catálogo, traz abordagem, modalidade e apresentação do vínculo', () => {
    const view = psychologistProfile(1, [bond('active')], null);
    assert.equal(view.profile?.approach, HERMIONE.approach);
    assert.equal(view.profile?.specialty, HERMIONE.specialty);
    assert.equal(view.profile?.modality, 'online');
    assert.equal(view.profile?.region, HERMIONE.region);
    assert.equal(view.profile?.bio, HERMIONE.bio);
  });

  test('pedido pendente com outro profissional também bloqueia a solicitação', () => {
    const view = psychologistProfile(1, [bond('pending', 2, 9)], [HERMIONE]);
    assert.equal(view.bond, null);
    assert.equal(view.canRequest, false);
  });

  test('vínculo pendente com o próprio profissional junta o catálogo e mostra o estado', () => {
    const view = psychologistProfile(1, [bond('pending')], [HERMIONE]);
    assert.equal(view.profile?.bio, HERMIONE.bio);
    assert.equal(view.profile?.cover_url, 'http://api.teste/users/2/cover?v=2');
    assert.equal(view.bond?.status, 'pending');
  });

  test('id que não está em lugar nenhum não vira perfil', () => {
    assert.equal(psychologistProfile(99, [bond('active')], [HERMIONE]).profile, null);
  });
});

describe('needsCatalog', () => {
  // A API recusa o catálogo (403) para quem tem vínculo ativo.
  test('só busca o catálogo quando não há vínculo ativo', () => {
    assert.equal(needsCatalog([]), true);
    assert.equal(needsCatalog([bond('pending'), bond('ended', 2, 3)]), true);
    assert.equal(needsCatalog([bond('active')]), false);
  });
});
