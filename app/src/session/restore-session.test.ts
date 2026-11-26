import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';

import { getAuthToken, setAuthToken } from '../api/auth-token.ts';
import { createMockApi } from '../api/mock.ts';
import { ApiError, type Api } from '../api/types.ts';
import { restoreSession, sessionUser, type TokenStorage } from './restore-session.ts';

// Armazenamento falso que conta quantas vezes o token foi apagado.
function fakeStorage(initialToken: string | null) {
  const state = { token: initialToken, clearCalls: 0 };
  const storage: TokenStorage = {
    load: async () => state.token,
    save: async (token) => {
      state.token = token;
    },
    clear: async () => {
      state.token = null;
      state.clearCalls += 1;
    },
  };
  return { storage, state };
}

// Servidor que não responde: o ApiError de status 0 é o que o cliente HTTP lança sem rede.
const offlineApi: Api = {
  register: async () => {
    throw new ApiError(0, 'Sem conexão com o servidor.');
  },
  login: async () => {
    throw new ApiError(0, 'Sem conexão com o servidor.');
  },
  logout: async () => {
    throw new ApiError(0, 'Sem conexão com o servidor.');
  },
  me: async () => {
    throw new ApiError(0, 'Sem conexão com o servidor.');
  },
  patientTasks: async () => {
    throw new ApiError(0, 'Sem conexão com o servidor.');
  },
  completePatientTask: async () => {
    throw new ApiError(0, 'Sem conexão com o servidor.');
  },
  catalogPsychologists: async () => {
    throw new ApiError(0, 'Sem conexão com o servidor.');
  },
  uploadProfileImage: async () => {
    throw new ApiError(0, 'Sem conexão com o servidor.');
  },
  removeProfileImage: async () => {
    throw new ApiError(0, 'Sem conexão com o servidor.');
  },
};

describe('restoreSession', () => {
  beforeEach(() => setAuthToken(null));

  test('sem token guardado, pede login e não deixa token na memória', async () => {
    const { storage } = fakeStorage(null);

    assert.equal(await restoreSession(storage, createMockApi()), null);
    assert.equal(getAuthToken(), null);
  });

  // Nome e foto vão para o avatar do cabeçalho; sem eles a sessão restaurada abriria sem iniciais.
  test('com token válido, devolve papel, nome, foto e capa do /me e deixa o token ativo', async () => {
    const { storage, state } = fakeStorage('mock-token-1'); // paciente do mock

    assert.deepEqual(await restoreSession(storage, createMockApi()), { role: 'patient', name: 'Paciente de Teste', avatarUrl: null, coverUrl: null });
    assert.equal(getAuthToken(), 'mock-token-1');
    assert.equal(state.clearCalls, 0);
  });

  test('com token expirado (401), apaga o token guardado e pede login', async () => {
    const { storage, state } = fakeStorage('mock-token-999'); // usuário que não existe

    assert.equal(await restoreSession(storage, createMockApi()), null);
    assert.equal(getAuthToken(), null);
    assert.equal(state.token, null);
    assert.equal(state.clearCalls, 1);
  });

  test('token revogado pelo logout também é apagado', async () => {
    const api = createMockApi();
    setAuthToken('mock-token-2');
    await api.logout();
    const { storage, state } = fakeStorage('mock-token-2');

    assert.equal(await restoreSession(storage, api), null);
    assert.equal(state.clearCalls, 1);
  });

  // O backend responde 403 no /me quando a conta foi suspensa: o token não volta a valer.
  test('conta suspensa (403 no /me), apaga o token guardado e pede login', async () => {
    const suspendedApi: Api = {
      ...offlineApi,
      me: async () => {
        throw new ApiError(403, 'Conta suspensa.');
      },
    };
    const { storage, state } = fakeStorage('mock-token-1');

    assert.equal(await restoreSession(storage, suspendedApi), null);
    assert.equal(getAuthToken(), null);
    assert.equal(state.token, null);
    assert.equal(state.clearCalls, 1);
  });

  // Sem rede não dá para saber se o token vale: apagar deslogaria quem só está offline.
  test('sem rede, pede login mas mantém o token guardado', async () => {
    const { storage, state } = fakeStorage('mock-token-1');

    assert.equal(await restoreSession(storage, offlineApi), null);
    assert.equal(getAuthToken(), null);
    assert.equal(state.token, 'mock-token-1');
    assert.equal(state.clearCalls, 0);
  });

  test('token de administrador não serve no app e é apagado', async () => {
    const { storage, state } = fakeStorage('mock-token-3'); // admin do mock

    assert.equal(await restoreSession(storage, createMockApi()), null);
    assert.equal(getAuthToken(), null);
    assert.equal(state.clearCalls, 1);
  });
});

describe('sessionUser', () => {
  // A troca de foto devolve o usuário inteiro, e é por aqui que o cabeçalho passa a mostrá-la.
  test('leva a foto e a capa do usuário, e ausência vira null', () => {
    const base = { id: 7, name: 'Pessoa Fictícia', email: 'ficticia@calmind.test' };
    assert.deepEqual(sessionUser({ ...base, role: 'psychologist', avatar_url: 'http://api.teste/users/7/avatar?v=1', cover_url: null }),
      { role: 'psychologist', name: 'Pessoa Fictícia', avatarUrl: 'http://api.teste/users/7/avatar?v=1', coverUrl: null });
    assert.deepEqual(sessionUser({ ...base, role: 'patient' }), { role: 'patient', name: 'Pessoa Fictícia', avatarUrl: null, coverUrl: null });
  });

  test('admin não vira sessão do app', () => {
    assert.equal(sessionUser({ id: 3, name: 'Administrador', email: 'admin@plataforma.local', role: 'admin' }), null);
  });
});
