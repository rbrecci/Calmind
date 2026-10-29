import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { setAuthToken } from '../auth-token.ts';
import { ApiError } from '../types.ts';
import { createPsychologistMock } from './mock.ts';

const now = () => new Date('2026-10-29T12:00:00-03:00');
const options = { now };
beforeEach(() => setAuthToken('mock-token-2'));
const status = (expected: number, field?: string) => (error: unknown) => {
  assert.ok(error instanceof ApiError);
  assert.equal(error.status, expected);
  if (field) assert.ok(error.errors?.[field]?.length);
  return true;
};

test('os cinco cenários mantêm o contrato do perfil', async () => {
  for (const [scenario, approval] of Object.entries({
    'com-pacientes': 'approved', 'sem-pacientes': 'approved',
    'cadastro-nao-enviado': 'not_submitted', 'cadastro-pendente': 'pending', 'cadastro-recusado': 'rejected',
  })) {
    const api = createPsychologistMock({ scenario, now });
    const profile = await api.profile();
    assert.equal(profile.approval_status, approval);
    if (approval === 'not_submitted') assert.ok(Object.entries(profile).every(([key, value]) => key === 'approval_status' || value === null));
    if (approval === 'rejected') assert.ok(profile.approval_note);
    if (scenario === 'sem-pacientes') assert.equal((await api.patients()).meta.total, 0);
  }
});

test('autenticação e papel são conferidos antes dos dados', async () => {
  const api = createPsychologistMock(options);
  for (const token of [null, 'token-invalido']) {
    setAuthToken(token);
    await assert.rejects(api.profile(), status(401));
  }
  for (const token of ['mock-token-1', 'mock-token-3']) {
    setAuthToken(token);
    await assert.rejects(api.profile(), status(403));
  }
});

test('profissional pendente não recebe pacientes nem grava tarefas', async () => {
  const api = createPsychologistMock({ scenario: 'cadastro-pendente', now });
  await assert.rejects(api.patients(), status(403));
  await assert.rejects(api.createTask({ bond_id: 8, title: 'Exercício', due_date: '2026-11-01' }), status(403));
});

test('listas têm paginação real e contadores não dependem de relatos', async () => {
  const api = createPsychologistMock(options);
  const list = await api.patients({ per_page: 1, page: 2 });
  assert.equal(list.data.length, 1);
  assert.deepEqual(list.meta, { total: 3, page: 2, per_page: 1 });
  assert.deepEqual(Object.keys(list.data[0]).sort(), ['bond_id', 'ended_at', 'next_appointment_at', 'overdue_tasks', 'patient', 'since', 'status', 'unread_messages'].sort());
  const ended = await api.patients({ status: 'ended' });
  assert.equal(ended.data[0].unread_messages, 0);
  assert.equal(ended.data[0].overdue_tasks, 0);
  assert.equal(ended.data[0].next_appointment_at, null);
  await assert.rejects(api.patients({ per_page: 51 }), status(422, 'per_page'));
});

test('paciente usa users.id, responsável aparece só no menor e alheio é 404', async () => {
  const api = createPsychologistMock(options);
  assert.equal((await api.patient(21)).guardian, null);
  assert.equal((await api.patient(22)).guardian?.relationship, 'Mãe');
  assert.equal((await api.patient(24)).bond_status, 'ended');
  await assert.rejects(api.patient(999), status(404));
  await assert.rejects(api.patient(25), status(404));
});

test('relatos contêm somente os campos compartilhados permitidos', async () => {
  const api = createPsychologistMock(options);
  const list = await api.reports(21);
  assert.equal(list.meta.total, list.data.length);
  assert.ok(list.data.every((report) => Object.keys(report).sort().join(',') === 'body,created_at,id'));
  await assert.rejects(api.reports(999), status(404));
});

test('convites têm código permitido e revogação idempotente', async () => {
  const api = createPsychologistMock(options);
  const invitation = await api.createInvitation();
  assert.match(invitation.code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
  assert.equal(new Date(invitation.expires_at).getTime() - now().getTime(), 7 * 24 * 60 * 60 * 1000);
  const first = await api.revokeInvitation(invitation.id);
  assert.ok(first.revoked_at);
  assert.deepEqual(await api.revokeInvitation(invitation.id), first);
  await assert.rejects(api.revokeInvitation(999), status(404));
});

test('aceitar atualiza solicitações e pacientes e repetição tem conflito', async () => {
  const api = createPsychologistMock(options);
  const initial = await api.bondRequests();
  const bond = await api.acceptBondRequest(15);
  assert.equal(bond.status, 'active');
  assert.equal(bond.patient_user_id, 25);
  assert.equal((await api.bondRequests()).meta.total, initial.meta.total - 1);
  assert.ok((await api.patients()).data.some((row) => row.patient.id === 25));
  await assert.rejects(api.acceptBondRequest(15), status(409));
  await assert.rejects(api.acceptBondRequest(16), status(409));
  await assert.rejects(api.acceptBondRequest(999), status(404));
});

test('recusar remove solicitação sem criar vínculo ativo', async () => {
  const api = createPsychologistMock(options);
  assert.equal((await api.rejectBondRequest(15)).status, 'ended');
  assert.ok(!(await api.bondRequests()).data.some((row) => row.id === 15));
  assert.ok(!(await api.patients()).data.some((row) => row.patient.id === 25));
});

test('tarefas respeitam vínculo, consentimento, validação e conclusão', async () => {
  const api = createPsychologistMock(options);
  await assert.rejects(api.createTask({ bond_id: 999, title: 'Exercício', due_date: '2026-11-01' }), status(404));
  await assert.rejects(api.createTask({ bond_id: 11, title: 'Exercício', due_date: '2026-11-01' }), status(409));
  await assert.rejects(api.createTask({ bond_id: 10, title: 'Exercício', due_date: '2026-11-01' }), status(403));
  await assert.rejects(api.createTask({ bond_id: 8, title: '', due_date: '2026-10-28' }), status(422, 'title'));
  await assert.rejects(api.createTask({ bond_id: 8, title: 'Exercício', due_date: '2026-02-30' }), status(422, 'due_date'));
  const task = await api.createTask({ bond_id: 8, title: 'Exercício', due_date: '2026-11-01' });
  assert.equal((await api.updateTask(task.id, { title: 'Atualizada' })).title, 'Atualizada');
  await assert.rejects(api.updateTask(2, { title: 'Proibida' }), status(409));
  assert.equal((await api.archiveTask(task.id)).message, 'Tarefa arquivada.');
  assert.ok(!(await api.tasks({ bond_id: 8 })).data.some((row) => row.id === task.id));
});

test('chat filtra after_id e leitura só marca mensagens recebidas', async () => {
  const api = createPsychologistMock(options);
  const initial = await api.messages(8);
  const outgoing = await api.sendMessage(8, '  Bom dia  ');
  assert.equal(outgoing.body, 'Bom dia');
  assert.equal(outgoing.mine, true);
  assert.deepEqual((await api.messages(8, { after_id: initial.data.at(-1)!.id })).data.map((row) => row.id), [outgoing.id]);
  assert.ok((await api.readMessages(8)).read > 0);
  assert.equal((await api.readMessages(8)).read, 0);
  const latest = await api.messages(8);
  assert.ok(latest.data.filter((row) => !row.mine).every((row) => row.read_at));
  assert.equal(latest.data.find((row) => row.id === outgoing.id)?.read_at, null);
  await assert.rejects(api.sendMessage(8, '  '), status(422, 'body'));
  await assert.rejects(api.sendMessage(11, 'Olá'), status(409));
  await assert.rejects(api.sendMessage(10, 'Olá'), status(403));
  await assert.rejects(api.messages(999), status(404));
});

test('agenda exige confirmação de conflito e respeita estados terminais', async () => {
  const api = createPsychologistMock(options);
  const input = { bond_id: 8, scheduled_at: '2026-11-03T15:30:00-03:00', modality: 'online' as const };
  await assert.rejects(api.createAppointment(input), status(422, 'confirm_conflict'));
  const created = await api.createAppointment({ ...input, confirm_conflict: true });
  assert.equal(created.status, 'scheduled');
  const changed = await api.updateAppointment(created.id, { scheduled_at: '2026-11-04T15:00:00-03:00' });
  assert.equal(changed.status, 'rescheduled');
  const cancelled = await api.cancelAppointment(created.id);
  assert.equal(cancelled.status, 'cancelled');
  assert.deepEqual(await api.cancelAppointment(created.id), cancelled);
  await assert.rejects(api.updateAppointment(created.id, { notes: 'Não' }), status(409));
  await assert.rejects(api.cancelAppointment(3), status(409));
  await assert.rejects(api.createAppointment({ ...input, scheduled_at: '2026-10-28T15:00:00-03:00' }), status(422, 'scheduled_at'));
  await assert.rejects(api.createAppointment({ ...input, bond_id: 11 }), status(409));
});

test('agenda filtra vínculo e intervalo inclusivo', async () => {
  const api = createPsychologistMock(options);
  const list = await api.appointments({ bond_id: 8, from: '2026-11-03', to: '2026-11-03' });
  assert.equal(list.data.length, 1);
  assert.equal(list.data[0].bond_id, 8);
  await assert.rejects(api.appointments({ bond_id: 999 }), status(404));
});

test('notificações são metadados, leitura e marcar todas são idempotentes', async () => {
  const api = createPsychologistMock(options);
  const list = await api.notifications({ unread: 1 });
  assert.ok(list.data.every((row) => Object.keys(row).sort().join(',') === 'created_at,id,read_at,resource_id,type'));
  const first = await api.readNotification(list.data[0].id);
  assert.deepEqual(await api.readNotification(first.id), first);
  await api.readAllNotifications();
  assert.equal((await api.notifications({ unread: 1 })).meta.total, 0);
  assert.equal((await api.readAllNotifications()).read, 0);
  await assert.rejects(api.readNotification(999), status(404));
});

test('consentimento aceita só versão vigente e aceite repetido é idempotente', async () => {
  const api = createPsychologistMock(options);
  const term = await api.currentConsent();
  assert.equal(term.accepted, false);
  await assert.rejects(api.acceptConsent(999), status(422, 'consent_term_id'));
  const acceptance = await api.acceptConsent(term.id);
  assert.deepEqual(await api.acceptConsent(term.id), acceptance);
  assert.equal((await api.currentConsent()).accepted, true);
});

test('cadastro valida região, número e documento e reenvio volta para análise', async () => {
  const api = createPsychologistMock({ scenario: 'cadastro-recusado', now });
  const document = { uri: 'file:///comprovante.pdf', name: 'comprovante.pdf', mimeType: 'application/pdf', size: 1024 };
  await assert.rejects(api.submitRegistration({ crp_region: '25', crp_number: '123', document }), status(422, 'crp_region'));
  await assert.rejects(api.submitRegistration({ crp_region: '06', crp_number: '1234', document: { ...document, size: 6 * 1024 * 1024 } }), status(422, 'document'));
  const profile = await api.submitRegistration({ crp_region: '06', crp_number: '123456', document });
  assert.equal(profile.approval_status, 'pending');
  assert.equal(profile.approval_note, null);
  await assert.rejects(createPsychologistMock(options).submitRegistration({ crp_region: '06', crp_number: '123456', document }), status(409));
});

test('alterar perfil retira publicação e publicar conserva texto informado', async () => {
  const api = createPsychologistMock(options);
  const profile = await api.updateProfile({ profile_bio: 'Apresentação escrita por mim.' });
  assert.equal(profile.profile_published_at, null);
  assert.equal((await api.publishProfile()).profile_bio, profile.profile_bio);
  await api.updateProfile({ profile_bio: '' });
  await assert.rejects(api.publishProfile(), status(422, 'profile_bio'));
});

test('consentimento do responsável só acrescenta em menor com vínculo ativo', async () => {
  const api = createPsychologistMock(options);
  const input = { guardian_name: 'Maria de Teste', obtained_at: '2026-10-29', method: 'telefone' as const };
  const initial = await api.guardianConsents(22);
  await api.createGuardianConsent(22, input);
  assert.equal((await api.guardianConsents(22)).meta.total, initial.meta.total + 1);
  await assert.rejects(api.createGuardianConsent(21, input), status(422, 'patient'));
  await assert.rejects(api.createGuardianConsent(22, { ...input, obtained_at: '2026-10-30' }), status(422, 'obtained_at'));
  await assert.rejects(api.createGuardianConsent(24, input), status(404));
});

test('encerrar vínculo bloqueia escrita e mantém histórico legível', async () => {
  const api = createPsychologistMock(options);
  await api.endBond(8);
  assert.equal((await api.patient(21)).bond_status, 'ended');
  assert.ok((await api.reports(21)).data.length);
  await assert.rejects(api.sendMessage(8, 'Olá'), status(409));
  await assert.rejects(api.endBond(8), status(409));
});

test('instâncias e respostas não compartilham referências mutáveis', async () => {
  const first = createPsychologistMock(options);
  const second = createPsychologistMock(options);
  const list = await first.patients();
  list.data[0].patient.name = 'Alterado';
  assert.notEqual((await first.patients()).data[0].patient.name, 'Alterado');
  await first.acceptBondRequest(15);
  assert.equal((await second.bondRequests()).meta.total, 2);
});

test('listas mantêm a ordem e limites de paginação do contrato', async () => {
  const api = createPsychologistMock(options);
  const patients = await api.patients();
  assert.deepEqual(patients.data.map((row) => row.patient.name), ['Elizabeth Bennet', 'Harry Potter', 'Jo March']);
  const reports = await api.reports(21, { per_page: 1 });
  assert.equal(reports.data[0].id, 61);
  assert.deepEqual(reports.meta, { total: 2, page: 1, per_page: 1 });
  const tasks = await api.tasks({ bond_id: 8 });
  assert.deepEqual(tasks.data.map((row) => row.status), ['pending', 'completed']);
  assert.equal((await api.messages(8, { per_page: 100 })).meta.per_page, 100);
  await assert.rejects(api.messages(8, { per_page: 101 }), status(422, 'per_page'));
  await assert.rejects(api.messages(8, { after_id: -1 }), status(422, 'after_id'));
  await assert.rejects(api.reports(21, { page: 0 }), status(422, 'page'));
  const appointments = await api.appointments();
  assert.deepEqual(appointments.data.map((row) => row.id), [3, 1, 2]);
});

test('conflito usa intervalo estritamente menor que 60 minutos', async () => {
  const api = createPsychologistMock(options);
  await assert.rejects(api.createAppointment({ bond_id: 8, scheduled_at: '2026-11-03T15:59:00-03:00' }), status(422, 'confirm_conflict'));
  assert.equal((await api.createAppointment({ bond_id: 8, scheduled_at: '2026-11-03T16:00:00-03:00' })).status, 'scheduled');
  const updated = await api.updateAppointment(1, { notes: 'Somente observação' });
  assert.equal(updated.status, 'scheduled');
  const cancelled = await api.cancelAppointment(2);
  assert.equal(cancelled.status, 'cancelled');
  assert.equal((await api.createAppointment({ bond_id: 9, scheduled_at: cancelled.scheduled_at })).status, 'scheduled');
});

test('validações não aceitam mudança de vínculo nem campos de conclusão', async () => {
  const api = createPsychologistMock(options);
  await assert.rejects(api.updateTask(1, { bond_id: 9 } as never), status(422, 'bond_id'));
  await assert.rejects(api.updateTask(1, { completed_at: now().toISOString() } as never), status(422, 'completed_at'));
  await assert.rejects(api.createTask({ bond_id: 0, title: 'Exercício', due_date: '2026-11-01' }), status(422, 'bond_id'));
  await assert.rejects(api.createAppointment({ bond_id: 0, scheduled_at: '2026-11-03T15:00:00-03:00' }), status(422, 'bond_id'));
});

test('falha de envio não cria mensagem e acesso alheio não revela conteúdo', async () => {
  const api = createPsychologistMock(options);
  const initial = await api.messages(8);
  await assert.rejects(api.sendMessage(8, 'a'.repeat(2001)), status(422, 'body'));
  assert.deepEqual(await api.messages(8), initial);
  await assert.rejects(api.tasks({ bond_id: 999 }), status(404));
  await assert.rejects(api.updateTask(999, { title: 'Teste' }), status(404));
  await assert.rejects(api.cancelAppointment(999), status(404));
});

test('atualização de tarefa ignora campos que não fazem parte do formulário validado', async () => {
  const api = createPsychologistMock(options);
  const updated = await api.updateTask(1, { title: 'Título revisado', id: 999, status: 'completed' } as never);
  assert.equal(updated.id, 1);
  assert.equal(updated.status, 'pending');
  assert.equal(updated.title, 'Título revisado');
});
