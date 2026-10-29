import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPatientHttp } from './http.ts';

test('adaptador envia métodos, rotas, filtros e corpos do contrato', async () => {
  const calls: unknown[] = [];
  const api = createPatientHttp(async <T>(method: string, path: string, body?: unknown) => {
    calls.push([method, path, body]);
    return {} as T;
  });
  await api.currentConsent();
  await api.acceptConsent(1);
  await api.bonds({ page: 2, per_page: 10 });
  await api.redeemInvitation('ABCD2345');
  await api.requestBond(7);
  await api.endBond(8);
  await api.catalogPsychologists();
  await api.reports();
  await api.createReport({ body: 'Hoje', visibility: 'private' });
  await api.changeVisibility(3, 'private');
  await api.unpublishReport(3);
  await api.tasks();
  await api.completeTask(4);
  await api.messages(8, { after_id: 40, per_page: 100 });
  await api.sendMessage(8, 'Bom dia');
  await api.readMessages(8);
  await api.appointments({ from: '2026-10-29', to: '2026-11-03' });
  await api.notifications({ unread: true });
  await api.readNotification(5);
  await api.readAllNotifications();
  assert.deepEqual(calls, [
    ['GET', '/consent-terms/current?type=general', undefined],
    ['POST', '/consent-acceptances', { consent_term_id: 1 }],
    ['GET', '/patient/bonds?page=2&per_page=10', undefined],
    ['POST', '/patient/bonds/redeem-invitation', { code: 'ABCD2345' }],
    ['POST', '/patient/bonds/requests', { psychologist_id: 7 }],
    ['POST', '/bonds/8/end', undefined],
    ['GET', '/catalog/psychologists', undefined],
    ['GET', '/patient/reports', undefined],
    ['POST', '/patient/reports', { body: 'Hoje', visibility: 'private' }],
    ['PATCH', '/patient/reports/3', { visibility: 'private' }],
    ['POST', '/patient/reports/3/unpublish', undefined],
    ['GET', '/patient/tasks', undefined],
    ['POST', '/patient/tasks/4/complete', undefined],
    ['GET', '/bonds/8/messages?after_id=40&per_page=100', undefined],
    ['POST', '/bonds/8/messages', { body: 'Bom dia' }],
    ['POST', '/bonds/8/messages/read', undefined],
    ['GET', '/patient/appointments?from=2026-10-29&to=2026-11-03', undefined],
    ['GET', '/notifications?unread=1', undefined],
    ['POST', '/notifications/5/read', undefined],
    ['POST', '/notifications/read-all', undefined],
  ]);
});
