import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';

import { setAuthToken } from './auth-token.ts';
import { createMockApi } from './mock.ts';
import { ApiError } from './types.ts';

const PATIENT = { email: 'paciente@calmind.test', password: 'senha-de-teste-123' };

// Falha se a promessa não rejeitar com ApiError, e devolve o erro para conferir status e corpo.
async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    assert.ok(error instanceof ApiError, 'esperava ApiError');
    return error;
  }
  assert.fail('esperava que a chamada falhasse');
}

describe('mock da API', () => {
  beforeEach(() => setAuthToken(null));

  describe('login', () => {
    test('devolve um token para credenciais válidas', async () => {
      const { token } = await createMockApi().login(PATIENT);
      assert.ok(token.length > 0);
    });

    // CA do contrato: a mensagem não pode confirmar que a conta existe.
    test('usa a mesma resposta para senha errada e e-mail desconhecido', async () => {
      const api = createMockApi();
      const wrongPassword = await rejection(api.login({ ...PATIENT, password: 'errada' }));
      const unknownEmail = await rejection(api.login({ email: 'ninguem@calmind.test', password: 'qualquer' }));

      assert.equal(wrongPassword.status, 401);
      assert.equal(unknownEmail.status, 401);
      assert.equal(wrongPassword.message, unknownEmail.message);
    });

    test('responde 422 com errors por campo quando falta dado', async () => {
      const error = await rejection(createMockApi().login({ email: '', password: '' }));

      assert.equal(error.status, 422);
      assert.deepEqual(Object.keys(error.errors ?? {}).sort(), ['email', 'password']);
    });
  });

  describe('me', () => {
    test('responde 401 sem token', async () => {
      const error = await rejection(createMockApi().me());
      assert.equal(error.status, 401);
    });

    test('devolve o usuário do token, com o papel e sem a senha', async () => {
      const api = createMockApi();
      setAuthToken((await api.login(PATIENT)).token);

      const user = await api.me();

      assert.equal(user.role, 'patient');
      assert.equal(user.email, PATIENT.email);
      assert.equal('password' in user, false);
    });
  });

  describe('logout', () => {
    test('invalida o token', async () => {
      const api = createMockApi();
      setAuthToken((await api.login(PATIENT)).token);

      await api.logout();

      const error = await rejection(api.me());
      assert.equal(error.status, 401);
    });
  });

  describe('register', () => {
    test('cria a conta com o papel pedido e nunca devolve a senha', async () => {
      const user = await createMockApi().register({
        name: 'Nova Pessoa',
        email: 'nova@calmind.test',
        password: 'senha-de-teste-123',
        role: 'psychologist',
      });

      assert.equal(user.role, 'psychologist');
      assert.equal(typeof user.id, 'number');
      assert.equal('password' in user, false);
    });

    test('a conta criada consegue entrar', async () => {
      const api = createMockApi();
      await api.register({ name: 'Nova Pessoa', email: 'Nova@Calmind.test', password: 'abc12345', role: 'patient' });

      const { token } = await api.login({ email: 'nova@calmind.test', password: 'abc12345' });
      assert.ok(token.length > 0);
    });

    test('recusa e-mail repetido com 422 e sem vazar dado da conta existente', async () => {
      const error = await rejection(
        createMockApi().register({ name: 'Outro', email: PATIENT.email, password: 'abc12345', role: 'patient' }),
      );

      assert.equal(error.status, 422);
      assert.ok(error.errors?.email);
      assert.equal(JSON.stringify(error).includes('Paciente de Teste'), false);
    });
  });
});
