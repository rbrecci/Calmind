import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { imageHeaders } from '@/api';
import { patientApi } from '@/api/patient';
import { modalityLabel } from '@/catalog/load-catalog';
import { Button, Chip, ProfileHeader, Spacing, StatusTag, statusTagKind, Text } from '@/design-system';
import { loadPatientPages } from '@/patient/load-pages';
import { errorMessage } from '@/patient/presentation';
import { needsCatalog, psychologistProfile } from '@/patient/psychologist-profile';
import { Confirmation, Feedback, PatientPage } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';

// Perfil do psicólogo visto pelo paciente, só leitura. Abre pelo cartão do catálogo e pelo
// cartão do vínculo no início. Sem vínculo ativo nem pedido pendente, é daqui que sai o pedido.
export default function PsychologistProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const psychologistId = Number(id);
  const load = useMemo(() => async () => {
    const bonds = await loadPatientPages(patientApi.bonds);
    // Com vínculo ativo a API recusa o catálogo (403): a tela fica com o que o vínculo traz.
    const catalog = needsCatalog(bonds) ? await loadPatientPages(patientApi.catalogPsychologists) : null;
    return psychologistProfile(psychologistId, bonds, catalog);
  }, [psychologistId]);
  const { data, loading, error, reload } = usePatientData(load);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const profile = data?.profile ?? null;
  async function requestBond() {
    setBusy(true); setActionError(null);
    try { await patientApi.requestBond(psychologistId); router.dismissTo('/home'); }
    catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  }
  const chips = profile ? [profile.specialty, profile.approach, profile.modality ? modalityLabel(profile.modality) : null, profile.region]
    .filter((value): value is string => Boolean(value)) : [];
  return <PatientPage>
    <Feedback loading={loading} error={error} retry={() => void reload()} initial={data === null} />
    {data && !profile && !error ? <Text>Este profissional não está disponível.</Text> : null}
    {profile ? <>
      <ProfileHeader tone="patient" name={profile.name} subtitle={`CRP ${profile.crp}`}
        avatarUri={profile.avatar_url} coverUri={profile.cover_url} headers={imageHeaders()} />
      {data?.bond?.status === 'pending' ? <StatusTag kind={statusTagKind('pending')} label="aguardando resposta" /> : null}
      {chips.length ? <View style={styles.chips}>{chips.map((chip) => <Chip key={chip} tone="patient" label={chip} />)}</View> : null}
      {profile.bio ? <>
        <Text variant="h5">Apresentação</Text>
        <Text>{profile.bio}</Text>
      </> : null}
      {data?.canRequest ? <>
        <Button tone="patient" label="Solicitar vínculo" accessibilityLabel={`Solicitar vínculo com ${profile.name}`}
          disabled={busy} onPress={() => { setConfirming(true); setActionError(null); }} />
        {actionError ? <Text color="error" accessibilityRole="alert">{actionError}</Text> : null}
        {confirming ? <Confirmation message={`Solicitar vínculo com ${profile.name}? Você poderá acompanhar a resposta no início.`}
          busy={busy} confirm={() => void requestBond()} cancel={() => { setConfirming(false); setActionError(null); }} /> : null}
        <Text variant="small" color="textSecondary" style={styles.center}>O profissional precisa aceitar antes de vocês começarem.</Text>
      </> : null}
    </> : null}
  </PatientPage>;
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  center: { textAlign: 'center' },
});
