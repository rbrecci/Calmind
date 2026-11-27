import { ApiError } from '../api/types.ts';
import type { Appointment, Message, PatientDetail, PatientSummary, Profile, SharedReport, Task } from '../api/psychologist/types.ts';
import { formatDateTime, formatTime, formatWeekdayDate } from '../design-system/format-date.ts';
import type { StatusTagKind } from '../design-system/status-kind.ts';

export function registrationGate(status: Profile['approval_status']): 'dashboard' | 'pending' | 'registration' {
  if (status === 'approved') return 'dashboard';
  if (status === 'pending') return 'pending';
  return 'registration';
}

export function accessDestination(
  termAccepted: boolean,
  approvalStatus: Profile['approval_status'] | null,
  pathname: string,
): 'consent' | 'review' | 'registration' | 'dashboard' | null {
  const gate = approvalStatus === null ? 'registration' : registrationGate(approvalStatus);
  const target = !termAccepted ? 'consent' : gate === 'pending' ? 'review' : gate === 'registration' ? 'registration' : null;
  if (target) return pathname === `/${target}` ? null : target;
  return ['/consent', '/review', '/registration'].includes(pathname) ? 'dashboard' : null;
}

export function formatDueDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${yearText}-${monthText}-${dayText}`;
}

export function localAppointmentIso(dateText: string, timeText: string): string | null {
  const datePart = formatDueDate(dateText);
  if (!datePart || !/^(\d{2}):(\d{2})$/.test(timeText)) return null;
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timeText.split(':').map(Number);
  if (hour > 23 || minute > 59) return null;
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day
    || date.getHours() !== hour || date.getMinutes() !== minute) return null;
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
  return `${datePart}T${timeText}:00${sign}${hours}:${minutes}`;
}

export function isAppointmentConflict(error: unknown): boolean {
  return error instanceof ApiError && error.status === 422 && Boolean(error.errors?.confirm_conflict?.length);
}

const isUpcoming = (item: Appointment, now: number) => (item.status === 'scheduled' || item.status === 'rescheduled')
  && Date.parse(item.scheduled_at) >= now;

export function sortAppointments(appointments: Appointment[], now = Date.now()): Appointment[] {
  const upcoming = (item: Appointment) => isUpcoming(item, now);
  return [...appointments].sort((left, right) => Number(upcoming(right)) - Number(upcoming(left))
    || Date.parse(left.scheduled_at) - Date.parse(right.scheduled_at) || left.id - right.id);
}

export function splitAppointments(appointments: Appointment[], now = Date.now()) {
  const sorted = sortAppointments(appointments, now);
  return {
    upcoming: sorted.filter((item) => isUpcoming(item, now)),
    previous: sorted.filter((item) => !isUpcoming(item, now)).reverse(),
  };
}

// O estado de leitura vale para a conversa até ali, então basta mostrá-lo na última mensagem própria.
export function lastOwnMessageId(messages: Message[]): number | null {
  return [...messages].reverse().find((message) => message.mine)?.id ?? null;
}

export function composeRecord(
  patient: PatientDetail,
  reports: SharedReport[],
  tasks: Task[],
  appointments: Appointment[],
) {
  return {
    patient,
    reports: [...reports].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id - b.id),
    tasks: [...tasks],
    appointments: [...appointments].sort((a, b) => Date.parse(a.scheduled_at) - Date.parse(b.scheduled_at) || a.id - b.id),
    readOnly: patient.bond_status === 'ended',
  };
}

// Cartão do paciente no início. A etiqueta mostra só o mais urgente: mensagem não lida, porque é
// alguém esperando resposta, e depois tarefa vencida. Com as duas, a vencida desce para o resumo,
// para não sumir. Contador zerado não aparece, nem para o leitor de tela (R2).
export function patientSummaryView(item: PatientSummary, now = new Date()): {
  tag: { kind: StatusTagKind; label: string } | null; summary: string; accessibilityLabel: string;
} {
  const unread = item.unread_messages;
  const overdue = item.overdue_tasks;
  const overdueText = overdue > 0 ? `${overdue} ${overdue === 1 ? 'tarefa vencida' : 'tarefas vencidas'}` : null;
  const unreadText = unread > 0 ? `${unread} ${unread === 1 ? 'mensagem não lida' : 'mensagens não lidas'}` : null;
  const tag = unread > 0 ? { kind: 'attention' as const, label: `${unread} ${unread === 1 ? 'não lida' : 'não lidas'}` }
    : overdueText ? { kind: 'negative' as const, label: overdueText } : null;
  const appointment = item.next_appointment_at ? `consulta ${appointmentWhen(item.next_appointment_at, now)}` : 'sem consulta marcada';
  const summary = [unread > 0 ? overdueText : null, appointment].filter(Boolean).join(' · ');
  return { tag, summary, accessibilityLabel: [item.patient.name, unreadText, overdueText, appointment].filter(Boolean).join(', ') };
}

// Na semana que vem pela frente, o dia da semana basta ("qui, 15:00"). Daí em diante ele se
// repete, e a data entra para não confundir.
function appointmentWhen(iso: string, now: Date): string {
  const date = new Date(iso);
  const days = Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000);
  if (days >= 0 && days < 7) return `${formatWeekdayDate(iso, now).split(',')[0]}, ${formatTime(iso)}`;
  return formatDateTime(iso, now);
}

export function notificationText(type: string, actorName?: string | null): string {
  if (type === 'message.received') return 'Você recebeu uma mensagem';
  if (type === 'bond.requested') return actorName ? `${actorName} pediu vínculo com você` : 'Um paciente pediu vínculo com você';
  if (type === 'appointment.upcoming') return 'Você tem uma consulta nas próximas 24 horas';
  if (type === 'bond.ended') return 'Um vínculo foi encerrado';
  return 'Você recebeu uma notificação';
}

export function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  const messages = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) messages.set(message.id, message);
  return [...messages.values()].sort((a, b) => a.id - b.id);
}
