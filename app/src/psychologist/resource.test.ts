import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createResource, collectPages } from './resource.ts';

test('uma resposta antiga não substitui a consulta mais recente', async () => {
  const states: unknown[] = [];
  const resource = createResource<number>((state) => states.push(state));
  let finish!: (value: number) => void;
  const first = resource.load(() => new Promise<number>((resolve) => { finish = resolve; }));
  await resource.load(async () => 2);
  finish(1);
  await first;
  assert.deepEqual(states.at(-1), { data: 2, error: null, loading: false });
});

test('erro limpa dados anteriores e dispose impede atualização', async () => {
  const states: unknown[] = [];
  const resource = createResource<number>((state) => states.push(state));
  await resource.load(async () => 1);
  const error = new Error('Sem conexão');
  await resource.load(async () => { throw error; });
  assert.deepEqual(states.at(-1), { data: null, error, loading: false });
  resource.dispose();
  const count = states.length;
  await resource.load(async () => 3);
  assert.equal(states.length, count);
});

test('listas percorrem as páginas sem perder itens', async () => {
  const pages: number[] = [];
  const items = await collectPages(async (page) => {
    pages.push(page);
    return { data: page === 1 ? ['a', 'b'] : ['c'], meta: { total: 3, page, per_page: 2 } };
  });
  assert.deepEqual(items, ['a', 'b', 'c']);
  assert.deepEqual(pages, [1, 2]);
});
