import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { ApiError, type Api, type CatalogPsychologist } from '../api/types.ts';
import { loadCatalog, modalityLabel } from './load-catalog.ts';

const ANA: CatalogPsychologist = {
  id: 1,
  name: 'Ana Fictícia',
  crp: '06/000001',
  approach: 'Terapia cognitivo-comportamental',
  specialty: null,
  modality: 'online',
  region: null,
  bio: null,
};

function apiReturning(data: CatalogPsychologist[]): Pick<Api, 'catalogPsychologists'> {
  return { catalogPsychologists: async () => ({ data, meta: { total: data.length, page: 1, per_page: 20 } }) };
}

function apiFailing(error: unknown): Pick<Api, 'catalogPsychologists'> {
  return {
    catalogPsychologists: async () => {
      throw error;
    },
  };
}

describe('loadCatalog', () => {
  test('devolve os profissionais na ordem que a API mandou', async () => {
    const state = await loadCatalog(apiReturning([ANA, { ...ANA, id: 2, name: 'Bruno Fictício' }]));

    assert.equal(state.status, 'ready');
    assert.deepEqual(state.status === 'ready' ? state.psychologists.map((p) => p.id) : [], [1, 2]);
  });

  test('lista vazia vira o estado vazio, não erro', async () => {
    assert.deepEqual(await loadCatalog(apiReturning([])), { status: 'empty' });
  });

  test('erro da API mostra a mensagem em português que ela mandou', async () => {
    const message = 'A busca por profissionais é liberada depois que o vínculo atual for encerrado.';

    assert.deepEqual(await loadCatalog(apiFailing(new ApiError(403, message))), { status: 'error', message });
  });

  test('falha que não é da API vira mensagem humana, sem detalhe técnico', async () => {
    const state = await loadCatalog(apiFailing(new TypeError('Cannot read properties of undefined')));

    assert.deepEqual(state, { status: 'error', message: 'Não foi possível carregar os profissionais. Tente novamente.' });
  });
});

describe('modalityLabel', () => {
  test('traduz os três valores do contrato', () => {
    assert.equal(modalityLabel('online'), 'Online');
    assert.equal(modalityLabel('presencial'), 'Presencial');
    assert.equal(modalityLabel('ambos'), 'Online e presencial');
  });

  test('perfil sem modalidade informada não inventa texto', () => {
    assert.equal(modalityLabel(null), null);
  });
});
