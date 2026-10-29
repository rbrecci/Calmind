import { ApiError } from '../api/types.ts';
import type { PatientApi, PatientNotification } from '../api/patient/types.ts';
import { loadPatientPages } from './load-pages.ts';

const NOTIFICATIONS = {
  'message.received': { text: 'Você recebeu uma mensagem', destination: '/chat' },
  'task.assigned': { text: 'Você tem uma nova tarefa', destination: '/tasks' },
  'appointment.scheduled': { text: 'Uma consulta foi agendada', destination: '/agenda' },
  'appointment.rescheduled': { text: 'Uma consulta foi reagendada', destination: '/agenda' },
  'appointment.cancelled': { text: 'Uma consulta foi cancelada', destination: '/agenda' },
  'bond.accepted': { text: 'Seu pedido de vínculo foi aceito', destination: '/home' },
  'bond.rejected': { text: 'Seu pedido de vínculo não foi aceito', destination: '/home' },
} as const;

function known(type: string) {
  return Object.hasOwn(NOTIFICATIONS, type) ? NOTIFICATIONS[type as keyof typeof NOTIFICATIONS] : null;
}

export function notificationText(type: string): string {
  return known(type)?.text ?? 'Você tem uma nova notificação';
}

export function notificationDestination(type: string) {
  return known(type)?.destination ?? '/notifications';
}
export async function notificationRoute(api: Pick<PatientApi, 'bonds' | 'messages'>, notification: PatientNotification) {
  if (notification.type !== 'message.received') return notificationDestination(notification.type);
  const bonds = await loadPatientPages(api.bonds);
  for (const bond of bonds) {
    if (bond.status === 'pending') continue;
    try {
      const messages = await api.messages(bond.id, { after_id: notification.resource_id - 1, per_page: 1 });
      if (messages.data.some((m) => m.id === notification.resource_id)) {
        return { pathname: '/chat' as const, params: { bondId: bond.id } };
      }
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 404) throw e;
    }
  }
  throw new ApiError(404, 'Não foi possível localizar a conversa desta notificação.');
}
