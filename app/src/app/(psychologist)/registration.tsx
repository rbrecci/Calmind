import { useRef, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { ApiError } from '@/api';
import { psychologistApi } from '@/api/psychologist';
import type { DocumentUpload } from '@/api/psychologist/types';
import { Screen, Text } from '@/design-system';
import { useSession } from '@/session/session-context';
import { usePsychologistAccess } from '@/psychologist/access';
import { documentFromAsset } from '@/psychologist/document';
import { Action, ErrorNotice, Field } from '@/psychologist/ui';

export default function Registration() {
  const { profile, refresh } = usePsychologistAccess();
  const { signOut } = useSession();
  const [region, setRegion] = useState('06');
  const [number, setNumber] = useState('');
  const [document, setDocument] = useState<DocumentUpload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const submitting = useRef(false);
  const fieldError = (field: string) => error instanceof ApiError ? error.errors?.[field]?.join(' ') : undefined;
  async function chooseDocument() {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png'], copyToCacheDirectory: true, multiple: false });
      if (!result.canceled) setDocument(documentFromAsset(result.assets[0]));
    } catch (cause) { setError(cause); }
  }
  async function submit() {
    if (submitting.current) return;
    setError(null);
    if (!document) { setError(new ApiError(422, 'Selecione o documento profissional.', { document: ['Selecione o documento profissional.'] })); return; }
    submitting.current = true; setBusy(true);
    try { await psychologistApi.submitRegistration({ crp_region: region, crp_number: number, document }); refresh(); }
    catch (cause) { setError(cause); } finally { submitting.current = false; setBusy(false); }
  }
  return <Screen scroll><Text variant="h3">Cadastro profissional</Text>
    {profile?.approval_status === 'rejected' ? <><Text>Seu cadastro foi recusado. Confira a justificativa e reenvie os dados.</Text>
      <Text accessibilityRole="alert">{profile.approval_note}</Text></> : null}
    <Text>Informe seu CRP e envie o documento para análise.</Text>
    <Field label="Região do CRP (01 a 24)" keyboardType="number-pad" maxLength={2} value={region} onChangeText={setRegion} error={fieldError('crp_region')} editable={!busy} />
    <Field label="Número do CRP (4 a 7 dígitos)" keyboardType="number-pad" maxLength={7} value={number} onChangeText={setNumber} error={fieldError('crp_number')} editable={!busy} />
    <Text>Documento em PDF, JPG ou PNG, de até 5 MB.</Text>
    {document ? <Text>{document.name}</Text> : null}
    <Action label="Selecionar documento" disabled={busy} onPress={() => { void chooseDocument(); }} />
    {fieldError('document') ? <Text color="error" accessibilityRole="alert">{fieldError('document')}</Text> : null}
    <ErrorNotice error={error} />
    <Action label={profile?.approval_status === 'rejected' ? 'Reenviar cadastro' : 'Enviar cadastro para análise'} loading={busy} onPress={() => { void submit(); }} />
    <Action label="Sair da conta" disabled={busy} onPress={() => { void signOut(); }} />
  </Screen>;
}
