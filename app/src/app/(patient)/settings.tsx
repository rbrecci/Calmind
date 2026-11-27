import { useRouter } from 'expo-router';
import { useState } from 'react';

import { patientApi } from '@/api/patient';
import { Button, ListItem, Text } from '@/design-system';
import { selectBond } from '@/patient/bonds';
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
  const { signOut } = useSession();
  const { data, loading, error, reload } = usePatientData(loadBonds);
  const [ending, setEnding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const bond = selectBond(data ?? []);
  async function endBond() {
    if (!bond) return;
    setBusy(true); setActionError(null);
    try { await patientApi.endBond(bond.id); setEnding(false); await reload(); }
    catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <PatientPage>
    <ListItem tone="patient" title="Meu perfil" onPress={() => router.navigate('/(patient)/profile')} />
    <Button tone="patient" variant="secondary" label="Sair da conta" onPress={() => void signOut()} />
    <Feedback loading={loading} error={error} retry={() => void reload()} initial={data === null} />
    {/* A destrutiva fica por último, e a confirmação aparece logo abaixo de quem a pediu. */}
    {bond?.status === 'active' && !error ? <Button tone="patient" variant="destructive" label="Encerrar vínculo" onPress={() => setEnding(true)} disabled={busy} /> : null}
    {actionError ? <Text accessibilityRole="alert" color="error">{actionError}</Text> : null}
    {ending ? <Confirmation message="Encerrar este vínculo? O histórico ficará disponível para leitura e novas trocas serão bloqueadas."
      kind="destructive" confirm={() => void endBond()} cancel={() => setEnding(false)} busy={busy} /> : null}
  </PatientPage>;
}
