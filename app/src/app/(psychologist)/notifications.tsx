import { useState } from 'react';
import { useRouter } from 'expo-router';
import { psychologistApi } from '@/api/psychologist';
import type { Notification } from '@/api/psychologist/types';
import { Text } from '@/design-system';
import { notificationText } from '@/psychologist/domain';
import { notificationTarget } from '@/psychologist/notification-target';
import { collectPages } from '@/psychologist/resource';
import { Action, Card, displayDate, ErrorNotice, Page, useResource } from '@/psychologist/ui';

export default function Notifications() {
  const router = useRouter();
  const list = useResource(() => collectPages((page) => psychologistApi.notifications({ page, per_page: 50 })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function open(item: Notification) {
    setBusy(true); setError(null);
    try {
      const target = await notificationTarget(item, psychologistApi);
      await psychologistApi.readNotification(item.id);
      await list.reload();
      if (target?.kind === 'requests') router.push('/(psychologist)/requests');
      if (target?.kind === 'chat') router.push(`/(psychologist)/patients/${target.patientId}/chat`);
    } catch (cause) { setError(cause); } finally { setBusy(false); }
  }
  async function readAll() {
    setBusy(true); setError(null);
    try { await psychologistApi.readAllNotifications(); await list.reload(); }
    catch (cause) { setError(cause); } finally { setBusy(false); }
  }
  return <Page title="Notificações">
    <Action label="Marcar todas como lidas" loading={busy} onPress={() => { void readAll(); }} />
    {list.loading ? <Text>Carregando notificações...</Text> : null}
    <ErrorNotice error={list.error} retry={list.reload} /><ErrorNotice error={error} />
    {list.data?.length === 0 ? <Text>Nenhuma notificação.</Text> : null}
    {list.data?.map((item) => <Card key={item.id}><Text>{displayDate(item.created_at)}</Text>
      <Text>{item.read_at ? 'Lida' : 'Não lida'}</Text>
      <Action label={notificationText(item.type)} disabled={busy} onPress={() => { void open(item); }} />
    </Card>)}
  </Page>;
}
