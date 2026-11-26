import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { imageHeaders } from '@/api';
import { psychologistApi } from '@/api/psychologist';
import type { PatientSummary } from '@/api/psychologist/types';
import { Button, EmptyState, formatShortDate, ListItem, Loading, PersonCard, Screen, Text } from '@/design-system';
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
  const headers = imageHeaders();
  const openRecord = (item: PatientSummary) => router.push(`/(psychologist)/patients/${item.patient.id}`);
  // Gerar convite é a ação principal da aba e fica fixo embaixo, acima da barra de abas.
  return <Screen scroll footer={<Button tone="psychologist" label="Gerar convite para novo paciente"
    onPress={() => router.push('/(psychologist)/invitations')} />}>
    {profile?.profile_published_at === null ? <Card><Text>Seu perfil ainda não foi publicado no catálogo.</Text>
      <ListItem tone="psychologist" title="Editar e publicar perfil" onPress={() => router.push('/(psychologist)/(tabs)/profile')} /></Card> : null}
    {state.loading && !state.data ? <Loading /> : null}
    <ErrorNotice error={state.error} retry={state.reload} />
    {state.data ? <>
      {/* Só com pedido esperando resposta (R2). */}
      {state.data.pending ? <ListItem tone="psychologist" title="Solicitações pendentes" badge={state.data.pending}
        onPress={() => router.push('/(psychologist)/requests')} /> : null}
      {!state.data.active.length ? <EmptyState illustration="pacientes" title="Você ainda não tem pacientes" description="Gere um convite para começar." /> : null}
      {state.data.active.map((item) => {
        const view = patientSummaryView(item);
        return <PersonCard key={item.bond_id} tone="psychologist" name={item.patient.name} avatarUri={item.patient.avatar_url} headers={headers}
          tag={view.tag} description={view.summary} accessibilityLabel={view.accessibilityLabel} onPress={() => openRecord(item)} />;
      })}
      {state.data.ended.length ? <Action variant="secondary" label={showEnded ? 'Recolher vínculos encerrados' : 'Mostrar vínculos encerrados'}
        onPress={() => setShowEnded(!showEnded)} /> : null}
      {showEnded ? state.data.ended.map((item) => <PersonCard key={item.bond_id} tone="psychologist" name={item.patient.name}
        avatarUri={item.patient.avatar_url} headers={headers}
        tag={{ kind: 'neutral', label: 'encerrado' }} description={item.ended_at ? `em ${formatShortDate(item.ended_at)}` : undefined}
        onPress={() => openRecord(item)} />) : null}
    </> : null}
  </Screen>;
}
