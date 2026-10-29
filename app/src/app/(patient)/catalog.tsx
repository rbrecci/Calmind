import { useRouter } from 'expo-router';
import { useState } from 'react';

import type { CatalogPsychologist } from '@/api';
import { patientApi } from '@/api/patient';
import { modalityLabel } from '@/catalog/load-catalog';
import { Button, Text } from '@/design-system';
import { loadPatientPages } from '@/patient/load-pages';
import { errorMessage } from '@/patient/presentation';
import { Card, Confirmation, Feedback, PatientPage } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';

const loadCatalog = () => loadPatientPages(patientApi.catalogPsychologists);

export default function PatientCatalog() {
  const router = useRouter();
  const { data, loading, error, reload } = usePatientData(loadCatalog);
  const [selected, setSelected] = useState<CatalogPsychologist | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  async function requestBond() {
    if (!selected) return;
    setBusy(true); setActionError(null);
    try { await patientApi.requestBond(selected.id); router.dismissTo('/home'); }
    catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <PatientPage title="Encontrar profissional">
    <Text color="textSecondary">Psicólogos com registro conferido no CRP.</Text>
    <Feedback loading={loading} error={error} retry={() => void reload()} />
    {actionError ? <Text color="error" accessibilityRole="alert">{actionError}</Text> : null}
    {selected ? <Confirmation message={`Solicitar vínculo com ${selected.name}? Você poderá acompanhar a resposta no início.`}
      busy={busy} confirm={() => void requestBond()} cancel={() => { setSelected(null); setActionError(null); }} /> : null}
    {data?.length === 0 && !loading && !error ? <Text>Nenhum profissional disponível por enquanto.</Text> : null}
    {!error ? data?.map((p) => <Card key={p.id}>
      <Text variant="h5">{p.name}</Text>
      <Text color="textSecondary">CRP {p.crp}</Text>
      {p.approach ? <Text>{p.approach}</Text> : null}
      {p.specialty ? <Text>{p.specialty}</Text> : null}
      {p.modality ? <Text color="textSecondary">{modalityLabel(p.modality)}</Text> : null}
      {p.region ? <Text color="textSecondary">{p.region}</Text> : null}
      {p.bio ? <Text>{p.bio}</Text> : null}
      <Button tone="patient" label="Solicitar vínculo" accessibilityLabel={`Solicitar vínculo com ${p.name}`}
        disabled={busy} onPress={() => { setSelected(p); setActionError(null); }} />
    </Card>) : null}
  </PatientPage>;
}
