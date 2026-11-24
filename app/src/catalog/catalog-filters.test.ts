import assert from 'node:assert/strict';
import { test } from 'node:test';

import { catalogQuery, countCatalogFilters, hasCatalogFilters } from './catalog-filters.ts';

test('filtros vazios ou só com espaço não vão para a busca', () => {
  assert.deepEqual(catalogQuery({ approach: '  TCC ', specialty: '', region: '   ', modality: 'online' }), { approach: 'TCC', modality: 'online' });
  assert.deepEqual(catalogQuery({ approach: '', specialty: '', region: '' }), {});
});

test('a tela sabe quando há filtro aplicado para explicar a ausência de resultado', () => {
  assert.equal(hasCatalogFilters({}), false);
  assert.equal(hasCatalogFilters({ region: '  ' }), false);
  assert.equal(hasCatalogFilters({ modality: 'presencial' }), true);
});

test('o botão de filtros conta só os filtros que vão para a busca', () => {
  assert.equal(countCatalogFilters({}), 0);
  assert.equal(countCatalogFilters({ approach: '  ', specialty: 'Ansiedade', modality: 'online' }), 2);
  assert.equal(countCatalogFilters({ approach: 'TCC', specialty: 'Luto', region: 'Campinas', modality: 'ambos' }), 4);
});
