import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { patientApi } from '@/api/patient';
import type { PatientReport } from '@/api/patient/types';
import { Button, EmptyState, formatDateTime, Spacing, StatusTag, statusTagKind, Text } from '@/design-system';
import { loadPatientPages } from '@/patient/load-pages';
import { errorMessage } from '@/patient/presentation';
import { reportStatus, unpublishWarning, type ReportStatus } from '@/patient/reports';
import { Card, Confirmation, Feedback, PatientPage } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';

const reportLabel: Record<ReportStatus, string> = { private: 'Privado', shared: 'Compartilhado', unpublished: 'Compartilhamento retirado' };

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
  async function unpublish() {
    if (!selected) return;
    setBusy(true); setActionError(null);
    try { await patientApi.unpublishReport(selected.id); setSelected(null); await reload(); }
    catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <PatientPage>
    <Feedback loading={loading} error={error} retry={() => void reload()} initial={data === null} />
    {actionError ? <Text accessibilityRole="alert" color="error">{actionError}</Text> : null}
    {data?.active && !error ? <Button tone="patient" label="Novo relato" onPress={() => router.push('/new-report')} /> : null}
    {data && !data.active ? <Text color="textSecondary">Sem vínculo ativo. Histórico somente para leitura.</Text> : null}
    {selected ? <Confirmation message={unpublishWarning(selected.used_in_analysis)} busy={busy} kind="destructive"
      confirm={() => void unpublish()} cancel={() => setSelected(null)} /> : null}
    {data?.reports.length === 0 && !error ? <EmptyState illustration="relatos" title="Você ainda não escreveu relatos" /> : null}
    {!error ? data?.reports.map((report) => <Card key={report.id}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two }}>
        <Text variant="small" color="textSecondary">{formatDateTime(report.created_at)}</Text>
        <StatusTag kind={statusTagKind(reportStatus(report))} label={reportLabel[reportStatus(report)]} />
      </View>
      <Text>{report.body}</Text>
      {data.active && report.visibility === 'shared' && !report.unpublished_at
        ? <Button tone="patient" variant="destructive" label="Parar de compartilhar" disabled={busy} onPress={() => setSelected(report)} /> : null}
    </Card>) : null}
  </PatientPage>;
}
