import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text as NativeText, View } from 'react-native';

import { imageHeaders } from '@/api';
import { patientApi } from '@/api/patient';
import type { PatientBond } from '@/api/patient/types';
import {
  Button, ChoiceCard, CoverCard, formatDateTime, Hero, Icon, Illustration, Palette, ScrollingHeaderScreen, Shortcut, Spacing, statusTagKind, Text, type IconName, type StatusTagKind,
} from '@/design-system';
import { nextAppointment } from '@/patient/agenda';
import { bondStatusText, selectBond } from '@/patient/bonds';
import { loadPatientPages } from '@/patient/load-pages';
import { errorMessage, firstName } from '@/patient/presentation';
import { splitTasks } from '@/patient/tasks';
import { Confirmation, Feedback } from '@/patient/ui';
import { SideHeader } from '@/navigation/side-header';
import { usePatientData } from '@/patient/use-patient-data';
import { useSession } from '@/session/session-context';
import { FontFamily } from '@/design-system/typography';

const AGENDA: IconName = 'calendar';
const PROFILE: IconName = 'user';
const TASKS: IconName = 'list-checks';

// As notificações saíram daqui: o contador delas está no sino do cabeçalho.
async function loadHome() {
  return { bonds: await loadPatientPages(patientApi.bonds) };
}

// Fica fora de loadHome: se a agenda ou as tarefas falharem, some só o resumo, não o início.
async function loadSummary() {
  const [appointments, tasks] = await Promise.all([loadPatientPages(patientApi.appointments), loadPatientPages(patientApi.tasks)]);
  return { next: nextAppointment(appointments), pending: splitTasks(tasks).pending.length };
}

// A etiqueta diz o estado do vínculo pela forma (R6). Encerrado leva a frase, que diferencia
// recusa, cancelamento e encerramento.
function bondTag(bond: PatientBond): { kind: StatusTagKind; label: string } {
  if (bond.status === 'active') return { kind: statusTagKind('active'), label: 'vínculo ativo' };
  if (bond.status === 'pending') return { kind: statusTagKind('pending'), label: 'aguardando resposta' };
  return { kind: statusTagKind('ended'), label: 'encerrado' };
}

export default function PatientHome() {
  const router = useRouter();
  const { name } = useSession();
  const { data, loading, error, reload } = usePatientData(loadHome);
  const summary = usePatientData(loadSummary);
  const [cancelling, setCancelling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const bond = selectBond(data?.bonds ?? []);
  async function cancelRequest() {
    if (!bond) return;
    setBusy(true); setActionError(null);
    try { await patientApi.cancelBondRequest(bond.id); setCancelling(false); await reload(); }
    catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  }
  const next = summary.data && !summary.error ? summary.data.next : null;
  const pending = summary.data && !summary.error ? summary.data.pending : 0;
  const refresh = async () => { await Promise.all([reload(), summary.reload()]); };
  const first = firstName(name);
  const openProfile = (target: PatientBond) => router.push({ pathname: '/(patient)/psychologist/[id]', params: { id: String(target.psychologist.id) } });
  return <ScrollingHeaderScreen onRefresh={refresh}
    compactHeader={<SideHeader tone="patient" title="Início" icon={'house'} actions />}
    expandedHeader={<>
    <SideHeader tone="patient" title="Início" icon={'house'} actions flush />
    <Hero tone="patient" fullBleed>
      <Text variant="h4" style={styles.heroText}>{first ? `Olá, ${first}!` : 'Olá!'}{'\n'}Como está seu dia?</Text>
      {process.env.EXPO_PUBLIC_USE_MOCK === 'true' ? <View>
        <View style={styles.streakHeading}><Text variant="h4" style={styles.heroText}>Sua Sequência</Text><Icon name={'flame'} size={20} /></View>
        <Text variant="h4" style={styles.heroText}>70 Dias</Text>
      </View> : null}
      {bond?.status === 'active' ? <Button tone="patient" variant="hero" label="Iniciar Relato" style={styles.heroButton}
        onPress={() => router.push('/new-report')} /> : null}
    </Hero></>}>
    <Feedback loading={loading} error={error} retry={() => void reload()} initial={data === null} />
    {data && !error ? <>
      {bond?.status === 'pending' ? <Illustration name="aguardando" /> : null}
      {bond ? <>
        <Text variant="h5">Seu <NativeText style={styles.boldWord}>Vínculo</NativeText></Text>
        <CoverCard tone="patient" name={bond.psychologist.name} tag={bondTag(bond)}
          avatarUri={bond.psychologist.avatar_url} coverUri={bond.psychologist.cover_url} headers={imageHeaders()}
          // Sem próxima consulta, a linha some (R2).
          description={bond.status === 'active' ? next ? `Próxima consulta: ${formatDateTime(next.scheduled_at)}` : undefined
            : bond.status === 'ended' ? bondStatusText(bond) : undefined}
          onPress={() => openProfile(bond)} />
      </> : null}
      {bond?.status === 'active' ? <>
        <Text variant="h5" style={styles.shortcutsTitle}>Seus <NativeText style={styles.boldWord}>Atalhos</NativeText></Text>
        <View style={styles.shortcuts}>
          <Shortcut tone="patient" icon={AGENDA} label="Agenda" onPress={() => router.push('/(patient)/agenda')} />
          <View style={styles.shortcutDivider} />
          <Shortcut tone="patient" icon={PROFILE} label="Perfil" onPress={() => router.push('/(patient)/profile')} />
          <View style={styles.shortcutDivider} />
          <Shortcut tone="patient" icon={TASKS} label="Tarefas" badge={pending || undefined}
            accessibilityLabel={pending ? `Tarefas, ${pending} ${pending === 1 ? 'pendente' : 'pendentes'}` : 'Tarefas'}
            onPress={() => router.navigate('/(patient)/(tabs)/tasks')} />
        </View>
      </> : null}
      {!bond || bond.status === 'ended' ? <>
        <Illustration name="boas-vindas" />
        <Text variant="h5" style={styles.center}>Você já faz acompanhamento?</Text>
        <ChoiceCard tone="patient" title="Tenho psicólogo" description="Use o código que você recebeu na sessão"
          onPress={() => router.push('/invitation')} />
        <ChoiceCard tone="patient" title="Quero encontrar um profissional" description="Busque no catálogo e solicite o vínculo"
          onPress={() => router.push('/catalog')} />
      </> : null}
    </> : null}
    {/* Encerrar o vínculo e sair da conta moram na tela de conta, pela engrenagem. Retirar a
        solicitação fica aqui, no fim: é o que o início mostra enquanto o vínculo está pendente. */}
    {data && !error ? <>
      {bond?.status === 'pending' ? <Button tone="patient" variant="destructive" label="Cancelar solicitação" onPress={() => setCancelling(true)} disabled={busy} /> : null}
      {actionError ? <Text accessibilityRole="alert" color="error">{actionError}</Text> : null}
      {cancelling ? <Confirmation message="Retirar esta solicitação? Você poderá escolher outro profissional depois."
        kind="destructive" confirm={() => void cancelRequest()} cancel={() => setCancelling(false)} busy={busy} /> : null}
    </> : null}
  </ScrollingHeaderScreen>;
}

const styles = StyleSheet.create({
  heroText: { fontFamily: FontFamily.bold },
  boldWord: { fontFamily: FontFamily.bold },
  shortcutsTitle: { marginTop: Spacing.two },
  heroButton: { alignSelf: 'flex-start', minWidth: 200, marginTop: Spacing.two },
  shortcuts: { flexDirection: 'row', alignItems: 'stretch' },
  streakHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  shortcutDivider: { width: 1, marginVertical: Spacing.three, backgroundColor: Palette.secondary.shade },
  center: { textAlign: 'center' },
});
