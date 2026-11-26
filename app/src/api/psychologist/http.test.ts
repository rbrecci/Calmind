import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPsychologistHttp, submitRegistration } from './http.ts';
import { setAuthToken } from '../auth-token.ts';
import { ApiError } from '../types.ts';

test('cliente usa métodos, rotas e corpos do contrato', async () => {
  const calls: unknown[][] = [];
  const api = createPsychologistHttp(async <T>(...args: [string, string, unknown?]) => { calls.push(args); return {} as T; });
  await api.profile();
  await api.patients({ status: 'ended', page: 2 });
  await api.patient(21);
  await api.bondRequests();
  await api.acceptBondRequest(15);
  await api.rejectBondRequest(16);
  await api.createInvitation();
  await api.revokeInvitation(7);
  await api.endBond(8);
  await api.reports(21, { page: 2 });
  await api.tasks({ bond_id: 8 });
  await api.createTask({ bond_id: 8, title: 'Tarefa', due_date: '2026-11-01' });
  await api.updateTask(12, { title: 'Atualizada' });
  await api.archiveTask(12);
  await api.messages(8, { after_id: 40, per_page: 100 });
  await api.sendMessage(8, 'Olá');
  await api.readMessages(8);
  await api.appointments({ bond_id: 8, from: '2026-11-01', to: '2026-11-30' });
  await api.createAppointment({ bond_id: 8, scheduled_at: '2026-11-03T15:00:00-03:00' });
  await api.updateAppointment(3, { confirm_conflict: true });
  await api.cancelAppointment(3);
  await api.notifications({ unread: 1 });
  await api.readNotification(5);
  await api.readAllNotifications();
  await api.currentConsent();
  await api.acceptConsent(1);
  await api.updateProfile({ profile_bio: 'Minha apresentação' });
  await api.publishProfile();
  await api.guardianConsents(22);
  await api.createGuardianConsent(22, { guardian_name: 'Maria', obtained_at: '2026-10-29', method: 'telefone' });
  assert.deepEqual(calls.map(([method, path]) => [method, path]), [
    ['GET', '/psychologist/profile'], ['GET', '/psychologist/patients?status=ended&page=2'], ['GET', '/psychologist/patients/21'],
    ['GET', '/psychologist/bond-requests'], ['POST', '/psychologist/bond-requests/15/accept'], ['POST', '/psychologist/bond-requests/16/reject'],
    ['POST', '/psychologist/invitations'], ['DELETE', '/psychologist/invitations/7'], ['POST', '/bonds/8/end'],
    ['GET', '/psychologist/patients/21/reports?page=2'], ['GET', '/psychologist/tasks?bond_id=8'], ['POST', '/psychologist/tasks'],
    ['PUT', '/psychologist/tasks/12'], ['DELETE', '/psychologist/tasks/12'], ['GET', '/bonds/8/messages?after_id=40&per_page=100'],
    ['POST', '/bonds/8/messages'], ['POST', '/bonds/8/messages/read'], ['GET', '/psychologist/appointments?bond_id=8&from=2026-11-01&to=2026-11-30'],
    ['POST', '/psychologist/appointments'], ['PUT', '/psychologist/appointments/3'], ['POST', '/psychologist/appointments/3/cancel'],
    ['GET', '/notifications?unread=1'], ['POST', '/notifications/5/read'], ['POST', '/notifications/read-all'],
    ['GET', '/consent-terms/current?type=general'], ['POST', '/consent-acceptances'], ['PUT', '/psychologist/profile'],
    ['POST', '/psychologist/profile/publish'], ['GET', '/psychologist/patients/22/guardian-consent'], ['POST', '/psychologist/patients/22/guardian-consent'],
  ]);
  assert.deepEqual(calls[15][2], { body: 'Olá' });
  assert.deepEqual(calls[25][2], { consent_term_id: 1 });
  assert.deepEqual(calls[19][2], { confirm_conflict: true });
});

test('multipart web usa File e cabeçalhos sem Content-Type', async () => {
  setAuthToken('token-de-teste');
  const oldUrl = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test/api/v1';
  try {
    const file = new File(['comprovante'], 'crp.pdf', { type: 'application/pdf' });
    const result = await submitRegistration({ crp_region: '06', crp_number: '123456', document: { uri: 'blob:teste', name: 'crp.pdf', file } }, async (url, init) => {
      assert.equal(url, 'https://api.example.test/api/v1/psychologist/registration');
      assert.equal(init?.method, 'POST');
      assert.deepEqual(init?.headers, { Accept: 'application/json', Authorization: 'Bearer token-de-teste' });
      assert.ok(init?.body instanceof FormData);
      assert.equal(init.body.get('crp_region'), '06');
      assert.equal((init.body.get('document') as File).name, 'crp.pdf');
      return new Response(JSON.stringify({ approval_status: 'pending' }), { status: 201 });
    });
    assert.equal(result.approval_status, 'pending');
  } finally {
    if (oldUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = oldUrl;
    setAuthToken(null);
  }
});

test('multipart converte falha de rede e validação em ApiError', async () => {
  const oldUrl = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test/api/v1';
  const input = { crp_region: '06', crp_number: '123456', document: { uri: 'blob:teste', name: 'crp.pdf', file: new File(['teste'], 'crp.pdf') } };
  try {
    await assert.rejects(submitRegistration(input, async () => { throw new Error('rede'); }), (error: unknown) => error instanceof ApiError && error.status === 0);
    await assert.rejects(submitRegistration(input, async () => new Response(JSON.stringify({ message: 'Documento inválido.', errors: { document: ['Use PDF.'] } }), { status: 422 })), (error: unknown) => error instanceof ApiError && error.status === 422 && error.errors?.document[0] === 'Use PDF.');
  } finally {
    if (oldUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = oldUrl;
  }
});
