import { useState } from 'react';
import { psychologistApi } from '@/api/psychologist';
import { Text } from '@/design-system';
import { collectPages } from '@/psychologist/resource';
import { Action, Card, displayDate, ErrorNotice, Page, useConfirmation, useResource } from '@/psychologist/ui';

export default function Requests() {
  const list = useResource(() => collectPages((page) => psychologistApi.bondRequests({ page, per_page: 50 })));
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const { ask, confirmation } = useConfirmation();
  async function respond(id: number, accept: boolean) {
    setBusy(true); setError(null);
    try {
      if (accept) await psychologistApi.acceptBondRequest(id); else await psychologistApi.rejectBondRequest(id);
      await list.reload();
    } catch (cause) { setError(cause); } finally { setBusy(false); }
  }
  return <Page title="Solicitações de vínculo">
    {list.loading ? <Text>Carregando solicitações...</Text> : null}
    <ErrorNotice error={list.error} retry={list.reload} /><ErrorNotice error={error} />
    {list.data?.length === 0 ? <Text>Nenhuma solicitação pendente.</Text> : null}
    {list.data?.map((item) => <Card key={item.id}><Text variant="h5">{item.patient.name}</Text>
      <Text>Solicitado em {displayDate(item.requested_at)}</Text>
      <Action label={`Aceitar ${item.patient.name}`} disabled={busy} onPress={() => ask('Aceitar solicitação?', `Iniciar vínculo com ${item.patient.name}?`, () => { void respond(item.id, true); })} />
      <Action label={`Recusar ${item.patient.name}`} disabled={busy} onPress={() => ask('Recusar solicitação?', `Recusar o pedido de ${item.patient.name}?`, () => { void respond(item.id, false); })} />
    </Card>)}{confirmation}
  </Page>;
}
