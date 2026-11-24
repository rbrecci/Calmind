import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import type { CatalogPsychologist, Modality } from '@/api';
import { patientApi } from '@/api/patient';
import type { CatalogFilters, CatalogQuery } from '@/api/patient/types';
import { catalogQuery, countCatalogFilters, hasCatalogFilters } from '@/catalog/catalog-filters';
import { modalityLabel } from '@/catalog/load-catalog';
import { Button, Text, TextField } from '@/design-system';
import { loadPatientPages } from '@/patient/load-pages';
import { errorMessage } from '@/patient/presentation';
import { Card, Confirmation, Feedback, PatientPage } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';

const EMPTY_FILTERS: CatalogFilters = { approach: '', specialty: '', region: '' };
const MODALITIES: Modality[] = ['online', 'presencial', 'ambos'];

export default function PatientCatalog() {
  const router = useRouter();
  const [form, setForm] = useState<CatalogFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<CatalogFilters>({});
  // Recolhidos por padrão: a lista de profissionais é o que a pessoa veio ver.
  const [showFilters, setShowFilters] = useState(false);
  const activeFilters = countCatalogFilters(applied);
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
  return <PatientPage>
    <Text color="textSecondary">Psicólogos com registro conferido no CRP.</Text>
    {!error ? <Button tone="patient" variant="secondary" label={activeFilters ? `Filtros (${activeFilters})` : 'Filtros'}
      accessibilityLabel={`${showFilters ? 'Esconder' : 'Mostrar'} filtros${activeFilters ? `, ${activeFilters} ${activeFilters === 1 ? 'ativo' : 'ativos'}` : ''}`}
      onPress={() => setShowFilters(!showFilters)} /> : null}
    {!error && showFilters ? <Card>
      <TextField label="Abordagem" value={form.approach} onChangeText={(approach) => setForm({ ...form, approach })} maxLength={120} />
      <TextField label="Especialidade" value={form.specialty} onChangeText={(specialty) => setForm({ ...form, specialty })} maxLength={120} />
      <TextField label="Região" value={form.region} onChangeText={(region) => setForm({ ...form, region })} maxLength={120} />
      <Text>Modalidade</Text>
      {/* A opção escolhida fica cheia e as outras em contorno; o leitor de tela ouve "selecionada". */}
      {([undefined, ...MODALITIES] as const).map((modality) => {
        const label = modality ? modalityLabel(modality) ?? modality : 'Qualquer modalidade';
        const selected = form.modality === modality;
        return <Button key={modality ?? 'any'} tone="patient" variant={selected ? 'primary' : 'secondary'} label={label}
          accessibilityLabel={selected ? `${label}, selecionada` : label} onPress={() => setForm({ ...form, modality })} />;
      })}
      <Button tone="patient" label="Buscar" disabled={loading || busy} onPress={() => { setApplied(catalogQuery(form)); setShowFilters(false); }} />
      {hasCatalogFilters(form) || hasCatalogFilters(applied) ? <Button tone="patient" variant="secondary" label="Limpar filtros" disabled={loading || busy}
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
