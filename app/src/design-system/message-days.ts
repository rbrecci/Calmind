import { formatDayHeading, localDayKey } from './format-date.ts';

export type MessageDayGroup<T> = { key: string; label: string; messages: T[] };

// Conversa em grupos de dia, com o título que vai no separador ("Segunda, 17/11"). Agrupa as
// mensagens seguidas do mesmo dia local, na ordem recebida; quem ordena é a conversa.
export function groupMessagesByDay<T extends { sent_at: string }>(messages: readonly T[], now: Date = new Date()): MessageDayGroup<T>[] {
  const days: MessageDayGroup<T>[] = [];
  for (const message of messages) {
    const key = localDayKey(message.sent_at);
    const last = days[days.length - 1];
    if (last?.key === key) last.messages.push(message);
    else days.push({ key, label: formatDayHeading(message.sent_at, now), messages: [message] });
  }
  return days;
}
