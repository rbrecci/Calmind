import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import type { CatalogPsychologist, Modality } from '@/api';
import { patientApi } from '@/api/patient';
import type { CatalogFilters, CatalogQuery } from '@/api/patient/types';
import { catalogQuery, hasCatalogFilters } from '@/catalog/catalog-filters';
import { modalityLabel } from '@/catalog/load-catalog';
import { Button, Text, TextField } from '@/design-system';
import { loadPatientPages } from '@/patient/load-pages';
import { errorMessage } from '@/patient/presentation';
import { Card, Confirmation, Feedback, PatientPage, TextAction } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';

const EMPTY_FILTERS: CatalogFilters = { approach: '', specialty: '', region: '' };
const MODALITIES: Modality[] = ['online', 'presencial', 'ambos'];

export default function PatientCatalog() {
  const router = useRouter();
  const [form, setForm] = useState<CatalogFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<CatalogFilters>({});
  const loadCatalog = useMemo(() => () => loadPatientPages((page) => {
    const query: CatalogQuery = { ...page, ...applied };
    return patientApi.catalogPsychologists(query);
  }), [applied]);
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
    {!error ? <Card>
      <Text variant="h5">Filtros</Text>
      <TextField label="Abordagem" value={form.approach} onChangeText={(approach) => setForm({ ...form, approach })} maxLength={120} />
      <TextField label="Especialidade" value={form.specialty} onChangeText={(specialty) => setForm({ ...form, specialty })} maxLength={120} />
      <TextField label="Região" value={form.region} onChangeText={(region) => setForm({ ...form, region })} maxLength={120} />
      <Text>Modalidade: {form.modality ? modalityLabel(form.modality) : 'Qualquer modalidade'}</Text>
      <TextAction label="Qualquer modalidade" onPress={() => setForm({ ...form, modality: undefined })} />
      {MODALITIES.map((modality) => <TextAction key={modality} label={modalityLabel(modality) ?? modality}
        onPress={() => setForm({ ...form, modality })} />)}
      <Button tone="patient" label="Buscar" disabled={loading || busy} onPress={() => setApplied(catalogQuery(form))} />
      {hasCatalogFilters(form) || hasCatalogFilters(applied) ? <TextAction label="Limpar filtros" disabled={loading || busy}
        onPress={() => { setForm(EMPTY_FILTERS); setApplied({}); }} /> : null}
    </Card> : null}
    <Feedback loading={loading} error={error} retry={() => void reload()} />
    {actionError ? <Text color="error" accessibilityRole="alert">{actionError}</Text> : null}
    {selected ? <Confirmation message={`Solicitar vínculo com ${selected.name}? Você poderá acompanhar a resposta no início.`}
      busy={busy} confirm={() => void requestBond()} cancel={() => { setSelected(null); setActionError(null); }} /> : null}
    {data?.length === 0 && !loading && !error ? <Text accessibilityLiveRegion="polite">{hasCatalogFilters(applied)
      ? 'Nenhum profissional encontrado com esses filtros. Ajuste os filtros e busque de novo.'
      : 'Nenhum profissional disponível por enquanto.'}</Text> : null}
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
