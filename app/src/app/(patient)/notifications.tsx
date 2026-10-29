import { useRouter } from 'expo-router';
import { useState } from 'react';

import { patientApi } from '@/api/patient';
import type { PatientNotification } from '@/api/patient/types';
import { Button, Text } from '@/design-system';
import { loadPatientPages } from '@/patient/load-pages';
import { notificationRoute, notificationText } from '@/patient/notifications';
import { errorMessage } from '@/patient/presentation';
import { Card, Feedback, PatientPage, TextAction } from '@/patient/ui';
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
      if (destination && destination !== '/notifications') router.push(destination);
    } catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <PatientPage title="Notificações">
    <Feedback loading={loading} error={error} retry={() => void reload()} />
    {actionError ? <Text accessibilityRole="alert" color="error">{actionError}</Text> : null}
    <Button tone="patient" label="Marcar todas como lidas" disabled={busy || loading || !data?.some((n) => !n.read_at)} onPress={() => void read()} />
    {data?.length === 0 && !loading && !error ? <Text>Nenhuma notificação por enquanto.</Text> : null}
    {!error ? data?.map((notification) => <Card key={notification.id}>
      <TextAction label={notificationText(notification.type)} disabled={busy} onPress={() => void read(notification)} />
      <Text variant="small" color="textSecondary">{notification.read_at ? 'Lida' : 'Não lida'} · {new Date(notification.created_at).toLocaleString('pt-BR')}</Text>
    </Card>) : null}
  </PatientPage>;
}
