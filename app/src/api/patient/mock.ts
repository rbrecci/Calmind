import { getAuthToken } from '../auth-token.ts';
import { ApiError, type CatalogPsychologist, type FieldErrors, type PatientTask } from '../types.ts';
import type {
  Appointment, BondResult, ConsentAcceptance, ConsentTerm, Message, Page, PageQuery,
  PatientApi, PatientBond, PatientNotification, PatientReport, PatientScenario,
} from './types.ts';

const CREATED = '2026-10-29T08:00:00-03:00';
const PROFESSIONALS: CatalogPsychologist[] = [
  { id: 2, name: 'Atticus Finch', crp: '06/000002', approach: 'Psicanálise', specialty: 'Luto e relacionamentos', modality: 'ambos', region: 'Campinas, SP', bio: 'Escuta para adultos em momentos de mudança.' },
  { id: 1, name: 'Hermione Granger', crp: '06/000001', approach: 'Terapia cognitivo-comportamental', specialty: 'Ansiedade e estresse', modality: 'online', region: 'São Paulo, SP', bio: 'Atendo adolescentes e adultos com foco em ansiedade.' },
];

function now(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().replace('Z', '-03:00');
}

function validation(errors: FieldErrors): never {
  throw new ApiError(422, 'Os dados enviados são inválidos.', errors);
}

function page<T>(items: T[], query: PageQuery = {}, defaultSize = 20, maxSize = 50): Page<T> {
  const current = query.page ?? 1;
  const size = query.per_page ?? defaultSize;
  if (!Number.isInteger(current) || current < 1) validation({ page: ['Informe uma página válida.'] });
  if (!Number.isInteger(size) || size < 1 || size > maxSize) validation({ per_page: [`Informe um valor entre 1 e ${maxSize}.`] });
  return structuredClone({ data: items.slice((current - 1) * size, current * size), meta: { total: items.length, page: current, per_page: size } });
}

function find<T extends { id: number }>(items: T[], id: number): T {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new ApiError(404, 'Recurso não encontrado.');
  return item;
}

function bondResult(bond: PatientBond, userId: number): BondResult {
  const { psychologist, unread_messages: _unread, ...fields } = bond;
  return { ...fields, psychologist_id: psychologist.id, patient_user_id: userId };
}

function seed(scenario: PatientScenario, userId: number) {
  const hasBond = scenario !== 'sem-vinculo';
  const active = scenario === 'com-vinculo';
  const bonds: PatientBond[] = hasBond ? [{
    id: 8, status: active ? 'active' : 'pending', origin: 'catalog', requested_at: CREATED,
    responded_at: active ? CREATED : null, ended_at: null,
    psychologist: { id: 1, name: 'Hermione Granger', crp: '06/000001' }, unread_messages: active ? 1 : 0,
  }] : [];
  const reports: PatientReport[] = active ? [
    { id: 2, body: 'Hoje consegui reservar um tempo para descansar.', visibility: 'shared', unpublished_at: null, created_at: CREATED, used_in_analysis: false },
    { id: 1, body: 'Uma anotação só para mim.', visibility: 'private', unpublished_at: null, created_at: '2026-10-28T18:00:00-03:00', used_in_analysis: false },
  ] : [];
  const tasks: PatientTask[] = active ? [{ id: 1, bond_id: 8, title: 'Registrar uma atividade da semana', description: 'Anote algo que trouxe bem-estar nesta semana.', due_date: '2026-11-03', status: 'pending', completed_at: null, created_at: CREATED }] : [];
  const messages: Message[] = active ? [
    { id: 1, bond_id: 8, sender_user_id: userId, mine: true, body: 'Bom dia, consegui fazer a atividade.', sent_at: CREATED, read_at: null },
    { id: 2, bond_id: 8, sender_user_id: 2, mine: false, body: 'Vamos conversar sobre isso no próximo encontro.', sent_at: '2026-10-29T08:15:00-03:00', read_at: null },
  ] : [];
  const appointments: Appointment[] = active ? [
    { id: 1, bond_id: 8, scheduled_at: '2026-11-03T15:00:00-03:00', status: 'scheduled', modality: 'online', notes: 'Trazer o diário da semana', created_at: CREATED, psychologist: { id: 1, name: 'Hermione Granger' } },
    { id: 2, bond_id: 8, scheduled_at: '2026-10-20T15:00:00-03:00', status: 'done', modality: 'presencial', notes: null, created_at: CREATED, psychologist: { id: 1, name: 'Hermione Granger' } },
  ] : [];
  const notifications: PatientNotification[] = active ? [
    { id: 3, type: 'message.received', resource_id: 2, created_at: '2026-10-29T08:15:00-03:00', read_at: null },
    { id: 2, type: 'task.assigned', resource_id: 1, created_at: CREATED, read_at: null },
    { id: 1, type: 'appointment.scheduled', resource_id: 1, created_at: CREATED, read_at: null },
  ] : [];
  return { userId, bonds, reports, tasks, messages, appointments, notifications,
    acceptance: null as ConsentAcceptance | null, failedAttempts: 0, blockedUntil: 0, invitationUsed: false };
}

export function createPatientMock({ scenario = 'com-vinculo' }: { scenario?: PatientScenario } = {}): PatientApi {
  const states = new Map<number, ReturnType<typeof seed>>();
  function state() {
    const id = Number(getAuthToken()?.match(/^mock-token-(\d+)$/)?.[1]);
    if (!Number.isInteger(id) || id < 1) throw new ApiError(401, 'Não autenticado. Entre para continuar.');
    if (id === 2 || id === 3) throw new ApiError(403, 'Você não tem permissão para realizar esta ação.');
    if (!states.has(id)) states.set(id, seed(id === 1 ? scenario : 'sem-vinculo', id));
    return states.get(id)!;
  }
  function active(s: ReturnType<typeof seed>) {
    if (!s.bonds.some((b) => b.status === 'active')) throw new ApiError(409, 'É preciso ter um vínculo ativo para registrar relatos.');
  }
  function available(s: ReturnType<typeof seed>) {
    if (s.bonds.some((b) => b.status === 'active')) throw new ApiError(409, 'Você já tem um vínculo ativo. Encerre o vínculo atual antes de usar um novo código.');
  }
  function addBond(s: ReturnType<typeof seed>, professionalId: number, invitation: boolean) {
    const professional = find(PROFESSIONALS, professionalId);
    const bond: PatientBond = {
      id: Math.max(8, ...s.bonds.map((b) => b.id)) + 1, status: invitation ? 'active' : 'pending',
      origin: invitation ? 'invitation' : 'catalog', requested_at: now(), responded_at: invitation ? now() : null,
      ended_at: null, psychologist: { id: professional.id, name: professional.name, crp: professional.crp }, unread_messages: 0,
    };
    s.bonds.unshift(bond);
    return bondResult(bond, s.userId);
  }
  return {
    async currentConsent() {
      const s = state();
      const term: ConsentTerm = { id: 1, type: 'general', version: '1.0', body: 'Termo fictício para desenvolvimento. O Calmind permite registrar relatos e compartilhar informações com o profissional vinculado. Relatos privados ficam visíveis apenas para você. Seus dados clínicos exigem consentimento para registro. Use somente dados fictícios neste ambiente.', effective_from: CREATED, accepted: s.acceptance !== null };
      return term;
    },
    async acceptConsent(id) {
      const s = state();
      if (id !== 1) validation({ consent_term_id: ['O termo informado não é o vigente.'] });
      s.acceptance ??= { id: 7, consent_term_id: 1, type: 'general', version: '1.0', accepted_at: now(), revoked_at: null };
      return { ...s.acceptance };
    },
    async bonds(query) {
      const s = state();
      const order = { active: 0, pending: 1, ended: 2 };
      return page([...s.bonds].sort((a, b) => order[a.status] - order[b.status] || b.id - a.id), query);
    },
    async redeemInvitation(code) {
      const s = state();
      if (s.blockedUntil > Date.now()) throw new ApiError(429, 'Muitas tentativas. Tente novamente em instantes.');
      if (s.blockedUntil && s.blockedUntil <= Date.now()) { s.failedAttempts = 0; s.blockedUntil = 0; }
      if (code.trim().toUpperCase() !== 'ABCD2345' || s.invitationUsed) {
        s.failedAttempts++;
        if (s.failedAttempts >= 5) s.blockedUntil = Date.now() + 15 * 60 * 1000;
        validation({ code: ['Código de convite inválido ou expirado.'] });
      }
      available(s);
      s.invitationUsed = true;
      s.failedAttempts = 0;
      return addBond(s, 1, true);
    },
    async requestBond(id) {
      const s = state();
      if (!PROFESSIONALS.some((p) => p.id === id)) validation({ psychologist_id: ['Profissional indisponível.'] });
      available(s);
      if (s.bonds.some((b) => b.status === 'pending')) throw new ApiError(409, 'Você já tem uma solicitação pendente.');
      return addBond(s, id, false);
    },
    async endBond(id) {
      const s = state();
      const bond = find(s.bonds, id);
      if (bond.status !== 'active') throw new ApiError(409, 'Este vínculo já está encerrado ou ainda não foi aceito.');
      bond.status = 'ended'; bond.ended_at = now();
      return bondResult(bond, s.userId);
    },
    async catalogPsychologists(query) {
      const s = state();
      if (s.bonds.some((b) => b.status === 'active')) throw new ApiError(403, 'A busca por profissionais é liberada depois que o vínculo atual for encerrado.');
      return page(PROFESSIONALS, query);
    },
    async reports(query) { return page(state().reports, query); },
    async createReport(input) {
      const s = state();
      if (!input.body.trim() || input.body.length > 10000) validation({ body: ['Escreva um relato de até 10000 caracteres.'] });
      if (input.visibility && !['shared', 'private'].includes(input.visibility)) validation({ visibility: ['Escolha Compartilhado ou Privado.'] });
      if (!s.acceptance) throw new ApiError(403, 'É preciso aceitar o termo de uso antes de registrar relatos.');
      active(s);
      const report: PatientReport = { id: Math.max(0, ...s.reports.map((r) => r.id)) + 1, body: input.body.trim(), visibility: input.visibility ?? 'shared', unpublished_at: null, created_at: now(), used_in_analysis: false };
      s.reports.unshift(report);
      return { ...report };
    },
    async changeVisibility(id, visibility) {
      const report = find(state().reports, id);
      if (report.visibility !== visibility) validation({ visibility: [report.visibility === 'private' ? 'Um relato privado não pode ser compartilhado depois. Crie um novo relato compartilhado.' : 'Para retirar o compartilhamento, use a despublicação.'] });
      return { ...report };
    },
    async unpublishReport(id) {
      const report = find(state().reports, id);
      if (report.visibility === 'private') throw new ApiError(409, 'Este relato é privado e não está compartilhado.');
      report.unpublished_at ??= now();
      return { ...report };
    },
    async tasks(query) {
      return page([...state().tasks].sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed') || (a.due_date ?? '').localeCompare(b.due_date ?? '') || a.id - b.id), query);
    },
    async completeTask(id) {
      const s = state();
      const task = find(s.tasks, id);
      if (find(s.bonds, task.bond_id).status !== 'active') throw new ApiError(409, 'O vínculo não está ativo. Esta tarefa é somente leitura.');
      task.completed_at ??= now(); task.status = 'completed';
      return { ...task };
    },
    async messages(id, query) {
      const s = state(); find(s.bonds, id);
      return page(s.messages.filter((m) => m.bond_id === id && m.id > (query?.after_id ?? 0)).sort((a, b) => a.id - b.id), query, 50, 100);
    },
    async sendMessage(id, body) {
      const s = state(); const bond = find(s.bonds, id);
      if (!body.trim() || body.trim().length > 2000) validation({ body: ['Escreva uma mensagem de até 2000 caracteres.'] });
      if (bond.status !== 'active') throw new ApiError(409, 'O vínculo não está ativo. A conversa é somente leitura.');
      if (!s.acceptance) throw new ApiError(403, 'É preciso aceitar o termo de uso antes de enviar mensagens.');
      const message: Message = { id: Math.max(0, ...s.messages.map((m) => m.id)) + 1, bond_id: id, sender_user_id: s.userId, mine: true, body: body.trim(), sent_at: now(), read_at: null };
      s.messages.push(message);
      return { ...message };
    },
    async readMessages(id) {
      const s = state(); const bond = find(s.bonds, id);
      const unread = s.messages.filter((m) => m.bond_id === id && !m.mine && m.read_at === null);
      unread.forEach((m) => { m.read_at = now(); });
      bond.unread_messages = 0;
      return { read: unread.length };
    },
    async appointments(query) {
      return page(state().appointments.filter((a) => (!query?.from || a.scheduled_at.slice(0, 10) >= query.from) && (!query?.to || a.scheduled_at.slice(0, 10) <= query.to)).sort((a, b) => Date.parse(a.scheduled_at) - Date.parse(b.scheduled_at)), query);
    },
    async notifications(query) { return page(state().notifications.filter((n) => !query?.unread || n.read_at === null), query); },
    async readNotification(id) {
      const notification = find(state().notifications, id);
      notification.read_at ??= now(); return { ...notification };
    },
    async readAllNotifications() {
      const unread = state().notifications.filter((n) => n.read_at === null);
      unread.forEach((n) => { n.read_at = now(); }); return { read: unread.length };
    },
  };
}
