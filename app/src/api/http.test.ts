import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';

import { setAuthToken } from './auth-token.ts';
import { httpApi } from './http.ts';
import { ApiError } from './types.ts';

type Call = { url: string; method: string; headers: Record<string, string> };

describe('cliente HTTP', () => {
  const realFetch = globalThis.fetch;
  let calls: Call[];

  function respondWith(status: number, body: unknown) {
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, method: String(init.method), headers: init.headers as Record<string, string> });
      return new Response(JSON.stringify(body), { status });
    }) as typeof fetch;
  }

  beforeEach(() => {
    calls = [];
    process.env.EXPO_PUBLIC_API_URL = 'http://api.teste/api/v1';
    setAuthToken('token-de-teste');
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    setAuthToken(null);
  });

  test('catalogPsychologists faz GET em /catalog/psychologists com o token', async () => {
    respondWith(200, { data: [], meta: { total: 0, page: 1, per_page: 20 } });

    const list = await httpApi.catalogPsychologists();

    assert.equal(calls[0].url, 'http://api.teste/api/v1/catalog/psychologists');
    assert.equal(calls[0].method, 'GET');
    assert.equal(calls[0].headers.Authorization, 'Bearer token-de-teste');
    assert.deepEqual(list.data, []);
  });

  test('catalogPsychologists repassa o 403 com a mensagem da API', async () => {
    respondWith(403, { message: 'A busca por profissionais é liberada depois que o vínculo atual for encerrado.' });

    await assert.rejects(httpApi.catalogPsychologists(), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 403);
      assert.match(error.message, /vínculo atual/);
      return true;
    });
  });
});
