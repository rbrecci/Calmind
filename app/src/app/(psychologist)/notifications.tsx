import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { psychologistApi } from '@/api/psychologist';
import type { Notification } from '@/api/psychologist/types';
import { EmptyState, formatDateTime, ListItem, Loading } from '@/design-system';
import { notificationText } from '@/psychologist/domain';
import { notificationTarget } from '@/psychologist/notification-target';
import { collectPages } from '@/psychologist/resource';
import { Action, ErrorNotice, Page, useResource } from '@/psychologist/ui';

export default function Notifications() {
  const router = useRouter();
  const list = useResource(() => collectPages((page) => psychologistApi.notifications({ page, per_page: 50 })));
  // Ao voltar da conversa ou das solicitações, a lista recarrega para mostrar o que foi lido.
  const reload = list.reload;
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
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
  return <Page>
    {list.data?.some((item) => !item.read_at) ? <Action variant="secondary" label="Marcar todas como lidas" loading={busy} onPress={() => { void readAll(); }} /> : null}
    {list.loading && !list.data ? <Loading /> : null}
    <ErrorNotice error={list.error} retry={list.reload} /><ErrorNotice error={error} />
    {list.data?.length === 0 ? <EmptyState illustration="notificacoes" title="Nenhuma notificação" /> : null}
    {list.data?.map((item) => {
      const title = notificationText(item.type);
      const date = formatDateTime(item.created_at);
      return <ListItem key={item.id} tone="psychologist" title={title} description={date} unread={!item.read_at}
        accessibilityLabel={[title, item.read_at ? null : 'não lida', date].filter(Boolean).join(', ')}
        disabled={busy} onPress={() => { void open(item); }} />;
    })}
  </Page>;
}
