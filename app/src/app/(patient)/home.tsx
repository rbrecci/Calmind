import { useRouter } from 'expo-router';
import { useState } from 'react';

import { patientApi } from '@/api/patient';
import { Button, Text } from '@/design-system';
import { selectBond } from '@/patient/bonds';
import { loadPatientPages } from '@/patient/load-pages';
import { errorMessage } from '@/patient/presentation';
import { Card, Confirmation, Feedback, PatientPage, TextAction } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';
import { useSession } from '@/session/session-context';

async function loadHome() {
  const [bonds, unread] = await Promise.all([loadPatientPages(patientApi.bonds), patientApi.notifications({ unread: true, per_page: 1 })]);
  return { bonds, unread: unread.meta.total };
}

export default function PatientHome() {
  const router = useRouter();
  const { signOut } = useSession();
  const { data, loading, error, reload } = usePatientData(loadHome);
  const [ending, setEnding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const bond = selectBond(data?.bonds ?? []);
  async function endBond() {
    if (!bond) return;
    setBusy(true); setActionError(null);
    try { await patientApi.endBond(bond.id); setEnding(false); await reload(); }
    catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <PatientPage title="Seu espaço de cuidado" home>
    <Feedback loading={loading} error={error} retry={() => void reload()} />
    {data && !error ? <>
      <TextAction label={`Notificações (${data.unread} não lidas)`} onPress={() => router.push('/notifications')} />
      {bond ? <Card>
        <Text variant="h5">{bond.psychologist.name}</Text>
        <Text color="textSecondary">CRP {bond.psychologist.crp}</Text>
        <Text>{bond.status === 'active' ? 'Seu acompanhamento está ativo.' : bond.status === 'pending'
          ? 'Aguardando resposta do profissional' : 'Vínculo encerrado. O histórico está disponível somente para leitura.'}</Text>
        {bond.status === 'active' ? <TextAction label="Encerrar vínculo" onPress={() => setEnding(true)} disabled={busy} /> : null}
      </Card> : null}
      {actionError ? <Text accessibilityRole="alert" color="error">{actionError}</Text> : null}
      {ending ? <Confirmation message="Encerrar este vínculo? O histórico ficará disponível para leitura e novas trocas serão bloqueadas."
        confirm={() => void endBond()} cancel={() => setEnding(false)} busy={busy} /> : null}
      {!bond || bond.status === 'ended' ? <>
        <Text variant="h5">Como você chegou aqui?</Text>
        <Button tone="patient" label="Tenho um código de convite" onPress={() => router.push('/invitation')} />
        <TextAction label="Quero encontrar um profissional" onPress={() => router.push('/catalog')} />
      </> : null}
      {bond?.status === 'active' ? <Button tone="patient" label="Novo relato" onPress={() => router.push('/new-report')} /> : null}
      <Text variant="h5">Seu acompanhamento</Text>
      <TextAction label="Meus relatos" onPress={() => router.push('/reports')} />
      <TextAction label="Minhas tarefas" onPress={() => router.push('/tasks')} />
      {data.bonds.filter((b) => b.status !== 'pending').map((b) => <TextAction key={b.id}
        label={b.status === 'active' ? `Conversa (${b.unread_messages} não lidas)` : `Conversa anterior com ${b.psychologist.name}, ${new Date(b.requested_at).toLocaleString('pt-BR')}`}
        onPress={() => router.push({ pathname: '/chat', params: { bondId: b.id } })} />)}
      <TextAction label="Minha agenda" onPress={() => router.push('/agenda')} />
      <TextAction label="Atualizar início" onPress={() => void reload()} disabled={loading || busy} />
    </> : null}
    <TextAction label="Sair da conta" onPress={() => void signOut()} />
  </PatientPage>;
}
