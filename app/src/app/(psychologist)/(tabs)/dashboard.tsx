import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';
import { imageHeaders } from '@/api';
import { psychologistApi } from '@/api/psychologist';
import type { PatientSummary } from '@/api/psychologist/types';
import { Button, EmptyState, formatShortDate, Hero, Icon, ListItem, PersonCard, ScrollingHeaderScreen, Skeleton, Spacing, Text } from '@/design-system';
import { SideHeader } from '@/navigation/side-header';
import { useSession } from '@/session/session-context';
import { firstName } from '@/patient/presentation';
import { FontFamily } from '@/design-system/typography';
import { patientSummaryView } from '@/psychologist/domain';
import { collectPages } from '@/psychologist/resource';
import { Action, ErrorNotice, Page, useResource } from '@/psychologist/ui';

export default function PsychologistHome() {
  const router = useRouter();
  const { name } = useSession();
  const [showEnded, setShowEnded] = useState(false);
  // Tudo chega junto: o destaque, o aviso de perfil e a lista entram de uma vez.
  const state = useResource(async () => {
    const [profile, active, ended, requests] = await Promise.all([
      psychologistApi.profile(),
      collectPages((page) => psychologistApi.patients({ status: 'active', page, per_page: 50 })),
      collectPages((page) => psychologistApi.patients({ status: 'ended', page, per_page: 50 })),
      psychologistApi.bondRequests({ per_page: 1 }),
    ]);
    return { profile, active, ended, pending: requests.meta.total };
  });
  const reload = state.reload;
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  const headers = imageHeaders();
  const openRecord = (item: PatientSummary) => router.push(`/(psychologist)/patients/${item.patient.id}`);
  const invite = () => router.push('/(psychologist)/invitations');
  const data = state.data;
  const empty = data !== null && !data.active.length && !data.ended.length && !data.pending;
  // Sem dados (carregando, erro ou nenhum paciente), a tela usa o cabeçalho comum da aba.
  const plain = !data || empty;
  const header = <Tabs.Screen options={{ headerShown: plain }} />;
  const unpublished = data?.profile.profile_published_at === null
    ? <ListItem tone="psychologist" icon="globe" title="Publicar perfil no catálogo" description="Seu perfil ainda não aparece para os pacientes"
      onPress={() => router.push('/(psychologist)/profile')} /> : null;

  if (plain) {
    return <>
      {header}
      <Page onRefresh={async () => { await reload(); }}>
        {state.loading && !data ? <Skeleton variant="home" /> : null}
        <ErrorNotice error={state.error} retry={state.reload} />
        {empty ? <EmptyState illustration="pacientes" title="Você ainda não tem pacientes" description="Gere um convite para começar.">
          <Button tone="psychologist" icon="key" label="Gerar convite" onPress={invite} />
          {unpublished}
        </EmptyState> : null}
      </Page>
    </>;
  }

  const total = data.profile.active_bonds ?? data.active.length;
  return <>
    {header}
    <ScrollingHeaderScreen tone="psychologist" onRefresh={async () => { await reload(); }}
      compactHeader={<SideHeader tone="psychologist" title="Pacientes" icon="users" actions />}
      expandedHeader={<><SideHeader tone="psychologist" title="Pacientes" icon="users" actions flush />
        <Hero tone="psychologist" fullBleed>
          <Text variant="h4" style={styles.bold}>{name ? `Olá, ${firstName(name)}!` : 'Olá!'}{'\n'}Como está seu dia?</Text>
          <View>
            <View style={styles.heading}><Text variant="h4" style={styles.bold}>Seus Vínculos</Text><Icon name="chart-bar" size={32} /></View>
            <Text variant="h4" style={styles.bold}>{total} {total === 1 ? 'Vínculo' : 'Vínculos'}</Text>
          </View>
          <Button tone="psychologist" variant="hero" icon="key" label="Gerar convite" style={styles.heroButton} onPress={invite} />
        </Hero></>}>
      {unpublished}
      {/* Só com pedido esperando resposta (R2). */}
      {data.pending ? <ListItem tone="psychologist" icon="user-plus" title="Solicitações pendentes" badge={data.pending}
        onPress={() => router.push('/(psychologist)/requests')} /> : null}
      {data.active.map((item) => {
        const view = patientSummaryView(item);
        return <PersonCard key={item.bond_id} tone="psychologist" name={item.patient.name} avatarUri={item.patient.avatar_url} headers={headers}
          tag={view.tag} description={view.summary} accessibilityLabel={view.accessibilityLabel} onPress={() => openRecord(item)} />;
      })}
      {data.ended.length ? <Action variant="secondary" icon="archive" label={showEnded ? 'Recolher vínculos encerrados' : 'Mostrar vínculos encerrados'}
        onPress={() => setShowEnded(!showEnded)} /> : null}
      {showEnded ? data.ended.map((item) => <PersonCard key={item.bond_id} tone="psychologist" name={item.patient.name}
        avatarUri={item.patient.avatar_url} headers={headers}
        tag={{ kind: 'neutral', label: 'encerrado' }} description={item.ended_at ? `em ${formatShortDate(item.ended_at)}` : undefined}
        onPress={() => openRecord(item)} />) : null}
    </ScrollingHeaderScreen>
  </>;
}

const styles = StyleSheet.create({
  bold: { fontFamily: FontFamily.bold },
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  heroButton: { alignSelf: 'flex-start', minWidth: 200, marginTop: Spacing.two },
});
