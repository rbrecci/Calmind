import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { psychologistApi } from '@/api/psychologist';
import { EmptyState, formatDate, ListItem, Loading, Screen, Text } from '@/design-system';
import { usePsychologistAccess } from '@/psychologist/access';
import { patientSummaryView } from '@/psychologist/domain';
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
  return <Screen scroll><Text variant="h3">Início</Text>
    {profile?.profile_published_at === null ? <Card><Text>Seu perfil ainda não foi publicado no catálogo.</Text>
      <ListItem tone="psychologist" title="Editar e publicar perfil" onPress={() => router.push('/(psychologist)/(tabs)/profile')} /></Card> : null}
    <ListItem tone="psychologist" title="Gerar convite" onPress={() => router.push('/(psychologist)/invitations')} />
    {state.loading && !state.data ? <Loading /> : null}
    <ErrorNotice error={state.error} retry={state.reload} />
    {state.data ? <>
      <ListItem tone="psychologist" title="Solicitações pendentes" badge={state.data.pending || undefined}
        onPress={() => router.push('/(psychologist)/requests')} />
      <Text variant="h4">Pacientes ativos</Text>
      {!state.data.active.length ? <EmptyState illustration="pacientes" title="Você ainda não tem pacientes" description="Gere um convite para começar." /> : null}
      {state.data.active.map((item) => {
        const view = patientSummaryView(item);
        return <ListItem key={item.bond_id} tone="psychologist" title={item.patient.name} description={view.description}
          detail={view.detail} badge={view.badge} accessibilityLabel={view.accessibilityLabel}
          onPress={() => router.push(`/(psychologist)/patients/${item.patient.id}`)} />;
      })}
      <Action variant="secondary" label={showEnded ? 'Recolher vínculos encerrados' : 'Mostrar vínculos encerrados'} onPress={() => setShowEnded(!showEnded)} />
      {showEnded ? <><Text>Vínculos encerrados, somente leitura.</Text>
        {!state.data.ended.length ? <Text>Nenhum vínculo encerrado.</Text> : null}
        {state.data.ended.map((item) => <ListItem key={item.bond_id} tone="psychologist" title={item.patient.name}
          description={item.ended_at ? `Encerrado em ${formatDate(item.ended_at)}` : undefined}
          onPress={() => router.push(`/(psychologist)/patients/${item.patient.id}`)} />)}</> : null}
    </> : null}
  </Screen>;
}
