import { useState } from 'react';
import { psychologistApi } from '@/api/psychologist';
import { Button, CheckCard, formatDate, Screen, Text } from '@/design-system';
import { useSession } from '@/session/session-context';
import { usePsychologistAccess } from '@/psychologist/access';
import { Action, ErrorNotice } from '@/psychologist/ui';

export default function Consent() {
  const { term, refresh } = usePsychologistAccess();
  const { signOut } = useSession();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [declined, setDeclined] = useState(false);
  async function accept() {
    setBusy(true); setError(null);
    try { await psychologistApi.acceptConsent(term.id); refresh(); }
    catch (cause) { setError(cause); }
    finally { setBusy(false); }
  }
  // "Continuar" só depois do aceite marcado: o cartão é o aceite, o botão só confirma.
  const footer = declined ? undefined
    : <Button tone="neutral" icon="check" label={busy ? 'Aguarde...' : 'Continuar'} disabled={busy || !checked} onPress={() => { void accept(); }} />;
  return <Screen scroll tone="neutral" footer={footer}>
    <Text variant="h4">Antes de começar</Text>
    {declined ? <><Text>Para continuar é necessário aceitar o termo. Você pode sair da conta.</Text>
      <Action variant="secondary" icon="sign-out" label="Sair da conta" onPress={() => { void signOut(); }} /></> : <>
      <Text variant="h5">Tratamento dos seus dados de saúde</Text>
      <Text>{term.body}</Text>
      <Text variant="small" color="textSecondary">Versão {term.version}, vigente desde {formatDate(term.effective_from)}</Text>
      <CheckCard label="Li e aceito o termo" tag="obrigatório" checked={checked} disabled={busy} onChange={setChecked} />
      <ErrorNotice error={error} retry={checked ? () => { void accept(); } : undefined} />
      <Action variant="destructive" icon="x" label="Não aceito" disabled={busy} onPress={() => { setError(null); setDeclined(true); }} />
    </>}
  </Screen>;
}
