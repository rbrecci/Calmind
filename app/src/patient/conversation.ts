import type { Message, PatientApi } from '../api/patient/types.ts';
import { errorMessage } from './presentation.ts';

export function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  return [...new Map([...current, ...incoming].map((message) => [message.id, message])).values()].sort((a, b) => a.id - b.id);
}

export async function deliverMessage(api: Pick<PatientApi, 'sendMessage'>, bondId: number, body: string) {
  try {
    return { status: 'sent' as const, message: await api.sendMessage(bondId, body) };
  } catch (e) {
    return { status: 'failed' as const, body, error: errorMessage(e) };
  }
}

export function watchConversation(
  api: Pick<PatientApi, 'messages' | 'readMessages'>, bondId: number,
  onMessages: (messages: Message[]) => void, onError: (message: string) => void,
) {
  let stopped = false;
  let working = false;
  let lastId = 0;
  let first = true;
  async function refresh() {
    if (stopped || working) return;
    working = true;
    try {
      const afterId = lastId;
      const messages: Message[] = [];
      for (let current = 1; !stopped; current++) {
        const result = await api.messages(bondId, { page: current, per_page: 50, after_id: afterId });
        if (stopped) return;
        messages.push(...result.data);
        if (!result.data.length || messages.length >= result.meta.total) break;
      }
      if (stopped) return;
      lastId = Math.max(lastId, ...messages.map((m) => m.id));
      onMessages(messages);
      // Mesmo sem mensagem nova, repetir read recupera uma falha anterior sem mudar datas de leitura.
      if (first || messages.some((m) => !m.mine && m.read_at === null)) await api.readMessages(bondId);
      first = false;
    } catch (e) {
      if (!stopped) { first = true; onError(errorMessage(e)); }
    } finally { working = false; }
  }
  const interval = setInterval(() => void refresh(), 5000);
  void refresh();
  return { refresh, stop: () => { stopped = true; clearInterval(interval); } };
}
