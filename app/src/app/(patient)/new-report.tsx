import { useRouter } from 'expo-router';
import { useState } from 'react';

import { patientApi } from '@/api/patient';
import type { Visibility } from '@/api/patient/types';
import { Button, ChoiceGroup, Text, TextField } from '@/design-system';
import { errorMessage } from '@/patient/presentation';
import { PatientPage } from '@/patient/ui';

const VISIBILITY_OPTIONS = [
  { value: 'shared', label: 'Compartilhado' },
  { value: 'private', label: 'Só para mim' },
] as const;

export default function NewReport() {
  const router = useRouter();
  const [visibility, setVisibility] = useState<Visibility>('shared');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    setBusy(true); setError(null);
    try { await patientApi.createReport({ body, visibility }); router.dismissTo('/reports'); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  const footer = <Button tone="patient" label={busy ? 'Salvando...' : 'Salvar relato'} disabled={busy || !body.trim()} onPress={() => void save()} />;
  return <PatientPage footer={footer}>
    <ChoiceGroup variant="segmented" tone="patient" label="Quem pode ver" value={visibility} onChange={setVisibility}
      options={VISIBILITY_OPTIONS} disabled={busy} />
    {/* Fica mesmo contra a R1: é quem lê um dado de saúde, e a pessoa decide olhando para isso. */}
    <Text variant="small" color="textSecondary">
      {visibility === 'shared' ? 'Seu profissional poderá ler este relato. Você pode parar de compartilhar depois.' : 'Só você poderá ler este relato.'}
    </Text>
    <TextField label="Seu relato" accessibilityLabel="Texto do relato" value={body} onChangeText={setBody}
      multiline numberOfLines={12} maxLength={10000} editable={!busy} error={error ?? undefined} />
  </PatientPage>;
}
