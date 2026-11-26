import { useRouter } from 'expo-router';
import { useState } from 'react';

import { patientApi } from '@/api/patient';
import type { PatientNotification } from '@/api/patient/types';
import { Button, EmptyState, formatDateTime, ListItem, Text } from '@/design-system';
import { loadPatientPages } from '@/patient/load-pages';
import { notificationRoute, notificationText } from '@/patient/notifications';
import { errorMessage } from '@/patient/presentation';
import { Feedback, PatientPage } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';

const loadNotifications = () => loadPatientPages(patientApi.notifications);

export default function Notifications() {
  const router = useRouter();
  const { data, loading, error, reload } = usePatientData(loadNotifications);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  async function read(notification?: PatientNotification) {
    setBusy(true); setActionError(null);
    try {
      const destination = notification ? await notificationRoute(patientApi, notification) : null;
      if (notification) await patientApi.readNotification(notification.id);
      else await patientApi.readAllNotifications();
      await reload();
      if (destination && destination !== '/notifications') router.dismissTo(destination);
    } catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <PatientPage>
    <Feedback loading={loading} error={error} retry={() => void reload()} initial={data === null} />
    {actionError ? <Text accessibilityRole="alert" color="error">{actionError}</Text> : null}
    {data?.some((n) => !n.read_at) ? <Button tone="patient" variant="secondary" label="Marcar todas como lidas" disabled={busy || loading} onPress={() => void read()} /> : null}
    {data?.length === 0 && !error ? <EmptyState illustration="notificacoes" title="Nenhuma notificação" /> : null}
    {!error ? data?.map((notification) => {
      const title = notificationText(notification.type);
      const date = formatDateTime(notification.created_at);
      return <ListItem key={notification.id} tone="patient" title={title} description={date} unread={!notification.read_at}
        accessibilityLabel={[title, notification.read_at ? null : 'não lida', date].filter(Boolean).join(', ')}
        disabled={busy} onPress={() => void read(notification)} />;
    }) : null}
  </PatientPage>;
}
