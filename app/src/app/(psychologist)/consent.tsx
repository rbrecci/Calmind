import { useState } from 'react';
import { psychologistApi } from '@/api/psychologist';
import { Screen, Text } from '@/design-system';
import { useSession } from '@/session/session-context';
import { usePsychologistAccess } from '@/psychologist/access';
import { Action, ErrorNotice } from '@/psychologist/ui';

export default function Consent() {
  const { term, refresh } = usePsychologistAccess();
  const { signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [declined, setDeclined] = useState(false);
  async function accept() {
    setBusy(true); setError(null);
    try { await psychologistApi.acceptConsent(term.id); refresh(); }
    catch (cause) { setError(cause); }
    finally { setBusy(false); }
  }
  return <Screen scroll><Text variant="h3">Termo de uso</Text><Text>Versão {term.version}</Text>
    <Text>{term.body}</Text><ErrorNotice error={error} retry={declined ? undefined : () => { void accept(); }} />
    {declined ? <><Text>Para continuar é necessário aceitar o termo. Você pode sair da conta.</Text>
      <Action label="Sair da conta" onPress={() => { void signOut(); }} /></> : <>
      <Action label="Li e aceito" loading={busy} onPress={() => { void accept(); }} />
      <Action label="Não aceito" disabled={busy} onPress={() => { setError(null); setDeclined(true); }} />
    </>}
  </Screen>;
}
