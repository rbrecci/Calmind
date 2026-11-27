import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';

import { setAuthToken, setUnauthorizedHandler } from './auth-token.ts';
import { httpApi, imageHeaders } from './http.ts';
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
    setUnauthorizedHandler(null);
    setAuthToken(null);
  });

  test('avisa sobre sessao expirada em 401 autenticado, mas nao em login', async () => {
    let expired = 0;
    setUnauthorizedHandler(() => { expired++; });
    respondWith(401, { message: 'Nao autenticado.' });
    await assert.rejects(httpApi.catalogPsychologists());
    assert.equal(expired, 1);
    await assert.rejects(httpApi.login({ email: 'teste@calmind.test', password: 'incorreta' }));
    assert.equal(expired, 1);
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

describe('foto e capa', () => {
  const realFetch = globalThis.fetch;
  type Sent = { url: string; method: string; headers: Record<string, string>; body: unknown };
  let sent: Sent[];

  function respondWith(status: number, body: unknown) {
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      sent.push({ url, method: String(init.method), headers: init.headers as Record<string, string>, body: init.body });
      return new Response(JSON.stringify(body), { status });
    }) as typeof fetch;
  }

  const USER = { id: 7, name: 'Pessoa Fictícia', email: 'ficticia@calmind.test', role: 'patient', avatar_url: 'http://api.teste/api/v1/users/7/avatar?v=abc', cover_url: null };

  beforeEach(() => {
    sent = [];
    process.env.EXPO_PUBLIC_API_URL = 'http://api.teste/api/v1';
    setAuthToken('token-de-teste');
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    setAuthToken(null);
  });

  test('uploadProfileImage manda multipart no campo image, com o token e sem Content-Type de JSON', async () => {
    respondWith(200, USER);
    const file = new File([new Uint8Array([1, 2, 3])], 'foto.png', { type: 'image/png' });

    const user = await httpApi.uploadProfileImage('avatar', { uri: 'blob:teste', name: 'foto.png', mimeType: 'image/png', file });

    assert.equal(sent[0].url, 'http://api.teste/api/v1/me/avatar');
    assert.equal(sent[0].method, 'POST');
    assert.equal(sent[0].headers.Authorization, 'Bearer token-de-teste');
    assert.equal(sent[0].headers.Accept, 'application/json');
    // O fetch é quem escreve o Content-Type com o boundary do multipart.
    assert.equal(sent[0].headers['Content-Type'], undefined);
    assert.ok(sent[0].body instanceof FormData);
    const part = (sent[0].body as FormData).get('image');
    assert.ok(part instanceof File);
    assert.equal(part.name, 'foto.png');
    assert.equal(user.avatar_url, USER.avatar_url);
  });

  test('uploadProfileImage vai para /me/cover quando é a capa', async () => {
    respondWith(200, { ...USER, cover_url: 'http://api.teste/api/v1/users/7/cover?v=def' });
    await httpApi.uploadProfileImage('cover', { uri: 'blob:teste', name: 'capa.jpg', mimeType: 'image/jpeg', file: new File([new Uint8Array([1])], 'capa.jpg') });
    assert.equal(sent[0].url, 'http://api.teste/api/v1/me/cover');
  });

  test('uploadProfileImage repassa o 422 com os erros do campo', async () => {
    respondWith(422, { message: 'A imagem é inválida.', errors: { image: ['A imagem deve ter no máximo 2048 KB.'] } });

    await assert.rejects(
      httpApi.uploadProfileImage('avatar', { uri: 'blob:teste', name: 'grande.png', mimeType: 'image/png', file: new File([new Uint8Array([1])], 'grande.png') }),
      (error: unknown) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.status, 422);
        assert.deepEqual(error.errors, { image: ['A imagem deve ter no máximo 2048 KB.'] });
        return true;
      },
    );
  });

  test('uploadProfileImage sem rede vira ApiError de status 0', async () => {
    globalThis.fetch = (async () => { throw new TypeError('Network request failed'); }) as typeof fetch;

    await assert.rejects(
      httpApi.uploadProfileImage('avatar', { uri: 'file:///foto.jpg', name: 'foto.jpg', mimeType: 'image/jpeg' }),
      (error: unknown) => error instanceof ApiError && error.status === 0,
    );
  });

  test('removeProfileImage faz DELETE na rota da imagem e devolve o usuário', async () => {
    respondWith(200, { ...USER, avatar_url: null });

    const user = await httpApi.removeProfileImage('avatar');

    assert.equal(sent[0].url, 'http://api.teste/api/v1/me/avatar');
    assert.equal(sent[0].method, 'DELETE');
    assert.equal(user.avatar_url, null);
  });

  test('imageHeaders leva o token e o aviso do ngrok; sem sessão, só o aviso', () => {
    assert.deepEqual(imageHeaders(), { Authorization: 'Bearer token-de-teste', 'ngrok-skip-browser-warning': '1' });
    setAuthToken(null);
    assert.deepEqual(imageHeaders(), { 'ngrok-skip-browser-warning': '1' });
  });
});
