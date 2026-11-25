import { useRouter } from 'expo-router';
import { useState } from 'react';

import { patientApi } from '@/api/patient';
import { Button, formatDateTime, formatUnread, Illustration, ListItem, Text } from '@/design-system';
import { nextAppointment } from '@/patient/agenda';
import { bondStatusText, selectBond } from '@/patient/bonds';
import { loadPatientPages } from '@/patient/load-pages';
import { errorMessage } from '@/patient/presentation';
import { splitTasks } from '@/patient/tasks';
import { Card, Confirmation, Feedback, PatientPage } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';
import { useSession } from '@/session/session-context';

async function loadHome() {
  const [bonds, unread] = await Promise.all([loadPatientPages(patientApi.bonds), patientApi.notifications({ unread: true, per_page: 1 })]);
  return { bonds, unread: unread.meta.total };
}

// Fica fora de loadHome: se a agenda ou as tarefas falharem, some só o resumo, não o início.
async function loadSummary() {
  const [appointments, tasks] = await Promise.all([loadPatientPages(patientApi.appointments), loadPatientPages(patientApi.tasks)]);
  return { next: nextAppointment(appointments), pending: splitTasks(tasks).pending.length };
}

export default function PatientHome() {
  const router = useRouter();
  const { signOut } = useSession();
  const { data, loading, error, reload } = usePatientData(loadHome);
  const summary = usePatientData(loadSummary);
  const [ending, setEnding] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const bond = selectBond(data?.bonds ?? []);
  async function endBond() {
    if (!bond) return;
    setBusy(true); setActionError(null);
    try { await patientApi.endBond(bond.id); setEnding(false); await reload(); }
    catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  }
  async function cancelRequest() {
    if (!bond) return;
    setBusy(true); setActionError(null);
    try { await patientApi.cancelBondRequest(bond.id); setCancelling(false); await reload(); }
    catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  }
  const next = summary.data?.next;
  const refresh = async () => { await Promise.all([reload(), summary.reload()]); };
  return <PatientPage title="Seu espaço de cuidado" onRefresh={refresh}>
    <Feedback loading={loading} error={error} retry={() => void reload()} initial={data === null} />
    {data && !error ? <>
      <ListItem tone="patient" title="Notificações" badge={data.unread || undefined}
        accessibilityLabel={`Notificações, ${formatUnread(data.unread)}`} onPress={() => router.push('/notifications')} />
      {bond?.status === 'pending' ? <Illustration name="aguardando" /> : null}
      {bond ? <Card>
        <Text variant="h5">{bond.psychologist.name}</Text>
        <Text color="textSecondary">CRP {bond.psychologist.crp}</Text>
        {/* Ativo é o estado normal e não precisa ser dito; os outros mudam o que a tela oferece. */}
        {bond.status !== 'active' ? <Text>{bondStatusText(bond)}</Text> : null}
      </Card> : null}
      {bond?.status === 'active' && summary.data && !summary.error ? <>
        <ListItem tone="patient" title="Próxima consulta"
          description={next ? [formatDateTime(next.scheduled_at), next.modality === 'online' ? 'Online' : next.modality === 'presencial' ? 'Presencial' : null].filter(Boolean).join(' · ') : 'Nenhuma consulta marcada'}
          onPress={() => router.navigate('/(patient)/(tabs)/agenda')} />
        <ListItem tone="patient" title="Tarefas pendentes" badge={summary.data.pending || undefined}
          description={summary.data.pending ? undefined : 'Nenhuma pendente'} onPress={() => router.navigate('/(patient)/(tabs)/tasks')} />
      </> : null}
      {!bond || bond.status === 'ended' ? <>
        <Illustration name="boas-vindas" />
        <Text variant="h5">Como você chegou aqui?</Text>
        <ListItem tone="patient" title="Tenho um código de convite" onPress={() => router.push('/invitation')} />
        <ListItem tone="patient" title="Quero encontrar um profissional" onPress={() => router.push('/catalog')} />
      </> : null}
      {bond?.status === 'active' ? <Button tone="patient" label="Novo relato" onPress={() => router.push('/new-report')} /> : null}
    </> : null}
    {/* Ações da conta no fim: a destrutiva não é a primeira coisa que se vê ao abrir o app. A
        confirmação aparece logo acima de quem a pediu. */}
    {data && !error ? <>
      {bond?.status === 'active' ? <Button tone="patient" variant="destructive" label="Encerrar vínculo" onPress={() => setEnding(true)} disabled={busy} /> : null}
      {bond?.status === 'pending' ? <Button tone="patient" variant="destructive" label="Cancelar solicitação" onPress={() => setCancelling(true)} disabled={busy} /> : null}
      {actionError ? <Text accessibilityRole="alert" color="error">{actionError}</Text> : null}
      {ending ? <Confirmation message="Encerrar este vínculo? O histórico ficará disponível para leitura e novas trocas serão bloqueadas."
        kind="destructive" confirm={() => void endBond()} cancel={() => setEnding(false)} busy={busy} /> : null}
      {cancelling ? <Confirmation message="Retirar esta solicitação? Você poderá escolher outro profissional depois."
        kind="destructive" confirm={() => void cancelRequest()} cancel={() => setCancelling(false)} busy={busy} /> : null}
    </> : null}
    <Button tone="patient" variant="secondary" label="Sair da conta" onPress={() => void signOut()} />
  </PatientPage>;
}
