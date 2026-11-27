import type { Appointment } from '../api/patient/types.ts';

type DayGroup = { day: string; appointments: Appointment[] };

function localDay(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// A grade começa no domingo e marca consultas no fuso do aparelho.
export function calendarDays(month: Date, appointments: readonly { scheduled_at: string }[]) {
  const year = month.getFullYear();
  const index = month.getMonth();
  const firstWeekday = new Date(year, index, 1).getDay();
  const lastDay = new Date(year, index + 1, 0).getDate();
  const marked = new Set(appointments.map((item) => localDay(item.scheduled_at)));
  const length = Math.ceil((firstWeekday + lastDay) / 7) * 7;
  return Array.from({ length }, (_, i) => {
    const day = i - firstWeekday + 1;
    if (day < 1 || day > lastDay) return null;
    return { day, hasAppointment: marked.has(localDay(new Date(year, index, day).toISOString())) };
  });
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

// Só agendada ou reagendada conta: cancelada não vai acontecer e realizada já passou.
export function nextAppointment(appointments: Appointment[], now = new Date()): Appointment | null {
  return appointments
    .filter((a) => (a.status === 'scheduled' || a.status === 'rescheduled') && Date.parse(a.scheduled_at) >= now.getTime())
    .reduce<Appointment | null>((next, a) => !next || Date.parse(a.scheduled_at) < Date.parse(next.scheduled_at) ? a : next, null);
}
