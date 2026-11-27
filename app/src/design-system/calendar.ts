// Contas de calendário no fuso do aparelho. A chave de um dia é "AAAA-MM-DD", o mesmo formato que a
// API usa em `from`, `to` e na data do humor.
const pad = (value: number) => String(value).padStart(2, '0');

export function dayKey(value: Date | string): string {
  // Data sem hora já é a chave; passar por Date a leria como meia-noite UTC e voltaria um dia.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDayKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function monthRange(month: Date): { from: string; to: string } {
  return {
    from: dayKey(new Date(month.getFullYear(), month.getMonth(), 1)),
    to: dayKey(new Date(month.getFullYear(), month.getMonth() + 1, 0)),
  };
}

// Semanas começando no domingo; `null` completa a primeira e a última.
export function monthCells(month: Date): (string | null)[] {
  const year = month.getFullYear();
  const index = month.getMonth();
  const first = new Date(year, index, 1).getDay();
  const last = new Date(year, index + 1, 0).getDate();
  return Array.from({ length: Math.ceil((first + last) / 7) * 7 }, (_, i) => {
    const day = i - first + 1;
    return day < 1 || day > last ? null : `${year}-${pad(index + 1)}-${pad(day)}`;
  });
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export function formatMonth(month: Date): string {
  return `${MONTHS[month.getMonth()]} de ${month.getFullYear()}`;
}

export function formatDayKey(key: string): string {
  const date = parseDayKey(key);
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

// Mais recente primeiro, tanto os dias quanto os itens dentro do dia.
export function groupByDay<T extends { created_at: string }>(items: readonly T[]): { key: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of [...items].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))) {
    const key = dayKey(item.created_at);
    const rows = groups.get(key);
    if (rows) rows.push(item);
    else groups.set(key, [item]);
  }
  return [...groups].map(([key, rows]) => ({ key, items: rows }));
}
