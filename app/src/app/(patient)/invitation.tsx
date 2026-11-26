import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ApiError } from '@/api';
import { patientApi } from '@/api/patient';
import { Button, CodeField, ErrorBanner, Text } from '@/design-system';
import { errorMessage } from '@/patient/presentation';
import { PatientPage } from '@/patient/ui';

const LENGTH = 8;

export default function Invitation() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = code.length === LENGTH && !busy;
  async function redeem() {
    if (!ready) return;
    setBusy(true); setError(null);
    try { await patientApi.redeemInvitation(code); router.dismissTo('/home'); }
    // O motivo do campo já diz tudo; o "dados inválidos" genérico antes dele só alonga o bloco.
    catch (e) { setError((e instanceof ApiError ? e.errors?.code?.[0] : undefined) ?? errorMessage(e)); } finally { setBusy(false); }
  }
  return <PatientPage>
    <Text>Digite o código de {LENGTH} caracteres que você recebeu do seu profissional.</Text>
    <CodeField value={code} length={LENGTH} accessibilityLabel={`Código de convite de ${LENGTH} caracteres`} editable={!busy}
      invalid={error !== null} onChangeText={(value) => { setCode(value); setError(null); }} onSubmitEditing={() => void redeem()} />
    {/* O alfabeto do backend (InvitationService::ALPHABET) deixa de fora O, I, 0 e 1. */}
    <Text variant="small" color="textSecondary">O código não usa as letras O e I nem os números 0 e 1, para não haver confusão ao anotar.</Text>
    <Button tone="patient" label={busy ? 'Verificando...' : 'Vincular'} disabled={!ready} onPress={() => void redeem()} />
    {error ? <ErrorBanner message={error} /> : null}
  </PatientPage>;
}
