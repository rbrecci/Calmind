import type { Message, PsychologistApi } from '../api/psychologist/types.ts';
import { ApiError } from '../api/types.ts';

export type OutgoingMessage = {
  id: number;
  body: string;
  status: 'sending' | 'failed';
  error?: string;
};

export type ChatState = {
  messages: Message[];
  outbox: OutgoingMessage[];
  loading: boolean;
  error: unknown;
};

type Clock = {
  every: (callback: () => void, delay: number) => unknown;
  clear: (handle: unknown) => void;
};

const timer: Clock = {
  every: (callback, delay) => setInterval(callback, delay),
  clear: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
};

export function createChatController(
  api: Pick<PsychologistApi, 'messages' | 'sendMessage' | 'readMessages'>,
  bondId: number,
  onChange: (state: ChatState) => void,
  clock: Clock = timer,
) {
  let state: ChatState = { messages: [], outbox: [], loading: true, error: null };
  let active = false;
  let generation = 0;
  let interval: unknown;
  let polling = false;
  let nextDraft = 1;
  let receivedCursor = 0;

  function publish(next: Partial<ChatState>) {
    state = { ...state, ...next };
    if (active) onChange(state);
  }

  function merge(incoming: Message[]) {
    const byId = new Map(state.messages.map((item) => [item.id, item]));
    incoming.forEach((item) => byId.set(item.id, item));
    return [...byId.values()].sort((left, right) => left.id - right.id);
  }

  async function poll() {
    if (!active || polling) return;
    const currentGeneration = generation;
    polling = true;
    try {
      let cursor = receivedCursor;
      while (active && currentGeneration === generation) {
        const result = await api.messages(bondId, { after_id: cursor, per_page: 100 });
        if (!active || currentGeneration !== generation) return;
        const nextCursor = result.data.at(-1)?.id ?? cursor;
        receivedCursor = Math.max(receivedCursor, nextCursor);
        publish({ messages: merge(result.data), error: null });
        if (result.data.length >= result.meta.total || nextCursor <= cursor) break;
        cursor = nextCursor;
      }
      if (active && currentGeneration === generation) await api.readMessages(bondId);
    } catch (error) {
      if (active && currentGeneration === generation) publish({
        error: error instanceof ApiError ? error : new ApiError(0, 'Não foi possível carregar as mensagens. Tente novamente.'),
      });
    } finally {
      if (currentGeneration === generation) {
        polling = false;
        if (active) publish({ loading: false });
      }
    }
  }

  async function deliver(draft: OutgoingMessage) {
    try {
      const delivered = await api.sendMessage(bondId, draft.body);
      publish({
        messages: merge([delivered]),
        outbox: state.outbox.filter((item) => item.id !== draft.id),
      });
    } catch (error) {
      publish({ outbox: state.outbox.map((item) => item.id === draft.id ? {
        ...item,
        status: 'failed',
        error: error instanceof ApiError && error.errors?.body?.length
          ? error.errors.body.join(' ')
          : error instanceof ApiError ? error.message : 'Não foi possível enviar a mensagem. Tente novamente.',
      } : item) });
    }
  }

  return {
    snapshot: () => state,
    start() {
      if (active) return;
      active = true;
      generation++;
      polling = false;
      publish({ loading: true });
      void poll();
      interval = clock.every(() => { void poll(); }, 5000);
    },
    stop() {
      active = false;
      generation++;
      polling = false;
      clock.clear(interval);
    },
    reload: poll,
    async send(body: string) {
      if (!active) return;
      const draft: OutgoingMessage = { id: nextDraft++, body, status: 'sending' };
      publish({ outbox: [...state.outbox, draft] });
      await deliver(draft);
    },
    async retry(id: number) {
      const draft = state.outbox.find((item) => item.id === id);
      if (!active || !draft || draft.status !== 'failed') return;
      publish({ outbox: state.outbox.map((item) => item.id === id ? { ...item, status: 'sending', error: undefined } : item) });
      await deliver(draft);
    },
  };
}
