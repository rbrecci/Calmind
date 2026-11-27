import { useRouter } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useState } from 'react';
import { StyleSheet, Text as NativeText, View } from 'react-native';

import { imageHeaders } from '@/api';
import { patientApi } from '@/api/patient';
import type { PatientBond } from '@/api/patient/types';
import {
  Button, CoverCard, EmptyState, formatDateTime, Hero, Icon, Palette, ScrollingHeaderScreen, Shortcut, Skeleton, Spacing, Text,
} from '@/design-system';
import { FontFamily } from '@/design-system/typography';
import { SideHeader } from '@/navigation/side-header';
import { nextAppointment } from '@/patient/agenda';
import { selectBond } from '@/patient/bonds';
import { bondDuration } from '@/patient/bonds-duration';
import { loadPatientPages } from '@/patient/load-pages';
import { NoBond } from '@/patient/no-bond';
import { errorMessage, firstName } from '@/patient/presentation';
import { splitTasks } from '@/patient/tasks';
import { Confirmation, Feedback, PatientPage } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';
import { useSession } from '@/session/session-context';

// Tudo o que o início mostra chega junto, para a tela entrar completa de uma vez. Se a agenda ou as
// tarefas falharem, some só o resumo, não o início.
async function loadHome() {
  const bonds = await loadPatientPages(patientApi.bonds);
  const summary = selectBond(bonds)?.status === 'active'
    ? await Promise.all([loadPatientPages(patientApi.appointments), loadPatientPages(patientApi.tasks)])
      .then(([appointments, tasks]) => ({ next: nextAppointment(appointments), pending: splitTasks(tasks).pending.length }), () => null)
    : null;
  return { bonds, summary };
}

export default function PatientHome() {
  const router = useRouter();
  const { name } = useSession();
  const { data, loading, error, reload } = usePatientData(loadHome);
  const [cancelling, setCancelling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const bond = selectBond(data?.bonds ?? []);
  const active = bond?.status === 'active' && !error;
  const openProfile = (target: PatientBond) => router.push({ pathname: '/(patient)/psychologist/[id]', params: { id: String(target.psychologist.id) } });

  async function cancelRequest() {
    if (!bond) return;
    setBusy(true); setActionError(null);
    try { await patientApi.cancelBondRequest(bond.id); setCancelling(false); await reload(); }
    catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  }

  // Com vínculo ativo o início tem o destaque que rola e traz o próprio cabeçalho; nos outros
  // estados, o cabeçalho comum da aba.
  const header = <Tabs.Screen options={{ headerShown: !active }} />;

  if (!active) {
    return <>
      {header}
      <PatientPage onRefresh={reload}>
        <Feedback loading={loading && data === null} error={error} retry={() => void reload()} initial skeleton="home" />
        {data && !error && bond?.status === 'pending' ? <EmptyState illustration="aguardando" title="Aguardando resposta"
          description={`Seu pedido foi enviado a ${bond.psychologist.name}. Arraste para baixo para atualizar.`}>
          <Button tone="patient" variant="secondary" icon="user" label="Ver perfil do profissional" onPress={() => openProfile(bond)} />
          <Button tone="patient" variant="destructive" icon="x" label="Cancelar solicitação" onPress={() => setCancelling(true)} disabled={busy} />
          {actionError ? <Text accessibilityRole="alert" color="error">{actionError}</Text> : null}
          {cancelling ? <Confirmation message="Retirar esta solicitação? Você poderá escolher outro profissional depois."
            kind="destructive" confirm={() => void cancelRequest()} cancel={() => setCancelling(false)} busy={busy} /> : null}
        </EmptyState> : null}
        {data && !error && bond?.status !== 'pending' ? <NoBond title="Você ainda não tem um psicólogo"
          description="Conecte-se a um profissional para registrar relatos, receber tarefas e conversar." /> : null}
      </PatientPage>
    </>;
  }

  const next = data?.summary?.next ?? null;
  const pending = data?.summary?.pending ?? 0;
  const first = firstName(name);
  const duration = bondDuration(bond.bond_days);
  return <>
    {header}
    <ScrollingHeaderScreen onRefresh={reload}
      compactHeader={<SideHeader tone="patient" title="Início" icon="house" actions />}
      expandedHeader={<>
        <SideHeader tone="patient" title="Início" icon="house" actions flush />
        <Hero tone="patient" fullBleed>
          <Text variant="h4" style={styles.bold}>{first ? `Olá, ${first}!` : 'Olá!'}{'\n'}Como está seu dia?</Text>
          {duration ? <View>
            <View style={styles.heading}>
              <Text variant="h4" style={styles.bold}>Tempo de vínculo</Text>
              <Icon name="timer" size={24} />
            </View>
            <Text variant="h4" style={styles.bold}>{duration}</Text>
          </View> : null}
          <Button tone="patient" variant="hero" icon="pencil" label="Iniciar Relato" style={styles.heroButton}
            onPress={() => router.push('/new-report')} />
        </Hero></>}>
      <Text variant="h5">Seu <NativeText style={styles.bold}>Vínculo</NativeText></Text>
      <CoverCard tone="patient" name={bond.psychologist.name} tag={{ kind: 'positive', label: 'vínculo ativo' }}
        avatarUri={bond.psychologist.avatar_url} coverUri={bond.psychologist.cover_url} headers={imageHeaders()}
        // Sem próxima consulta, a linha some (R2).
        description={next ? `Próxima consulta: ${formatDateTime(next.scheduled_at)}` : undefined}
        onPress={() => openProfile(bond)} />
      <Text variant="h5" style={styles.shortcutsTitle}>Seus <NativeText style={styles.bold}>Atalhos</NativeText></Text>
      <View style={styles.shortcuts}>
        <Shortcut tone="patient" icon="calendar" label="Agenda" onPress={() => router.push('/(patient)/agenda')} />
        <View style={styles.divider} />
        <Shortcut tone="patient" icon="user" label="Perfil" onPress={() => router.navigate('/(patient)/profile')} />
        <View style={styles.divider} />
        <Shortcut tone="patient" icon="list-checks" label="Tarefas" badge={pending || undefined}
          accessibilityLabel={pending ? `Tarefas, ${pending} ${pending === 1 ? 'pendente' : 'pendentes'}` : 'Tarefas'}
          onPress={() => router.navigate('/(patient)/(tabs)/tasks')} />
      </View>
      {loading && !data ? <Skeleton variant="home" /> : null}
    </ScrollingHeaderScreen>
  </>;
}

const styles = StyleSheet.create({
  bold: { fontFamily: FontFamily.bold },
  shortcutsTitle: { marginTop: Spacing.two },
  heroButton: { alignSelf: 'flex-start', minWidth: 200, marginTop: Spacing.two },
  shortcuts: { flexDirection: 'row', alignItems: 'stretch' },
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  divider: { width: 1, marginVertical: Spacing.three, backgroundColor: Palette.secondary.shade },
});
