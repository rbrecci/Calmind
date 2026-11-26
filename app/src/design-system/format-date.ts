// Toda data mostrada em tela passa por aqui. A hora é sempre a local do aparelho, como o app
// avisa ao usuário. Os nomes dos dias são escritos à mão em vez de vir do `Intl`, porque o
// dado de locale do Hermes no Android varia entre versões e a saída mudaria sem aviso.
import type { StatusTagKind } from './status-kind';

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] as const;
const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] as const;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, '0');

// Data sem hora é dia de calendário: lida pelo `Date` viraria meia-noite UTC, que no Brasil
// ainda é o dia anterior.
function toLocalDate(iso: string): Date {
  const dateOnly = DATE_ONLY.exec(iso);
  return dateOnly ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])) : new Date(iso);
}

// Dia de calendário local, "2026-11-25": é o que diz se duas datas caem no mesmo dia.
export function localDayKey(iso: string): string {
  const date = toLocalDate(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// "25/11/2026"
export function formatDate(iso: string): string {
  const date = toLocalDate(iso);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

// "15:00"
export function formatTime(iso: string): string {
  const date = toLocalDate(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// "25/11", com o ano só quando ele não é o atual: "31/12/2025".
export function formatShortDate(iso: string, now: Date = new Date()): string {
  const date = toLocalDate(iso);
  const year = date.getFullYear() === now.getFullYear() ? '' : `/${date.getFullYear()}`;
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}${year}`;
}

// "qua, 25/11", com o ano só quando ele não é o atual: "qua, 31/12/2025".
export function formatWeekdayDate(iso: string, now: Date = new Date()): string {
  const date = toLocalDate(iso);
  const day = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
  const year = date.getFullYear() === now.getFullYear() ? '' : `/${date.getFullYear()}`;
  return `${WEEKDAYS[date.getDay()]}, ${day}${year}`;
}

// "qua, 25/11 às 15:00", com o ano só quando ele não é o atual: "qua, 31/12/2025 às 23:59".
export function formatDateTime(iso: string, now: Date = new Date()): string {
  return `${formatWeekdayDate(iso, now)} às ${formatTime(iso)}`;
}

// Linha que fica ao lado da etiqueta de status da tarefa: "Prazo ter, 24/11" ou "Sem prazo" na
// pendente; na concluída, "em qui, 19/11", que completa a etiqueta "Concluída".
export function formatTaskDate(
  task: { status: 'pending' | 'completed'; due_date: string | null; completed_at: string | null },
  now: Date = new Date(),
): string | null {
  if (task.status === 'completed') return task.completed_at ? `em ${formatWeekdayDate(task.completed_at, now)}` : null;
  return task.due_date ? `Prazo ${formatWeekdayDate(task.due_date, now)}` : 'Sem prazo';
}

// "Segunda, 23/11", com o ano só quando ele não é o atual. Separador de dia da conversa.
export function formatDayHeading(iso: string, now: Date = new Date()): string {
  return `${WEEKDAY_NAMES[toLocalDate(iso).getDay()]}, ${formatShortDate(iso, now)}`;
}

type TaskDates = { status: 'pending' | 'completed'; due_date: string | null; completed_at: string | null };

// Etiqueta de prazo do cartão de tarefa. Pendente: "hoje" e "vencida" em negativo, "até 22/11"
// em neutro. Concluída não vence: a etiqueta é o dia em que foi feita, "feita 16/11". A comparação
// é por dia de calendário, então o prazo de hoje continua "hoje" até a meia-noite.
export function taskDeadlineTag(task: TaskDates, now: Date = new Date()): { kind: StatusTagKind; label: string } {
  if (task.status === 'completed') {
    return { kind: 'neutral', label: task.completed_at ? `feita ${formatShortDate(task.completed_at, now)}` : 'feita' };
  }
  if (!task.due_date) return { kind: 'neutral', label: 'sem prazo' };
  const due = localDayKey(task.due_date);
  const today = localDayKey(now.toISOString());
  if (due === today) return { kind: 'negative', label: 'hoje' };
  if (due < today) return { kind: 'negative', label: 'vencida' };
  return { kind: 'neutral', label: `até ${formatShortDate(task.due_date, now)}` };
}
