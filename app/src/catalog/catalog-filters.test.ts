import assert from 'node:assert/strict';
import { test } from 'node:test';

import { catalogQuery, hasCatalogFilters } from './catalog-filters.ts';

test('filtros vazios ou só com espaço não vão para a busca', () => {
  assert.deepEqual(catalogQuery({ approach: '  TCC ', specialty: '', region: '   ', modality: 'online' }), { approach: 'TCC', modality: 'online' });
  assert.deepEqual(catalogQuery({ approach: '', specialty: '', region: '' }), {});
});

test('a tela sabe quando há filtro aplicado para explicar a ausência de resultado', () => {
  assert.equal(hasCatalogFilters({}), false);
  assert.equal(hasCatalogFilters({ region: '  ' }), false);
  assert.equal(hasCatalogFilters({ modality: 'presencial' }), true);
});
