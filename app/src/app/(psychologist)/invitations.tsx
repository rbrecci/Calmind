import { useRef, useState } from 'react';
import { psychologistApi } from '@/api/psychologist';
import type { Invitation } from '@/api/psychologist/types';
import { Text } from '@/design-system';
import { Action, Card, displayDate, ErrorNotice, Page, useConfirmation } from '@/psychologist/ui';

export default function Invitations() {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const submitting = useRef(false);
  const { ask, confirmation } = useConfirmation();
  async function create() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true); setError(null);
    try { setInvitation(await psychologistApi.createInvitation()); }
    catch (cause) { setError(cause); } finally { submitting.current = false; setBusy(false); }
  }
  async function revoke() {
    if (!invitation || submitting.current) return;
    submitting.current = true;
    setBusy(true); setError(null);
    try { await psychologistApi.revokeInvitation(invitation.id); setInvitation(null); }
    catch (cause) { setError(cause); } finally { submitting.current = false; setBusy(false); }
  }
  return <Page title="Convite para paciente"><Text>Compartilhe o código com a pessoa que deseja acompanhar.</Text>
    <ErrorNotice error={error} />
    {invitation ? <Card><Text selectable variant="h2" accessibilityLabel={`Código do convite ${invitation.code}`}>{invitation.code}</Text>
      <Text>Válido até {displayDate(invitation.expires_at)}</Text>
      <Action label="Revogar convite" disabled={busy} onPress={() => ask('Revogar convite?', 'Este código deixará de permitir um novo vínculo.', () => { void revoke(); })} />
    </Card> : <Action label="Gerar convite" loading={busy} onPress={() => { void create(); }} />}
    {confirmation}
  </Page>;
}
