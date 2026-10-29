import { useRouter } from 'expo-router';
import { useState } from 'react';

import { patientApi } from '@/api/patient';
import { Button, Text, TextField } from '@/design-system';
import { errorMessage } from '@/patient/presentation';
import { PatientPage } from '@/patient/ui';

export default function Invitation() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function redeem() {
    setBusy(true); setError(null);
    try { await patientApi.redeemInvitation(code); router.dismissTo('/home'); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <PatientPage title="Código de convite">
    <Text>Digite os 8 caracteres enviados pelo seu profissional.</Text>
    <TextField label="Código de convite" accessibilityLabel="Código de convite de 8 caracteres" value={code}
      onChangeText={setCode} maxLength={8} autoCapitalize="characters" autoCorrect={false} editable={!busy} error={error ?? undefined} />
    <Button tone="patient" label={busy ? 'Verificando...' : 'Usar código'} disabled={busy || code.trim().length !== 8} onPress={() => void redeem()} />
  </PatientPage>;
}
