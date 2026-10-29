import { useRouter } from 'expo-router';
import { useState } from 'react';

import { patientApi } from '@/api/patient';
import type { PatientReport, Visibility } from '@/api/patient/types';
import { Button, Text } from '@/design-system';
import { loadPatientPages } from '@/patient/load-pages';
import { errorMessage } from '@/patient/presentation';
import { unpublishWarning } from '@/patient/reports';
import { Card, Confirmation, Feedback, PatientPage, TextAction } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';

async function loadReports() {
  const [reports, bonds] = await Promise.all([loadPatientPages(patientApi.reports), loadPatientPages(patientApi.bonds)]);
  return { reports, active: bonds.some((b) => b.status === 'active') };
}

export default function Reports() {
  const router = useRouter();
  const { data, loading, error, reload } = usePatientData(loadReports);
  const [selected, setSelected] = useState<PatientReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  async function changeVisibility(id: number, visibility: Visibility) {
    setBusy(true); setActionError(null);
    try { await patientApi.changeVisibility(id, visibility); await reload(); }
    catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  }
  async function unpublish() {
    if (!selected) return;
    setBusy(true); setActionError(null);
    try { await patientApi.unpublishReport(selected.id); setSelected(null); await reload(); }
    catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <PatientPage title="Meus relatos">
    <Feedback loading={loading} error={error} retry={() => void reload()} />
    {actionError ? <Text accessibilityRole="alert" color="error">{actionError}</Text> : null}
    {data?.active && !error ? <Button tone="patient" label="Novo relato" onPress={() => router.push('/new-report')} /> : null}
    {data && !data.active ? <Text color="textSecondary">Sem vínculo ativo. Histórico somente para leitura.</Text> : null}
    {selected ? <Confirmation message={unpublishWarning(selected.used_in_analysis)} busy={busy}
      confirm={() => void unpublish()} cancel={() => setSelected(null)} /> : null}
    {data?.reports.length === 0 && !loading && !error ? <Text>Você ainda não escreveu relatos.</Text> : null}
    {!error ? data?.reports.map((report) => <Card key={report.id}>
      <Text variant="h5">{report.unpublished_at ? 'Despublicado' : report.visibility === 'shared' ? 'Compartilhado' : 'Privado'}</Text>
      <Text variant="small" color="textSecondary">{new Date(report.created_at).toLocaleString('pt-BR')}</Text>
      <Text>{report.body}</Text>
      {data.active ? <>
        {!report.unpublished_at ? <TextAction label={report.visibility === 'private' ? 'Solicitar mudança para Compartilhado' : 'Solicitar mudança para Privado'}
          disabled={busy} onPress={() => void changeVisibility(report.id, report.visibility === 'private' ? 'shared' : 'private')} /> : null}
        {report.visibility === 'shared' && !report.unpublished_at ? <TextAction label="Despublicar" disabled={busy} onPress={() => setSelected(report)} /> : null}
      </> : null}
    </Card>) : null}
  </PatientPage>;
}
