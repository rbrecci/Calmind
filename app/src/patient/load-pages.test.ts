import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadPatientPages } from './load-pages.ts';

test('listas do paciente incluem as próximas páginas sem perder a ordem', async () => {
  const pages: number[] = [];
  const result = await loadPatientPages(async (query) => {
    pages.push(query.page!);
    return { data: query.page === 1 ? [1, 2] : [3], meta: { total: 3, page: query.page!, per_page: 2 } };
  });
  assert.deepEqual(result, [1, 2, 3]);
  assert.deepEqual(pages, [1, 2]);
});

test('interrompe paginação vazia e repassa erros sem entregar lista parcial', async () => {
  assert.deepEqual(await loadPatientPages(async () => ({ data: [], meta: { total: 3, page: 1, per_page: 50 } })), []);
  await assert.rejects(loadPatientPages(async () => { throw new Error('sem conexão'); }), /sem conexão/);
});
