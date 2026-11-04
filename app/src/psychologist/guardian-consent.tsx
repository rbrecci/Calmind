import { useRef, useState } from 'react';
import { ApiError } from '@/api';
import { psychologistApi } from '@/api/psychologist';
import type { GuardianConsentInput } from '@/api/psychologist/types';
import { Text } from '@/design-system';
import { formatDueDate } from '@/psychologist/domain';
import { collectPages } from '@/psychologist/resource';
import { Action, Card, displayDate, ErrorNotice, Field, useResource } from '@/psychologist/ui';

export function GuardianConsentSection({ patientId, guardianName }: { patientId: number; guardianName: string }) {
  const list = useResource(() => collectPages((page) => psychologistApi.guardianConsents(patientId, { page, per_page: 50 })), patientId);
  const [name, setName] = useState(guardianName);
  const [date, setDate] = useState('');
  const [method, setMethod] = useState<GuardianConsentInput['method']>('presencial');
  const [note, setNote] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const errors = error instanceof ApiError ? error.errors : undefined;
  const methods = { presencial: 'Presencial', telefone: 'Telefone', videochamada: 'Videochamada', mensagem_escrita: 'Mensagem escrita' } as const;
  async function save() {
    if (submitting.current) return;
    const obtained_at = formatDueDate(date);
    if (!obtained_at) { setError(new ApiError(422, 'Informe a data no formato DD/MM/AAAA.', { obtained_at: ['Informe uma data válida.'] })); return; }
    submitting.current = true; setBusy(true); setError(null);
    try {
      await psychologistApi.createGuardianConsent(patientId, { guardian_name: name, obtained_at, method, note: note || null });
      setDate(''); setNote(''); await list.reload();
    } catch (cause) { setError(cause); } finally { submitting.current = false; setBusy(false); }
  }
  return <><Text variant="h4">Consentimento do responsável</Text>
    {list.loading ? <Text>Carregando registros...</Text> : null}
    <ErrorNotice error={list.error} retry={list.reload} />
    {list.data?.length === 0 ? <Text>Nenhum registro de consentimento do responsável.</Text> : null}
    {list.data?.map((item) => <Card key={item.id}><Text>{item.guardian_name}</Text>
      <Text>Obtido em {displayDate(item.obtained_at)}</Text><Text>{methods[item.method]}</Text>
      {item.note ? <Text>{item.note}</Text> : null}<Text>Registrado em {displayDate(item.created_at)}</Text>
    </Card>)}
    <Card><Text>Acrescente um novo registro. Os registros anteriores são preservados.</Text>
      <Field label="Nome do responsável" value={name} onChangeText={setName} maxLength={150} editable={!busy} error={errors?.guardian_name?.join(' ')} />
      <Field label="Data do consentimento (DD/MM/AAAA)" value={date} onChangeText={setDate} maxLength={10} editable={!busy} error={errors?.obtained_at?.join(' ')} />
      <Text>Forma de obtenção: {methods[method]}</Text>
      {(Object.keys(methods) as (keyof typeof methods)[]).map((value) => <Action key={value} label={methods[value]} disabled={busy} onPress={() => setMethod(value)} />)}
      {errors?.method ? <Text color="error">{errors.method.join(' ')}</Text> : null}
      <Field label="Observação do registro (opcional)" value={note} onChangeText={setNote} multiline editable={!busy} error={errors?.note?.join(' ')} />
      <ErrorNotice error={error} /><Action label="Registrar consentimento" loading={busy} onPress={() => { void save(); }} />
    </Card>
  </>;
}
