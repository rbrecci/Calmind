export type StatusTagKind = 'neutral' | 'attention' | 'positive' | 'negative';

// Os status de consulta, tarefa, relato e vínculo que o app mostra. O texto da etiqueta continua
// com cada tela; daqui sai só a cor, para a mesma situação ter a mesma cor nos dois lados do app.
export type TaggedStatus = 'scheduled' | 'rescheduled' | 'cancelled' | 'done' | 'pending' | 'completed'
  | 'private' | 'shared' | 'unpublished' | 'active' | 'ended';

const kinds: Record<TaggedStatus, StatusTagKind> = {
  scheduled: 'neutral',
  rescheduled: 'neutral',
  pending: 'attention',
  done: 'positive',
  completed: 'positive',
  cancelled: 'negative',
  private: 'neutral',
  unpublished: 'neutral',
  shared: 'positive',
  active: 'positive',
  ended: 'neutral',
};

export function statusTagKind(status: TaggedStatus): StatusTagKind {
  return kinds[status];
}
