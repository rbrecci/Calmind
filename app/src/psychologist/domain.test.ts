import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { ApiError } from '../api/types.ts';
import type { Appointment, Message, PatientDetail, PatientSummary, SharedReport, Task } from '../api/psychologist/types.ts';
import {
  accessDestination,
  composeRecord,
  formatDueDate,
  isAppointmentConflict,
  lastOwnMessageId,
  localAppointmentIso,
  mergeMessages,
  notificationText,
  patientSummaryView,
  registrationGate,
  sortAppointments,
  splitAppointments,
} from './domain.ts';

describe('registrationGate', () => {
  test('só aprovação libera o início e recusa permite novo cadastro', () => {
    assert.equal(registrationGate('approved'), 'dashboard');
    assert.equal(registrationGate('pending'), 'pending');
    assert.equal(registrationGate('rejected'), 'registration');
    assert.equal(registrationGate('not_submitted'), 'registration');
  });
});

describe('accessDestination', () => {
  test('consentimento tem precedência mesmo sobre um perfil aprovado', () => {
    for (const status of ['approved', 'pending', 'rejected', 'not_submitted', null] as const) {
      assert.equal(accessDestination(false, status, '/dashboard'), 'consent');
      assert.equal(accessDestination(false, status, '/consent'), null);
    }
  });

  test('cadastro pendente, recusado, ausente ou não enviado não libera o início', () => {
    assert.equal(accessDestination(true, 'pending', '/dashboard'), 'review');
    assert.equal(accessDestination(true, 'pending', '/review'), null);
    for (const status of ['rejected', 'not_submitted', null] as const) {
      assert.equal(accessDestination(true, status, '/dashboard'), 'registration');
      assert.equal(accessDestination(true, status, '/registration'), null);
    }
  });

  test('aprovação sai dos portões sem redirecionar novamente o início ou outras telas', () => {
    for (const pathname of ['/consent', '/review', '/registration']) {
      assert.equal(accessDestination(true, 'approved', pathname), 'dashboard');
    }
    assert.equal(accessDestination(true, 'approved', '/dashboard'), null);
    assert.equal(accessDestination(true, 'approved', '/patients/21'), null);
    assert.equal(accessDestination(true, 'approved', '/profile'), null);
  });
});

describe('formatDueDate', () => {
  test('converte prazo sem decidir se a data está no passado', () => {
    assert.equal(formatDueDate('03/11/2026'), '2026-11-03');
    assert.equal(formatDueDate('29/02/2024'), '2024-02-29');
    assert.equal(formatDueDate('01/01/2000'), '2000-01-01');
  });

  test('não normaliza silenciosamente datas inexistentes ou outro formato', () => {
    for (const value of ['29/02/2025', '31/04/2026', '00/11/2026', '03/13/2026', '3/11/2026', '2026-11-03', '']) {
      assert.equal(formatDueDate(value), null, value);
    }
  });
});

describe('localAppointmentIso', () => {
  test('usa o offset da data solicitada, inclusive no horário de verão', () => {
    const previous = process.env.TZ;
    process.env.TZ = 'America/New_York';
    try {
      assert.equal(localAppointmentIso('03/01/2026', '15:30'), '2026-01-03T15:30:00-05:00');
      assert.equal(localAppointmentIso('03/07/2026', '15:30'), '2026-07-03T15:30:00-04:00');
      assert.equal(localAppointmentIso('08/03/2026', '02:30'), null);
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });

  test('aceita UTC e offset fracionário sem perder o horário local', () => {
    const previous = process.env.TZ;
    try {
      process.env.TZ = 'UTC';
      assert.equal(localAppointmentIso('03/11/2026', '00:00'), '2026-11-03T00:00:00+00:00');
      process.env.TZ = 'Asia/Kolkata';
      assert.equal(localAppointmentIso('03/11/2026', '15:05'), '2026-11-03T15:05:00+05:30');
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });

  test('rejeita data e hora inválidas antes da conversão', () => {
    assert.equal(localAppointmentIso('31/02/2026', '15:00'), null);
    assert.equal(localAppointmentIso('03/11/2026', '24:00'), null);
    assert.equal(localAppointmentIso('03/11/2026', '15:60'), null);
    assert.equal(localAppointmentIso('03/11/2026', '9:00'), null);
  });
});

describe('isAppointmentConflict', () => {
  test('reconhece apenas o 422 com o campo de confirmação do contrato', () => {
    assert.equal(isAppointmentConflict(new ApiError(422, 'Conflito.', { confirm_conflict: ['Confirme.'] })), true);
    assert.equal(isAppointmentConflict(new ApiError(422, 'Data inválida.', { scheduled_at: ['Data no passado.'] })), false);
    assert.equal(isAppointmentConflict(new ApiError(409, 'Encerrado.', { confirm_conflict: ['Confirme.'] })), false);
    assert.equal(isAppointmentConflict(new Error('confirm_conflict')), false);
    assert.equal(isAppointmentConflict(null), false);
  });
});

const patient: PatientDetail = {
  bond_id: 8,
  bond_status: 'active',
  since: '2026-10-20T10:00:00-03:00',
  patient: { id: 21, name: 'Elisa Fictícia' },
  is_minor: false,
  guardian: null,
};

const task: Task = {
  id: 2, bond_id: 8, title: 'Respirar', description: null, due_date: '2026-11-03',
  status: 'pending', completed_at: null, created_at: '2026-10-29T10:00:00-03:00',
};

const appointment: Appointment = {
  id: 3, bond_id: 8, scheduled_at: '2026-11-03T15:00:00-03:00', status: 'scheduled',
  modality: 'online', notes: null, created_at: '2026-10-29T10:00:00-03:00', patient: patient.patient,
};

describe('sortAppointments', () => {
  test('próximas agendadas vêm primeiro; os demais estados ficam no histórico cronológico', () => {
    const appointments: Appointment[] = [
      { ...appointment, id: 6, scheduled_at: '2026-11-04T09:00:00-03:00' },
      { ...appointment, id: 1, scheduled_at: '2026-11-03T14:00:00-03:00', status: 'cancelled' },
      { ...appointment, id: 5, scheduled_at: '2026-11-03T16:00:00+00:00' },
      { ...appointment, id: 2, scheduled_at: '2026-11-05T09:00:00-03:00', status: 'done' },
      { ...appointment, id: 8, scheduled_at: '2026-11-02T09:00:00-03:00' },
      { ...appointment, id: 3, scheduled_at: '2026-11-03T13:00:00-03:00', status: 'rescheduled' },
    ];
    const result = sortAppointments(appointments, Date.parse('2026-11-03T12:00:00-03:00'));
    assert.deepEqual(result.map((entry) => entry.id), [3, 5, 6, 8, 1, 2]);
    assert.deepEqual(appointments.map((entry) => entry.id), [6, 1, 5, 2, 8, 3]);
  });

  test('consulta no instante atual integra as próximas e empate é decidido pelo id', () => {
    const now = Date.parse(appointment.scheduled_at);
    const result = sortAppointments([
      { ...appointment, id: 9, scheduled_at: '2026-11-03T18:00:00+00:00' },
      { ...appointment, id: 4 },
      { ...appointment, id: 1, status: 'done' },
    ], now);
    assert.deepEqual(result.map((entry) => entry.id), [4, 9, 1]);
    assert.deepEqual(sortAppointments([], now), []);
  });
});

describe('composeRecord', () => {
  test('compõe somente as quatro fontes recebidas e ordena relatos por instante', () => {
    const reports: SharedReport[] = [
      { id: 2, body: 'Segundo compartilhamento.', created_at: '2026-10-29T09:00:00-03:00' },
      { id: 1, body: 'Primeiro compartilhamento.', created_at: '2026-10-29T11:00:00+00:00' },
    ];
    const record = composeRecord(patient, reports, [task], [appointment]);

    assert.deepEqual(record.reports.map((entry) => entry.id), [1, 2]);
    assert.deepEqual(record.tasks, [task]);
    assert.deepEqual(record.appointments, [appointment]);
    assert.equal(record.readOnly, false);
    assert.deepEqual(Object.keys(record).sort(), ['appointments', 'patient', 'readOnly', 'reports', 'tasks']);
    assert.deepEqual(reports.map((entry) => entry.id), [2, 1]);
  });

  test('vínculo encerrado é somente leitura e lista vazia não cria contadores', () => {
    const record = composeRecord({ ...patient, bond_status: 'ended' }, [], [], []);
    assert.equal(record.readOnly, true);
    assert.deepEqual(record.reports, []);
    assert.deepEqual(record.tasks, []);
    assert.deepEqual(record.appointments, []);
    assert.equal('hidden_reports' in record, false);
    assert.equal('total_reports' in record, false);
  });
});

describe('notificationText', () => {
  test('inclui o nome de quem pediu vinculo quando disponivel', () => {
    assert.equal(notificationText('bond.requested', 'Ana'), 'Ana pediu vínculo com você');
    assert.equal(notificationText('bond.requested', null), 'Um paciente pediu vínculo com você');
  });
  test('usa somente textos estáticos e tipo desconhecido recebe texto genérico', () => {
    assert.equal(notificationText('message.received'), 'Você recebeu uma mensagem');
    assert.equal(notificationText('bond.requested'), 'Um paciente pediu vínculo com você');
    assert.equal(notificationText('appointment.upcoming'), 'Você tem uma consulta nas próximas 24 horas');
    assert.equal(notificationText('bond.ended'), 'Um vínculo foi encerrado');
    assert.equal(notificationText('tipo.novo'), 'Você recebeu uma notificação');
  });
});

const message: Message = {
  id: 40, bond_id: 8, sender_user_id: 21, mine: false, body: 'Bom dia.',
  sent_at: '2026-10-29T08:15:00-03:00', read_at: null,
};

describe('mergeMessages', () => {
  test('mescla páginas e atualiza leitura sem duplicar nem modificar as fontes', () => {
    const current = [{ ...message, id: 41 }, message];
    const incoming = [{ ...message, read_at: '2026-10-29T08:16:00-03:00' }, { ...message, id: 42 }];
    const merged = mergeMessages(current, incoming);

    assert.deepEqual(merged.map((entry) => entry.id), [40, 41, 42]);
    assert.equal(merged[0].read_at, '2026-10-29T08:16:00-03:00');
    assert.equal(message.read_at, null);
    assert.deepEqual(current.map((entry) => entry.id), [41, 40]);
    assert.deepEqual(mergeMessages([], []), []);
  });
});

describe('splitAppointments', () => {
  test('separa as próximas, da mais perto para a mais longe, das anteriores, da mais recente para a mais antiga', () => {
    const result = splitAppointments([
      { ...appointment, id: 6, scheduled_at: '2026-11-04T09:00:00-03:00' },
      { ...appointment, id: 1, scheduled_at: '2026-11-01T14:00:00-03:00', status: 'cancelled' },
      { ...appointment, id: 3, scheduled_at: '2026-11-03T13:00:00-03:00', status: 'rescheduled' },
      { ...appointment, id: 2, scheduled_at: '2026-11-02T09:00:00-03:00', status: 'done' },
    ], Date.parse('2026-11-03T12:00:00-03:00'));
    assert.deepEqual(result.upcoming.map((entry) => entry.id), [3, 6]);
    assert.deepEqual(result.previous.map((entry) => entry.id), [2, 1]);
  });

  test('agenda vazia tem as duas seções vazias', () => {
    assert.deepEqual(splitAppointments([], Date.now()), { upcoming: [], previous: [] });
  });
});

describe('lastOwnMessageId', () => {
  test('o estado de leitura aparece só na última mensagem própria', () => {
    const message: Message = { id: 1, bond_id: 8, sender_user_id: 2, mine: true, body: 'Oi', sent_at: '2026-10-29T08:00:00-03:00', read_at: null };
    assert.equal(lastOwnMessageId([message, { ...message, id: 4 }, { ...message, id: 5, mine: false }]), 4);
    assert.equal(lastOwnMessageId([{ ...message, mine: false }]), null);
    assert.equal(lastOwnMessageId([]), null);
  });
});

describe('patientSummaryView', () => {
  const NOW = new Date(2026, 10, 24, 10, 0);
  const summary: PatientSummary = {
    bond_id: 8, status: 'active', since: '2026-11-02', ended_at: null, patient: { id: 21, name: 'Luna Lovegood' },
    unread_messages: 0, overdue_tasks: 0, next_appointment_at: null,
  };

  // Função, e não constante: outro teste deste arquivo troca o fuso, e o ISO precisa nascer no fuso da hora do teste.
  const thursday = () => new Date(2026, 10, 26, 15, 0).toISOString();

  test('contador zerado não vira etiqueta nem entra no leitor de tela', () => {
    const view = patientSummaryView(summary, NOW);
    assert.equal(view.tag, null);
    assert.equal(view.summary, 'sem consulta marcada');
    assert.equal(view.accessibilityLabel, 'Luna Lovegood, sem consulta marcada');
  });

  test('consulta nos próximos dias leva só o dia da semana e a hora', () => {
    assert.equal(patientSummaryView({ ...summary, next_appointment_at: thursday() }, NOW).summary, 'consulta qui, 15:00');
    // Hoje também é "nos próximos dias".
    const today = new Date(2026, 10, 24, 18, 30).toISOString();
    assert.equal(patientSummaryView({ ...summary, next_appointment_at: today }, NOW).summary, 'consulta ter, 18:30');
  });

  test('consulta a partir de uma semana leva a data, para o dia da semana não confundir', () => {
    const later = new Date(2026, 11, 1, 9, 0).toISOString();
    assert.equal(patientSummaryView({ ...summary, next_appointment_at: later }, NOW).summary, 'consulta ter, 01/12 às 09:00');
  });

  test('mensagem não lida vira etiqueta de atenção, no singular e no plural', () => {
    assert.deepEqual(patientSummaryView({ ...summary, unread_messages: 1 }, NOW).tag, { kind: 'attention', label: '1 não lida' });
    assert.deepEqual(patientSummaryView({ ...summary, unread_messages: 2 }, NOW).tag, { kind: 'attention', label: '2 não lidas' });
  });

  test('tarefa vencida sem mensagem vira etiqueta negativa', () => {
    assert.deepEqual(patientSummaryView({ ...summary, overdue_tasks: 1 }, NOW).tag, { kind: 'negative', label: '1 tarefa vencida' });
    assert.deepEqual(patientSummaryView({ ...summary, overdue_tasks: 2 }, NOW).tag, { kind: 'negative', label: '2 tarefas vencidas' });
  });

  test('com as duas, a mensagem fica na etiqueta e a tarefa vencida desce para o resumo', () => {
    const view = patientSummaryView({ ...summary, unread_messages: 3, overdue_tasks: 1, next_appointment_at: thursday() }, NOW);
    assert.deepEqual(view.tag, { kind: 'attention', label: '3 não lidas' });
    assert.equal(view.summary, '1 tarefa vencida · consulta qui, 15:00');
    assert.equal(view.accessibilityLabel, 'Luna Lovegood, 3 mensagens não lidas, 1 tarefa vencida, consulta qui, 15:00');
  });
});
