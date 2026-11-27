import { useRouter } from 'expo-router';
import { useState } from 'react';

import { imageHeaders } from '@/api';
import { patientApi } from '@/api/patient';
import { Button, CoverCard, ListItem, Section, Text } from '@/design-system';
import { AccountInfo } from '@/navigation/account-info';
import { selectBond } from '@/patient/bonds';
import { bondDuration } from '@/patient/bonds-duration';
import { useConsent } from '@/patient/consent-context';
import { loadPatientPages } from '@/patient/load-pages';
import { errorMessage } from '@/patient/presentation';
import { Confirmation, Feedback, PatientPage } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';
import { useSession } from '@/session/session-context';

const loadBonds = () => loadPatientPages(patientApi.bonds);

// Conta: aberta pela engrenagem do cabeçalho. As ações que mexem na conta e no vínculo moram
// aqui, e não no início, que é o que a pessoa vê toda vez que abre o app.
export default function PatientSettings() {
  const router = useRouter();
  const { name, signOut } = useSession();
  const { term } = useConsent();
  const { data, loading, error, reload } = usePatientData(loadBonds);
  const [ending, setEnding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const bond = selectBond(data ?? []);
  const active = bond?.status === 'active' ? bond : null;
  const duration = bondDuration(active?.bond_days);
  async function endBond() {
    if (!bond) return;
    setBusy(true); setActionError(null);
    try { await patientApi.endBond(bond.id); setEnding(false); await reload(); }
    catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <PatientPage>
    <Feedback loading={loading && data === null} error={error} retry={() => void reload()} initial />
    {data || error ? <>
      <Section title="Minha conta">
        <ListItem tone="patient" icon="user" title="Meu perfil" description={name ?? undefined} onPress={() => router.navigate('/(patient)/profile')} />
        <ListItem tone="patient" icon="bell" title="Notificações" onPress={() => router.push('/(patient)/notifications')} />
      </Section>
      <Section title="Acompanhamento">
        {active ? <>
          <CoverCard tone="patient" name={active.psychologist.name} avatarUri={active.psychologist.avatar_url}
            coverUri={active.psychologist.cover_url} headers={imageHeaders()} description={duration ? `Vínculo: ${duration}` : undefined}
            onPress={() => router.push({ pathname: '/(patient)/psychologist/[id]', params: { id: String(active.psychologist.id) } })} />
          <ListItem tone="patient" icon="calendar" title="Agenda" onPress={() => router.push('/(patient)/agenda')} />
        </> : <>
          <ListItem tone="patient" icon="search" title="Encontrar um profissional" onPress={() => router.push('/catalog')} />
          <ListItem tone="patient" icon="key" title="Tenho um código" onPress={() => router.push('/invitation')} />
        </>}
      </Section>
      <AccountInfo tone="patient" term={term?.body} />
      <Button tone="patient" variant="secondary" icon="sign-out" label="Sair da conta" onPress={() => void signOut()} />
      {/* A destrutiva fica por último, e a confirmação aparece logo abaixo de quem a pediu. */}
      {active && !error ? <Button tone="patient" variant="destructive" icon="link-break" label="Encerrar vínculo" onPress={() => setEnding(true)} disabled={busy} /> : null}
      {actionError ? <Text accessibilityRole="alert" color="error">{actionError}</Text> : null}
      {ending ? <Confirmation message="Encerrar este vínculo? O histórico ficará disponível para leitura e novas trocas serão bloqueadas."
        kind="destructive" confirm={() => void endBond()} cancel={() => setEnding(false)} busy={busy} /> : null}
    </> : null}
  </PatientPage>;
}
