import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { imageHeaders, type Modality } from '@/api';
import { patientApi } from '@/api/patient';
import type { CatalogFilters, CatalogQuery } from '@/api/patient/types';
import { catalogQuery, countCatalogFilters, hasCatalogFilters } from '@/catalog/catalog-filters';
import { modalityLabel } from '@/catalog/load-catalog';
import { Button, Chip, PersonCard, Spacing, Text, TextField } from '@/design-system';
import { loadPatientPages } from '@/patient/load-pages';
import { Card, Feedback, PatientPage } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';

const EMPTY_FILTERS: CatalogFilters = { approach: '', specialty: '', region: '' };
const MODALITIES: Modality[] = ['online', 'presencial', 'ambos'];

// Catálogo: a busca é pela abordagem, a modalidade fica em chips que valem na hora, e
// especialidade e região ficam atrás de "Mais filtros". O cartão abre o perfil, que é onde se
// pede o vínculo. Nada de preço, nota ou ordenação por reputação (art. 20 do Código de Ética).
export default function PatientCatalog() {
  const router = useRouter();
  const [form, setForm] = useState<CatalogFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<CatalogFilters>({});
  // Recolhidos por padrão: a lista de profissionais é o que a pessoa veio ver.
  const [showFilters, setShowFilters] = useState(false);
  // A abordagem e a modalidade já aparecem na tela; o contador do chip é só do que está escondido.
  const hiddenFilters = countCatalogFilters({ specialty: applied.specialty, region: applied.region });
  const loadCatalog = useMemo(() => () => loadPatientPages((page) => {
    const query: CatalogQuery = { ...page, ...applied };
    return patientApi.catalogPsychologists(query);
  }), [applied]);
  const { data, loading, error, reload } = usePatientData(loadCatalog);
  const apply = (filters: CatalogFilters) => { setForm(filters); setApplied(catalogQuery(filters)); };
  const headers = imageHeaders();
  return <PatientPage>
    {!error ? <>
      <TextField label="Buscar por abordagem" placeholder="Ex.: TCC, psicanálise" value={form.approach} maxLength={120}
        returnKeyType="search" onChangeText={(approach) => setForm({ ...form, approach })} onSubmitEditing={() => apply(form)} />
      <View style={styles.chips}>
        {MODALITIES.map((modality) => {
          const label = modalityLabel(modality) ?? modality;
          const selected = applied.modality === modality;
          return <Chip key={modality} tone="patient" label={label} selected={selected}
            onPress={() => apply({ ...form, modality: selected ? undefined : modality })} />;
        })}
        <Chip tone="patient" label={hiddenFilters ? `Mais filtros (${hiddenFilters})` : 'Mais filtros'} selected={showFilters}
          accessibilityLabel={`${showFilters ? 'Esconder' : 'Mostrar'} mais filtros${hiddenFilters ? `, ${hiddenFilters} ${hiddenFilters === 1 ? 'ativo' : 'ativos'}` : ''}`}
          onPress={() => setShowFilters(!showFilters)} />
      </View>
    </> : null}
    {!error && showFilters ? <Card>
      <TextField label="Especialidade" value={form.specialty} onChangeText={(specialty) => setForm({ ...form, specialty })} maxLength={120} />
      <TextField label="Região" value={form.region} onChangeText={(region) => setForm({ ...form, region })} maxLength={120} />
      <Button tone="patient" label="Buscar" disabled={loading} onPress={() => { apply(form); setShowFilters(false); }} />
      {hasCatalogFilters(form) || hasCatalogFilters(applied) ? <Button tone="patient" variant="secondary" label="Limpar filtros" disabled={loading}
        onPress={() => apply(EMPTY_FILTERS)} /> : null}
    </Card> : null}
    <Feedback loading={loading} error={error} retry={() => void reload()} initial={data === null} />
    {data?.length === 0 && !loading && !error ? <Text accessibilityLiveRegion="polite">{hasCatalogFilters(applied)
      ? 'Nenhum profissional encontrado com esses filtros. Ajuste os filtros e busque de novo.'
      : 'Nenhum profissional disponível por enquanto.'}</Text> : null}
    {!error ? data?.map((p) => <PersonCard key={p.id} tone="patient" name={p.name} avatarUri={p.avatar_url} headers={headers}
      tag={{ kind: 'neutral', label: `CRP ${p.crp}` }}
      description={[p.approach, modalityLabel(p.modality)].filter(Boolean).join(' · ') || undefined}
      onPress={() => router.push({ pathname: '/(patient)/psychologist/[id]', params: { id: String(p.id) } })} />) : null}
    {data && data.length > 0 && !error ? <Text variant="small" color="textSecondary">
      Sem preço, nota ou ordenação por reputação, conforme o art. 20 do Código de Ética.
    </Text> : null}
  </PatientPage>;
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
