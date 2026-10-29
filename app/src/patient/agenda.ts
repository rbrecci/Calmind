import type { Appointment } from '../api/patient/types.ts';

type DayGroup = { day: string; appointments: Appointment[] };

function localDay(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function group(items: Appointment[]): DayGroup[] {
  const days = new Map<string, Appointment[]>();
  for (const appointment of items) {
    const key = localDay(appointment.scheduled_at);
    const rows = days.get(key) ?? [];
    rows.push(appointment); days.set(key, rows);
  }
  return [...days].map(([day, appointments]) => ({ day, appointments }));
}

export function groupAppointments(appointments: Appointment[], now = new Date()) {
  const ordered = [...appointments].sort((a, b) => Date.parse(a.scheduled_at) - Date.parse(b.scheduled_at));
  return {
    upcoming: group(ordered.filter((a) => Date.parse(a.scheduled_at) >= now.getTime())),
    past: group(ordered.filter((a) => Date.parse(a.scheduled_at) < now.getTime()).reverse()),
  };
}

export function appointmentStatus(status: Appointment['status']): string {
  return { scheduled: 'Agendada', rescheduled: 'Reagendada', cancelled: 'Cancelada', done: 'Realizada' }[status];
}
