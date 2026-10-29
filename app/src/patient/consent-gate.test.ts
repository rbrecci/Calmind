import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decideConsentGate } from './consent-gate.ts';

test('carregamento e falha nunca liberam a área clínica', () => {
  assert.equal(decideConsentGate({ status: 'loading' }), 'loading');
  assert.equal(decideConsentGate({ status: 'error', message: 'Sem conexão' }), 'error');
});

test('só o aceite vigente informado pela API libera a área clínica', () => {
  assert.equal(decideConsentGate({ status: 'ready', accepted: false }), 'consent');
  assert.equal(decideConsentGate({ status: 'ready', accepted: true }), 'allow');
});
