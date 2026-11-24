// Toda data mostrada em tela passa por aqui. A hora é sempre a local do aparelho, como o app
// avisa ao usuário. Os nomes dos dias são escritos à mão em vez de vir do `Intl`, porque o
// dado de locale do Hermes no Android varia entre versões e a saída mudaria sem aviso.
const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] as const;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, '0');

// Data sem hora é dia de calendário: lida pelo `Date` viraria meia-noite UTC, que no Brasil
// ainda é o dia anterior.
function toLocalDate(iso: string): Date {
  const dateOnly = DATE_ONLY.exec(iso);
  return dateOnly ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])) : new Date(iso);
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
