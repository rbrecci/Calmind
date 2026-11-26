import { useState } from 'react';

import { Button, CheckCard, formatDate, Screen, Text } from '@/design-system';
import { useConsent } from '@/patient/consent-context';
import { errorMessage } from '@/patient/presentation';
import { useSession } from '@/session/session-context';

export default function PatientConsent() {
  const { term, accept } = useConsent();
  const { signOut } = useSession();
  const [checked, setChecked] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await accept(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  // "Continuar" só depois do aceite marcado: o cartão é o aceite, o botão só confirma.
  const footer = declined ? undefined
    : <Button tone="neutral" label={busy ? 'Registrando aceite...' : 'Continuar'} disabled={busy || !checked} onPress={() => void submit()} />;
  return <Screen scroll tone="neutral" footer={footer}>
    <Text variant="h4">Antes de começar</Text>
    {declined ? <>
      <Text>Sem o aceite, as funções clínicas ficam bloqueadas. Você pode sair da conta.</Text>
      <Button tone="patient" variant="secondary" label="Sair da conta" onPress={() => void signOut()} />
    </> : <>
      <Text>{term?.body}</Text>
      {term ? <Text variant="small" color="textSecondary">Versão {term.version}, vigente desde {formatDate(term.effective_from)}</Text> : null}
      <CheckCard label="Li e aceito o termo" tag="obrigatório" checked={checked} disabled={busy} onChange={setChecked} />
      {error ? <Text accessibilityRole="alert" color="error">{error}</Text> : null}
      <Button tone="patient" variant="destructive" label="Não aceito" disabled={busy} onPress={() => setDeclined(true)} />
    </>}
  </Screen>;
}
