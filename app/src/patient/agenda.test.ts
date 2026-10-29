import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Appointment } from '../api/patient/types.ts';
import { appointmentStatus, groupAppointments } from './agenda.ts';

process.env.TZ = 'America/Sao_Paulo';
const appointment: Appointment = { id: 1, bond_id: 8, scheduled_at: '2026-11-03T10:00:00-03:00', status: 'scheduled', modality: 'online', notes: null, created_at: '', psychologist: { id: 1, name: 'Profissional fictício' } };

test('agrupa consultas no dia do aparelho e separa próximas e passadas', () => {
  const data = [appointment, { ...appointment, id: 2, scheduled_at: '2026-10-28T12:00:00-03:00', status: 'done' as const },
    { ...appointment, id: 3, scheduled_at: '2026-11-04T01:00:00+14:00', status: 'rescheduled' as const }];
  const result = groupAppointments(data, new Date('2026-10-29T12:00:00-03:00'));
  assert.equal(result.upcoming.length, 1);
  assert.equal(result.upcoming[0].day, '2026-11-03');
  assert.deepEqual(result.upcoming[0].appointments.map((a) => a.id), [3, 1]);
  assert.equal(result.past[0].day, '2026-10-28');
  assert.deepEqual(data.map((a) => a.id), [1, 2, 3]);
});

test('agenda vazia e todos os estados do contrato têm representação', () => {
  assert.deepEqual(groupAppointments([]), { upcoming: [], past: [] });
  assert.deepEqual(['scheduled', 'rescheduled', 'cancelled', 'done'].map((s) => appointmentStatus(s as Appointment['status'])), ['Agendada', 'Reagendada', 'Cancelada', 'Realizada']);
});
