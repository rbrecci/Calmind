import type { Notification, PsychologistApi } from '../api/psychologist/types.ts';
import { collectPages } from './resource.ts';

export type NotificationTarget = { kind: 'chat'; patientId: number } | { kind: 'requests' } | null;

export async function notificationTarget(
  notification: Notification,
  api: Pick<PsychologistApi, 'patients' | 'messages'>,
): Promise<NotificationTarget> {
  if (notification.type === 'bond.requested') return { kind: 'requests' };
  if (notification.type !== 'message.received') return null;

  const active = await collectPages((page) => api.patients({ status: 'active', page, per_page: 50 }));
  const ended = await collectPages((page) => api.patients({ status: 'ended', page, per_page: 50 }));
  for (const patient of [...active, ...ended]) {
    let afterId = 0;
    for (;;) {
      const result = await api.messages(patient.bond_id, { after_id: afterId, page: 1, per_page: 100 });
      if (result.data.some((message) => message.id === notification.resource_id)) {
        return { kind: 'chat', patientId: patient.patient.id };
      }
      if (!result.data.length) break;
      const lastId = result.data[result.data.length - 1].id;
      if (lastId >= notification.resource_id || lastId <= afterId || result.data.length >= result.meta.total) break;
      afterId = lastId;
    }
  }
  return null;
}
