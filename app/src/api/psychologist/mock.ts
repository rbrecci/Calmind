import { getAuthToken } from '../auth-token.ts';
import { ApiError, type FieldErrors } from '../types.ts';
import type {
  Appointment, AppointmentInput, AppointmentUpdate, Bond, ConsentAcceptance, ConsentTerm,
  GuardianConsent, GuardianConsentInput, Invitation, Message, Notification, Page,
  PageParams, PatientDetail, Person, Profile, ProfileInput, PsychologistApi, SharedReport,
  Task, TaskInput, TaskUpdate,
} from './types.ts';

const INVITATION_DAYS = 7;
const CONFLICT_MINUTES = 60;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const NOT_FOUND = 'Recurso não encontrado.';
const FORBIDDEN = 'Você não tem permissão para realizar esta ação.';
const CONFLICT = 'Este horário conflita com outra consulta. Confirme para agendar mesmo assim.';

function invalid(errors: FieldErrors): never {
  throw new ApiError(422, 'Os dados enviados são inválidos.', errors);
}

function iso(value: Date): string {
  return `${new Date(value.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 19)}-03:00`;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function page<T>(items: T[], params: PageParams = {}, defaultSize = 20, maxSize = 50): Page<T> {
  const pageNumber = params.page ?? 1;
  const perPage = params.per_page ?? defaultSize;
  const errors: FieldErrors = {};
  if (!Number.isInteger(pageNumber) || pageNumber < 1) errors.page = ['Informe uma página válida.'];
  if (!Number.isInteger(perPage) || perPage < 1 || perPage > maxSize) errors.per_page = [`Informe de 1 a ${maxSize} itens por página.`];
  if (Object.keys(errors).length) invalid(errors);
  return copy({ data: items.slice((pageNumber - 1) * perPage, pageNumber * perPage), meta: { total: items.length, page: pageNumber, per_page: perPage } });
}

type StoredBond = Bond & { patient: Person; is_minor: boolean; guardian: PatientDetail['guardian']; patientConsented: boolean };

export function createPsychologistMock({ scenario = 'com-pacientes', now = () => new Date(), conflictMinutes = CONFLICT_MINUTES }: {
  scenario?: string; now?: () => Date; conflictMinutes?: number;
} = {}): PsychologistApi {
  const stamp = () => iso(now());
  const today = () => stamp().slice(0, 10);
  const relativeDate = (days: number) => {
    const date = new Date(now().getTime() + days * 24 * 60 * 60 * 1000);
    return iso(date).slice(0, 10);
  };
  const future = `${relativeDate(5)}T15:00:00-03:00`;
  const previous = `${relativeDate(-1)}T10:00:00-03:00`;
  let nextId = 100;
  let profile: Profile = {
    id: 1, crp: '06/000001', approval_status: 'approved', approval_note: null,
    profile_approach: 'Terapia cognitivo-comportamental', profile_specialty: 'Ansiedade e estresse',
    profile_modality: 'online', profile_region: 'São Paulo, SP',
    profile_bio: 'Apresentação fictícia para demonstração do aplicativo.', profile_published_at: '2026-10-20T10:00:00-03:00',
  };
  if (scenario === 'cadastro-nao-enviado') profile = {
    id: null, crp: null, approval_status: 'not_submitted', approval_note: null,
    profile_approach: null, profile_specialty: null, profile_modality: null, profile_region: null, profile_bio: null, profile_published_at: null,
  };
  if (scenario === 'cadastro-pendente') profile = { ...profile, approval_status: 'pending', profile_published_at: null };
  if (scenario === 'cadastro-recusado') profile = { ...profile, approval_status: 'rejected', approval_note: 'O documento está ilegível. Envie uma nova cópia.', profile_published_at: null };

  const bonds: StoredBond[] = scenario === 'sem-pacientes' ? [] : [
    { id: 8, status: 'active', patient: { id: 21, name: 'Elizabeth Bennet' }, is_minor: false, guardian: null, patientConsented: true },
    { id: 9, status: 'active', patient: { id: 22, name: 'Harry Potter' }, is_minor: true, guardian: { name: 'Lílian Potter', phone: '(11) 99999-0000', relationship: 'Mãe' }, patientConsented: true },
    { id: 10, status: 'active', patient: { id: 23, name: 'Jo March' }, is_minor: false, guardian: null, patientConsented: false },
    { id: 11, status: 'ended', patient: { id: 24, name: 'Anne Shirley' }, is_minor: false, guardian: null, patientConsented: true },
    { id: 15, status: 'pending', patient: { id: 25, name: 'Frodo Bolseiro' }, is_minor: false, guardian: null, patientConsented: true },
    { id: 16, status: 'pending', patient: { id: 21, name: 'Elizabeth Bennet' }, is_minor: false, guardian: null, patientConsented: true },
  ].map((item) => ({
    ...item, psychologist_id: 1, patient_user_id: item.patient.id, origin: 'catalog',
    requested_at: '2026-10-20T09:00:00-03:00', responded_at: item.status === 'pending' ? null : '2026-10-20T10:00:00-03:00',
    ended_at: item.status === 'ended' ? '2026-10-25T10:00:00-03:00' : null,
  } as StoredBond));
  const invitations: (Invitation & { revoked_at: string | null })[] = [];
  const tasks: Task[] = scenario === 'sem-pacientes' ? [] : [
    { id: 1, bond_id: 8, title: 'Registrar uma atividade da semana', description: 'Anote algo que trouxe bem-estar.', due_date: relativeDate(-1), status: 'pending', completed_at: null, created_at: '2026-10-20T10:00:00-03:00' },
    { id: 2, bond_id: 8, title: 'Exercício de respiração', description: null, due_date: relativeDate(-2), status: 'completed', completed_at: previous, created_at: '2026-10-20T10:00:00-03:00' },
    { id: 3, bond_id: 11, title: 'Atividade do acompanhamento anterior', description: null, due_date: relativeDate(-3), status: 'pending', completed_at: null, created_at: '2026-10-20T10:00:00-03:00' },
  ];
  const archivedTasks = new Set<number>();
  const sharedReports = new Map<number, SharedReport[]>(scenario === 'sem-pacientes' ? [] : [
    [21, [{ id: 60, body: 'Consegui reservar um tempo para caminhar.', created_at: '2026-10-28T10:00:00-03:00' }, { id: 61, body: 'Hoje conversei com uma amiga.', created_at: '2026-10-29T10:00:00-03:00' }]],
    [24, [{ id: 62, body: 'Relato compartilhado durante este acompanhamento.', created_at: '2026-10-22T10:00:00-03:00' }]],
  ]);
  const messages: Message[] = scenario === 'sem-pacientes' ? [] : [
    { id: 40, bond_id: 8, sender_user_id: 21, mine: false, body: 'Bom dia, consegui fazer a atividade.', sent_at: '2026-10-29T08:15:00-03:00', read_at: null },
    { id: 41, bond_id: 8, sender_user_id: 2, mine: true, body: 'Bom dia. Podemos conversar na próxima consulta.', sent_at: '2026-10-29T08:20:00-03:00', read_at: null },
  ];
  const appointments: Appointment[] = scenario === 'sem-pacientes' ? [] : [
    { id: 1, bond_id: 8, scheduled_at: future, status: 'scheduled', modality: 'online', notes: null, created_at: stamp(), patient: { id: 21, name: 'Elizabeth Bennet' } },
    { id: 2, bond_id: 9, scheduled_at: `${relativeDate(6)}T16:00:00-03:00`, status: 'cancelled', modality: 'presencial', notes: null, created_at: stamp(), patient: { id: 22, name: 'Harry Potter' } },
    { id: 3, bond_id: 8, scheduled_at: previous, status: 'done', modality: 'online', notes: null, created_at: previous, patient: { id: 21, name: 'Elizabeth Bennet' } },
  ];
  const notifications: Notification[] = scenario === 'sem-pacientes' ? [] : [
    { id: 5, type: 'message.received', resource_id: 40, created_at: '2026-10-29T08:15:00-03:00', read_at: null },
    { id: 6, type: 'bond.requested', resource_id: 15, created_at: '2026-10-29T08:00:00-03:00', read_at: null },
  ];
  const term: ConsentTerm = { id: 1, type: 'general', version: '1.0', body: 'Termo fictício para demonstração. O uso envolve o tratamento de dados pessoais para acompanhamento psicológico. Leia e registre seu aceite para continuar.', effective_from: '2026-09-29T10:00:00-03:00', accepted: false };
  let acceptance: ConsentAcceptance | null = null;
  const guardianConsents = new Map<number, GuardianConsent[]>();

  function authenticate(): void {
    const token = getAuthToken();
    if (!token || !/^mock-token-[123]$/.test(token)) throw new ApiError(401, 'Não autenticado. Entre para continuar.');
    if (token !== 'mock-token-2') throw new ApiError(403, FORBIDDEN);
  }

  function approved(): void {
    authenticate();
    if (profile.approval_status !== 'approved') throw new ApiError(403, FORBIDDEN);
  }

  function findBond(id: number): StoredBond {
    approved();
    const bond = bonds.find((item) => item.id === id);
    if (!bond) throw new ApiError(404, NOT_FOUND);
    return bond;
  }

  function readableBond(id: number): StoredBond {
    const bond = findBond(id);
    if (bond.status === 'pending') throw new ApiError(404, NOT_FOUND);
    return bond;
  }

  function activeBond(id: number): StoredBond {
    const bond = findBond(id);
    if (bond.status !== 'active') throw new ApiError(409, 'O vínculo não está ativo. Esta ação é somente leitura.');
    return bond;
  }

  function patientBond(id: number): StoredBond {
    approved();
    const matches = bonds.filter((bond) => bond.patient.id === id && bond.status !== 'pending');
    const bond = matches.find((item) => item.status === 'active') ?? matches.at(-1);
    if (!bond) throw new ApiError(404, NOT_FOUND);
    return bond;
  }

  function publicBond(bond: StoredBond): Bond {
    return copy({ id: bond.id, status: bond.status, origin: bond.origin, psychologist_id: bond.psychologist_id, patient_user_id: bond.patient_user_id, requested_at: bond.requested_at, responded_at: bond.responded_at, ended_at: bond.ended_at });
  }

  function pendingRequest(id: number): StoredBond {
    const bond = findBond(id);
    if (bond.status !== 'pending') throw new ApiError(409, 'Esta solicitação não está mais pendente.');
    return bond;
  }

  function findTask(id: number): Task {
    approved();
    const task = tasks.find((item) => item.id === id && !archivedTasks.has(id));
    if (!task) throw new ApiError(404, NOT_FOUND);
    return task;
  }

  function validateTask(input: TaskUpdate, creating: boolean): void {
    const errors: FieldErrors = {};
    const bondId = (input as Partial<TaskInput>).bond_id;
    if (creating && (!Number.isInteger(bondId) || (bondId ?? 0) < 1)) errors.bond_id = ['Informe um vínculo válido.'];
    if ((creating || input.title !== undefined) && (!input.title?.trim() || input.title.length > 150)) errors.title = ['Informe um título de até 150 caracteres.'];
    if (input.description != null && input.description.length > 5000) errors.description = ['Use até 5000 caracteres.'];
    if ((creating || input.due_date !== undefined) && (!input.due_date || !validDate(input.due_date) || input.due_date < today())) errors.due_date = ['Informe um prazo válido, igual ou posterior a hoje.'];
    for (const key of ['completed_at', 'archived_at', ...(creating ? [] : ['bond_id'])]) {
      if (key in input) errors[key] = ['Este campo não pode ser alterado.'];
    }
    if (Object.keys(errors).length) invalid(errors);
  }

  function validateAppointment(input: AppointmentUpdate, excluding?: number): void {
    const errors: FieldErrors = {};
    if (input.scheduled_at !== undefined) {
      const date = Date.parse(input.scheduled_at);
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?[+-]\d{2}:\d{2}$/.test(input.scheduled_at) || !validDate(input.scheduled_at.slice(0, 10)) || !Number.isFinite(date) || date < now().getTime()) {
        errors.scheduled_at = ['Informe uma data e hora válida no futuro.'];
      }
    }
    if (input.modality != null && !['online', 'presencial'].includes(input.modality)) errors.modality = ['Escolha uma modalidade válida.'];
    if (input.notes != null && input.notes.length > 255) errors.notes = ['Use até 255 caracteres.'];
    if (input.confirm_conflict !== undefined && typeof input.confirm_conflict !== 'boolean') errors.confirm_conflict = ['Informe uma confirmação válida.'];
    if (Object.keys(errors).length) invalid(errors);
    if (input.scheduled_at !== undefined && input.confirm_conflict !== true && appointments.some((item) => item.id !== excluding && ['scheduled', 'rescheduled'].includes(item.status) && Math.abs(Date.parse(item.scheduled_at) - Date.parse(input.scheduled_at!)) < conflictMinutes * 60 * 1000)) {
      invalid({ confirm_conflict: [CONFLICT] });
    }
  }

  function findAppointment(id: number): Appointment {
    approved();
    const appointment = appointments.find((item) => item.id === id);
    if (!appointment) throw new ApiError(404, NOT_FOUND);
    return appointment;
  }

  function validateProfile(input: ProfileInput): void {
    const errors: FieldErrors = {};
    for (const field of ['profile_approach', 'profile_specialty', 'profile_region', 'profile_bio'] as const) {
      const value = input[field];
      const max = field === 'profile_bio' ? 3000 : 120;
      if (value != null && (typeof value !== 'string' || value.length > max)) errors[field] = [`Use até ${max} caracteres.`];
    }
    if (input.profile_modality != null && !['online', 'presencial', 'ambos'].includes(input.profile_modality)) errors.profile_modality = ['Escolha uma modalidade válida.'];
    if (Object.keys(errors).length) invalid(errors);
  }

  return {
    async profile() { authenticate(); return copy(profile); },
    async updateProfile(input) {
      approved();
      validateProfile(input);
      if (Object.entries(input).some(([key, value]) => profile[key as keyof Profile] !== value)) profile.profile_published_at = null;
      for (const key of ['profile_approach', 'profile_specialty', 'profile_modality', 'profile_region', 'profile_bio'] as const) {
        if (input[key] !== undefined) Object.assign(profile, { [key]: input[key] });
      }
      return copy(profile);
    },
    async publishProfile() {
      approved();
      if (!profile.profile_bio?.trim()) invalid({ profile_bio: ['Escreva uma apresentação antes de publicar.'] });
      const text = [profile.profile_approach, profile.profile_specialty, profile.profile_region, profile.profile_bio].join(' ');
      if (/(?:R\$\s*\d|\b(?:preço|valor|honorário|reais|desconto|promoção|grátis|gratuito)\b)/iu.test(text)) invalid({ profile_bio: ['O perfil não pode divulgar valores ou expressões promocionais.'] });
      profile.profile_published_at = stamp();
      return copy(profile);
    },
    async submitRegistration(input) {
      authenticate();
      const errors: FieldErrors = {};
      if (!/^(0[1-9]|1\d|2[0-4])$/.test(input.crp_region)) errors.crp_region = ['Informe uma região de CRP válida.'];
      if (!/^\d{4,7}$/.test(input.crp_number)) errors.crp_number = ['Informe o número de CRP com 4 a 7 dígitos.'];
      const document = input.document;
      if (!document || !['application/pdf', 'image/jpeg', 'image/png'].includes(document.mimeType ?? document.file?.type ?? '') || (document.size ?? document.file?.size ?? 0) > 5 * 1024 * 1024 || (!document.uri && !document.file)) errors.document = ['Envie um PDF, JPG ou PNG de até 5 MB.'];
      if (Object.keys(errors).length) invalid(errors);
      if (profile.approval_status === 'approved') throw new ApiError(409, 'Este cadastro profissional já foi aprovado.');
      profile = { ...profile, id: profile.id ?? 1, crp: `${input.crp_region}/${input.crp_number}`, approval_status: 'pending', approval_note: null, profile_published_at: null };
      return copy(profile);
    },
    async patients(params = {}) {
      approved();
      const status = params.status ?? 'active';
      if (!['active', 'ended'].includes(status)) invalid({ status: ['Escolha uma situação válida.'] });
      const rows = bonds.filter((bond) => bond.status === status).map((bond) => ({
        bond_id: bond.id, status: status, since: bond.responded_at ?? bond.requested_at, ended_at: bond.ended_at, patient: bond.patient,
        unread_messages: status === 'ended' ? 0 : messages.filter((message) => message.bond_id === bond.id && !message.mine && !message.read_at).length,
        overdue_tasks: status === 'ended' ? 0 : tasks.filter((task) => task.bond_id === bond.id && task.status === 'pending' && !archivedTasks.has(task.id) && task.due_date !== null && task.due_date < today()).length,
        next_appointment_at: status === 'ended' ? null : appointments.filter((appointment) => appointment.bond_id === bond.id && ['scheduled', 'rescheduled'].includes(appointment.status) && Date.parse(appointment.scheduled_at) > now().getTime()).sort((a, b) => Date.parse(a.scheduled_at) - Date.parse(b.scheduled_at))[0]?.scheduled_at ?? null,
      })).sort((a, b) => a.patient.name.localeCompare(b.patient.name, 'pt-BR'));
      return page(rows, params);
    },
    async patient(id) {
      const bond = patientBond(id);
      return copy({ bond_id: bond.id, bond_status: bond.status as 'active' | 'ended', since: bond.responded_at ?? bond.requested_at, patient: bond.patient, is_minor: bond.is_minor, guardian: bond.guardian });
    },
    async bondRequests(params) {
      approved();
      return page(bonds.filter((bond) => bond.status === 'pending').sort((a, b) => a.requested_at.localeCompare(b.requested_at) || a.id - b.id).map((bond) => ({ id: bond.id, status: 'pending' as const, origin: bond.origin, requested_at: bond.requested_at, patient: bond.patient })), params);
    },
    async acceptBondRequest(id) {
      const bond = pendingRequest(id);
      if (bonds.some((item) => item.patient.id === bond.patient.id && item.status === 'active')) throw new ApiError(409, 'O paciente já possui um vínculo ativo.');
      bond.status = 'active';
      bond.responded_at = stamp();
      return publicBond(bond);
    },
    async rejectBondRequest(id) {
      const bond = pendingRequest(id);
      bond.status = 'ended';
      bond.responded_at = stamp();
      bond.ended_at = stamp();
      return publicBond(bond);
    },
    async createInvitation() {
      authenticate();
      if (profile.approval_status !== 'approved') throw new ApiError(403, 'Seu cadastro profissional ainda não foi aprovado.');
      let code: string;
      do { code = Array.from({ length: 8 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join(''); } while (invitations.some((item) => item.code === code));
      const invitation: Invitation = { id: nextId++, code, expires_at: iso(new Date(now().getTime() + INVITATION_DAYS * 24 * 60 * 60 * 1000)), created_at: stamp() };
      invitations.push({ ...invitation, revoked_at: null });
      return copy(invitation);
    },
    async revokeInvitation(id) {
      authenticate();
      const invitation = invitations.find((item) => item.id === id);
      if (!invitation) throw new ApiError(404, NOT_FOUND);
      invitation.revoked_at ??= stamp();
      return copy({ id: invitation.id, code: invitation.code, expires_at: invitation.expires_at, revoked_at: invitation.revoked_at });
    },
    async endBond(id) {
      const bond = findBond(id);
      if (bond.status !== 'active') throw new ApiError(409, 'Este vínculo já está encerrado ou ainda não foi aceito.');
      bond.status = 'ended';
      bond.ended_at = stamp();
      return publicBond(bond);
    },
    async reports(id, params) {
      patientBond(id);
      return page([...(sharedReports.get(id) ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id), params);
    },
    async tasks(params = {}) {
      approved();
      if (params.bond_id !== undefined) findBond(params.bond_id);
      return page(tasks.filter((task) => !archivedTasks.has(task.id) && (params.bond_id === undefined || task.bond_id === params.bond_id)).sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed') || (a.due_date ?? '').localeCompare(b.due_date ?? '') || a.id - b.id), params);
    },
    async createTask(input) {
      approved();
      validateTask(input, true);
      const bond = findBond(input.bond_id);
      if (bond.status !== 'active') throw new ApiError(409, 'O vínculo não está ativo. Esta tarefa é somente leitura.');
      if (!bond.patientConsented) throw new ApiError(403, 'O paciente precisa aceitar o termo de uso vigente antes de receber tarefas.');
      const task: Task = { id: nextId++, bond_id: input.bond_id, title: input.title, description: input.description ?? null, due_date: input.due_date, status: 'pending', completed_at: null, created_at: stamp() };
      tasks.push(task);
      return copy(task);
    },
    async updateTask(id, input) {
      approved();
      validateTask(input, false);
      const task = findTask(id);
      if (findBond(task.bond_id).status !== 'active') throw new ApiError(409, 'O vínculo não está ativo. Esta tarefa é somente leitura.');
      if (task.status === 'completed') throw new ApiError(409, 'Uma tarefa concluída não pode ser editada.');
      for (const key of ['title', 'description', 'due_date'] as const) {
        if (input[key] !== undefined) Object.assign(task, { [key]: input[key] });
      }
      return copy(task);
    },
    async archiveTask(id) {
      const task = findTask(id);
      if (findBond(task.bond_id).status !== 'active') throw new ApiError(409, 'O vínculo não está ativo. Esta tarefa é somente leitura.');
      archivedTasks.add(id);
      return { message: 'Tarefa arquivada.' };
    },
    async messages(id, params = {}) {
      readableBond(id);
      if (params.after_id !== undefined && (!Number.isInteger(params.after_id) || params.after_id < 0)) invalid({ after_id: ['Informe um identificador válido.'] });
      return page(messages.filter((message) => message.bond_id === id && message.id > (params.after_id ?? 0)).sort((a, b) => a.id - b.id), params, 50, 100);
    },
    async sendMessage(id, body) {
      const bond = activeBond(id);
      const text = body.trim();
      if (!text || text.length > 2000) invalid({ body: ['Escreva uma mensagem de 1 a 2000 caracteres.'] });
      if (!bond.patientConsented) throw new ApiError(403, 'É preciso aceitar o termo de uso antes de enviar mensagens.');
      const message: Message = { id: nextId++, bond_id: id, sender_user_id: 2, mine: true, body: text, sent_at: stamp(), read_at: null };
      messages.push(message);
      return copy(message);
    },
    async readMessages(id) {
      readableBond(id);
      let read = 0;
      for (const message of messages) if (message.bond_id === id && !message.mine && !message.read_at) { message.read_at = stamp(); read++; }
      return { read };
    },
    async appointments(params = {}) {
      approved();
      if (params.bond_id !== undefined) findBond(params.bond_id);
      for (const field of ['from', 'to'] as const) if (params[field] !== undefined && !validDate(params[field]!)) invalid({ [field]: ['Informe uma data válida.'] });
      return page(appointments.filter((item) => (params.bond_id === undefined || item.bond_id === params.bond_id) && (!params.from || item.scheduled_at.slice(0, 10) >= params.from) && (!params.to || item.scheduled_at.slice(0, 10) <= params.to)).sort((a, b) => Date.parse(a.scheduled_at) - Date.parse(b.scheduled_at)), params);
    },
    async createAppointment(input: AppointmentInput) {
      approved();
      if (!Number.isInteger(input.bond_id) || input.bond_id < 1) invalid({ bond_id: ['Informe um vínculo válido.'] });
      if (!input.scheduled_at) invalid({ scheduled_at: ['Este campo é obrigatório.'] });
      const bond = activeBond(input.bond_id);
      validateAppointment(input);
      const appointment: Appointment = { id: nextId++, bond_id: input.bond_id, scheduled_at: input.scheduled_at, status: 'scheduled', modality: input.modality ?? null, notes: input.notes ?? null, created_at: stamp(), patient: copy(bond.patient) };
      appointments.push(appointment);
      return copy(appointment);
    },
    async updateAppointment(id, input) {
      const appointment = findAppointment(id);
      activeBond(appointment.bond_id);
      if (['cancelled', 'done'].includes(appointment.status)) throw new ApiError(409, 'Esta consulta não pode ser reagendada.');
      validateAppointment(input, id);
      if (input.scheduled_at !== undefined && input.scheduled_at !== appointment.scheduled_at) { appointment.scheduled_at = input.scheduled_at; appointment.status = 'rescheduled'; }
      if (input.modality !== undefined) appointment.modality = input.modality;
      if (input.notes !== undefined) appointment.notes = input.notes;
      return copy(appointment);
    },
    async cancelAppointment(id) {
      const appointment = findAppointment(id);
      activeBond(appointment.bond_id);
      if (appointment.status === 'done') throw new ApiError(409, 'Uma consulta realizada não pode ser cancelada.');
      appointment.status = 'cancelled';
      return copy(appointment);
    },
    async notifications(params = {}) {
      authenticate();
      return page(notifications.filter((item) => params.unread !== 1 || !item.read_at).sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id), params);
    },
    async readNotification(id) {
      authenticate();
      const notification = notifications.find((item) => item.id === id);
      if (!notification) throw new ApiError(404, NOT_FOUND);
      notification.read_at ??= stamp();
      return copy(notification);
    },
    async readAllNotifications() {
      authenticate();
      let read = 0;
      for (const notification of notifications) if (!notification.read_at) { notification.read_at = stamp(); read++; }
      return { read };
    },
    async currentConsent() { authenticate(); return copy(term); },
    async acceptConsent(id) {
      authenticate();
      if (id !== term.id) invalid({ consent_term_id: ['Aceite a versão vigente do termo.'] });
      acceptance ??= { id: nextId++, consent_term_id: id, type: 'general', version: term.version, accepted_at: stamp(), revoked_at: null };
      term.accepted = true;
      return copy(acceptance);
    },
    async guardianConsents(id, params) {
      const bond = patientBond(id);
      if (bond.status !== 'active') throw new ApiError(404, NOT_FOUND);
      return page(guardianConsents.get(id) ?? [], params);
    },
    async createGuardianConsent(id, input: GuardianConsentInput) {
      const bond = patientBond(id);
      if (bond.status !== 'active') throw new ApiError(404, NOT_FOUND);
      const errors: FieldErrors = {};
      if (!bond.is_minor) errors.patient = ['O paciente precisa ser menor de idade.'];
      if (!input.guardian_name.trim() || input.guardian_name.length > 150) errors.guardian_name = ['Informe o nome do responsável com até 150 caracteres.'];
      if (!validDate(input.obtained_at) || input.obtained_at > today()) errors.obtained_at = ['Informe uma data válida que não seja futura.'];
      if (!['presencial', 'telefone', 'videochamada', 'mensagem_escrita'].includes(input.method)) errors.method = ['Escolha um meio válido.'];
      if (Object.keys(errors).length) invalid(errors);
      const consent: GuardianConsent = { guardian_name: input.guardian_name, obtained_at: input.obtained_at, method: input.method, id: nextId++, note: input.note ?? null, consent_term_id: term.id, registered_by_user_id: 2, created_at: stamp() };
      guardianConsents.set(id, [...(guardianConsents.get(id) ?? []), consent]);
      return copy(consent);
    },
  };
}
