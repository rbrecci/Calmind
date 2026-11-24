import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { DEMO_ACCOUNTS, demoCredentials, isDemoLoginEnabled } from './demo-accounts.ts';

const ON = { EXPO_PUBLIC_DEMO_LOGIN: 'true', EXPO_PUBLIC_DEMO_PASSWORD: 'senha-local' };

describe('isDemoLoginEnabled', () => {
  test('fica desligado sem a flag', () => {
    assert.equal(isDemoLoginEnabled({ EXPO_PUBLIC_DEMO_PASSWORD: 'senha-local' }), false);
  });

  test('fica desligado com a flag diferente de true', () => {
    assert.equal(isDemoLoginEnabled({ ...ON, EXPO_PUBLIC_DEMO_LOGIN: 'false' }), false);
    assert.equal(isDemoLoginEnabled({ ...ON, EXPO_PUBLIC_DEMO_LOGIN: 'TRUE' }), false);
  });

  test('fica desligado com a flag ligada e sem senha', () => {
    assert.equal(isDemoLoginEnabled({ EXPO_PUBLIC_DEMO_LOGIN: 'true' }), false);
    assert.equal(isDemoLoginEnabled({ ...ON, EXPO_PUBLIC_DEMO_PASSWORD: '' }), false);
  });

  test('liga com a flag true e a senha preenchida', () => {
    assert.equal(isDemoLoginEnabled(ON), true);
  });
});

describe('demoCredentials', () => {
  test('devolve null para chave desconhecida ou ausente', () => {
    assert.equal(demoCredentials(ON, 'admin'), null);
    assert.equal(demoCredentials(ON, undefined), null);
  });

  test('devolve null para chave válida com o atalho desligado', () => {
    assert.equal(demoCredentials({ ...ON, EXPO_PUBLIC_DEMO_LOGIN: 'false' }, 'paciente'), null);
  });

  test('devolve o e-mail da conta e a senha do ambiente', () => {
    assert.deepEqual(demoCredentials(ON, 'paciente'), {
      email: 'elizabeth.bennet@example.com',
      password: 'senha-local',
    });
    assert.equal(demoCredentials(ON, 'psicologa-pendente')?.email, 'jane.marple@example.com');
  });

  test('toda conta da lista tem chave única e nenhuma é admin', () => {
    const keys = DEMO_ACCOUNTS.map((account) => account.key);
    assert.equal(new Set(keys).size, keys.length);
    assert.equal(DEMO_ACCOUNTS.some((account) => account.email.startsWith('admin')), false);
  });
});
