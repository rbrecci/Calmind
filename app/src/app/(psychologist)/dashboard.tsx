import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { psychologistApi } from '@/api/psychologist';
import { Screen, Text } from '@/design-system';
import { useSession } from '@/session/session-context';
import { usePsychologistAccess } from '@/psychologist/access';
import { collectPages } from '@/psychologist/resource';
import { Action, Card, displayDate, ErrorNotice, useResource } from '@/psychologist/ui';

export default function PsychologistHome() {
  const router = useRouter();
  const { signOut } = useSession();
  const { profile } = usePsychologistAccess();
  const [showEnded, setShowEnded] = useState(false);
  const state = useResource(async () => {
    const [active, ended, requests, notifications] = await Promise.all([
      collectPages((page) => psychologistApi.patients({ status: 'active', page, per_page: 50 })),
      collectPages((page) => psychologistApi.patients({ status: 'ended', page, per_page: 50 })),
      psychologistApi.bondRequests({ per_page: 1 }), psychologistApi.notifications({ unread: 1, per_page: 1 }),
    ]);
    return { active, ended, pending: requests.meta.total, unread: notifications.meta.total };
  });
  const reload = state.reload;
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  return <Screen scroll><Text variant="h3">Início do psicólogo</Text>
    {profile?.profile_published_at === null ? <Card><Text>Seu perfil ainda não foi publicado no catálogo.</Text>
      <Action label="Editar e publicar perfil" onPress={() => router.push('/(psychologist)/profile')} /></Card> : null}
    <Action label="Meu perfil" onPress={() => router.push('/(psychologist)/profile')} />
    <Action label="Gerar convite" onPress={() => router.push('/(psychologist)/invitations')} />
    <Action label="Agenda" onPress={() => router.push('/(psychologist)/agenda')} />
    {state.loading ? <Text>Carregando pacientes...</Text> : null}
    <ErrorNotice error={state.error} retry={state.reload} />
    {state.data ? <>
      <Action label={`Solicitações pendentes: ${state.data.pending}`} onPress={() => router.push('/(psychologist)/requests')} />
      <Action label={`Notificações não lidas: ${state.data.unread}`} onPress={() => router.push('/(psychologist)/notifications')} />
      <Text variant="h4">Pacientes ativos</Text>
      {!state.data.active.length ? <Text>Você ainda não tem pacientes. Gere um convite para começar.</Text> : null}
      {state.data.active.map((item) => <Card key={item.bond_id}>
        <Text variant="h5">{item.patient.name}</Text>
        <Text>Mensagens não lidas: {item.unread_messages}</Text><Text>Tarefas vencidas: {item.overdue_tasks}</Text>
        <Text>Próxima consulta: {displayDate(item.next_appointment_at)}</Text>
        <Action label={`Abrir prontuário de ${item.patient.name}`} onPress={() => router.push(`/(psychologist)/patients/${item.patient.id}`)} />
      </Card>)}
      <Action label={showEnded ? 'Recolher vínculos encerrados' : 'Mostrar vínculos encerrados'} onPress={() => setShowEnded(!showEnded)} />
      {showEnded ? <><Text>Vínculos encerrados, somente leitura.</Text>
        {!state.data.ended.length ? <Text>Nenhum vínculo encerrado.</Text> : null}
        {state.data.ended.map((item) => <Card key={item.bond_id}><Text>{item.patient.name}</Text>
          <Text>Encerrado em {displayDate(item.ended_at)}</Text>
          <Action label={`Consultar histórico de ${item.patient.name}`} onPress={() => router.push(`/(psychologist)/patients/${item.patient.id}`)} />
        </Card>)}</> : null}
    </> : null}
    <Action label="Sair da conta" onPress={() => { void signOut(); }} />
  </Screen>;
}
