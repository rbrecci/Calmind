import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { imageHeaders } from '@/api';
import { psychologistApi } from '@/api/psychologist';
import type { PatientSummary } from '@/api/psychologist/types';
import { Button, EmptyState, formatShortDate, Hero, Icon, ListItem, Loading, PersonCard, ScrollingHeaderScreen, Spacing, Text } from '@/design-system';
import { SideHeader } from '@/navigation/side-header';
import { useSession } from '@/session/session-context';
import { firstName } from '@/patient/presentation';
import { FontFamily } from '@/design-system/typography';
import { usePsychologistAccess } from '@/psychologist/access';
import { patientSummaryView } from '@/psychologist/domain';
import { collectPages } from '@/psychologist/resource';
import { Action, Card, ErrorNotice, useResource } from '@/psychologist/ui';

export default function PsychologistHome() {
  const router = useRouter();
  const { profile } = usePsychologistAccess();
  const { name } = useSession();
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
  return <ScrollingHeaderScreen tone="psychologist" loading={state.loading && !state.data} onRefresh={async () => { await reload(); }}
    compactHeader={<SideHeader tone="psychologist" title="Pacientes" icon="users" actions />}
    expandedHeader={<><SideHeader tone="psychologist" title="Pacientes" icon="users" actions flush />
      <Hero tone="psychologist" fullBleed>
        <Text variant="h4" style={styles.heroText}>{name ? `Olá, ${firstName(name)}!` : 'Olá!'}{'\n'}Como está seu dia?</Text>
        {state.data ? <View>
          <View style={styles.bondsHeading}><Text variant="h4" style={styles.heroText}>Seus Vínculos</Text><Icon name="chart-bar" size={32} /></View>
          <Text variant="h4" style={styles.heroText}>{state.data.active.length} {state.data.active.length === 1 ? 'Vínculo' : 'Vínculos'}</Text>
        </View> : null}
        <Button tone="psychologist" variant="hero" label="Gerar convite" style={styles.heroButton} onPress={() => router.push('/(psychologist)/invitations')} />
      </Hero></>}>
    {profile?.profile_published_at === null ? <Card><Text>Seu perfil ainda não foi publicado no catálogo.</Text>
      <ListItem tone="psychologist" title="Editar e publicar perfil" onPress={() => router.push('/(psychologist)/profile')} /></Card> : null}
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
  </ScrollingHeaderScreen>;
}

const styles = StyleSheet.create({
  heroText: { fontFamily: FontFamily.bold },
  bondsHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  heroButton: { alignSelf: 'flex-start', minWidth: 200, marginTop: Spacing.two },
});
