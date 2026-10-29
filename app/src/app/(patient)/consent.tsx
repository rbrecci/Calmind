import { useState } from 'react';

import { Button, Screen, Text } from '@/design-system';
import { useConsent } from '@/patient/consent-context';
import { errorMessage } from '@/patient/presentation';
import { useSession } from '@/session/session-context';

export default function PatientConsent() {
  const { term, accept } = useConsent();
  const { signOut } = useSession();
  const [declined, setDeclined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await accept(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <Screen scroll>
    <Text variant="small" color="textSecondary">Calmind · Consentimento</Text>
    <Text variant="h4">Antes de começar</Text>
    {declined ? <>
      <Text>Sem o aceite, as funções clínicas ficam bloqueadas. Você pode sair da conta.</Text>
      <Button tone="patient" label="Sair da conta" onPress={() => void signOut()} />
    </> : <>
      <Text variant="h5">Termo de uso, versão {term?.version}</Text>
      <Text>{term?.body}</Text>
      {error ? <Text accessibilityRole="alert" color="error">{error}</Text> : null}
      <Button tone="patient" label={busy ? 'Registrando aceite...' : 'Li e aceito'} disabled={busy} onPress={() => void submit()} />
      <Button tone="patient" label="Não aceito" disabled={busy} onPress={() => setDeclined(true)} />
    </>}
  </Screen>;
}
