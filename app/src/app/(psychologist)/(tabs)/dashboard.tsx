import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { psychologistApi } from '@/api/psychologist';
import { formatDate, formatDateTime, ListItem, Screen, Text } from '@/design-system';
import { usePsychologistAccess } from '@/psychologist/access';
import { collectPages } from '@/psychologist/resource';
import { Action, Card, ErrorNotice, useResource } from '@/psychologist/ui';

export default function PsychologistHome() {
  const router = useRouter();
  const { profile } = usePsychologistAccess();
  const [showEnded, setShowEnded] = useState(false);
  const state = useResource(async () => {
    const [active, ended, requests] = await Promise.all([
      collectPages((page) => psychologistApi.patients({ status: 'active', page, per_page: 50 })),
      collectPages((page) => psychologistApi.patients({ status: 'ended', page, per_page: 50 })),
      psychologistApi.bondRequests({ per_page: 1 }),
    ]);
    return { active, ended, pending: requests.meta.total };
  });
  const reload = state.reload;
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  return <Screen scroll><Text variant="h3">Início do psicólogo</Text>
    {profile?.profile_published_at === null ? <Card><Text>Seu perfil ainda não foi publicado no catálogo.</Text>
      <ListItem tone="psychologist" title="Editar e publicar perfil" onPress={() => router.push('/(psychologist)/(tabs)/profile')} /></Card> : null}
    <ListItem tone="psychologist" title="Gerar convite" onPress={() => router.push('/(psychologist)/invitations')} />
    {state.loading ? <Text>Carregando pacientes...</Text> : null}
    <ErrorNotice error={state.error} retry={state.reload} />
    {state.data ? <>
      <ListItem tone="psychologist" title="Solicitações pendentes" badge={state.data.pending || undefined}
        onPress={() => router.push('/(psychologist)/requests')} />
      <Text variant="h4">Pacientes ativos</Text>
      {!state.data.active.length ? <Text>Você ainda não tem pacientes. Gere um convite para começar.</Text> : null}
      {state.data.active.map((item) => <Card key={item.bond_id}>
        <Text variant="h5">{item.patient.name}</Text>
        <Text>Mensagens não lidas: {item.unread_messages}</Text><Text>Tarefas vencidas: {item.overdue_tasks}</Text>
        <Text>Próxima consulta: {item.next_appointment_at ? formatDateTime(item.next_appointment_at) : 'Nenhuma agendada'}</Text>
        <ListItem tone="psychologist" title="Abrir prontuário" accessibilityLabel={`Abrir prontuário de ${item.patient.name}`}
          onPress={() => router.push(`/(psychologist)/patients/${item.patient.id}`)} />
      </Card>)}
      <Action variant="secondary" label={showEnded ? 'Recolher vínculos encerrados' : 'Mostrar vínculos encerrados'} onPress={() => setShowEnded(!showEnded)} />
      {showEnded ? <><Text>Vínculos encerrados, somente leitura.</Text>
        {!state.data.ended.length ? <Text>Nenhum vínculo encerrado.</Text> : null}
        {state.data.ended.map((item) => <Card key={item.bond_id}><Text>{item.patient.name}</Text>
          {item.ended_at ? <Text>Encerrado em {formatDate(item.ended_at)}</Text> : null}
          <ListItem tone="psychologist" title="Consultar histórico" accessibilityLabel={`Consultar histórico de ${item.patient.name}`}
            onPress={() => router.push(`/(psychologist)/patients/${item.patient.id}`)} />
        </Card>)}</> : null}
    </> : null}
  </Screen>;
}
