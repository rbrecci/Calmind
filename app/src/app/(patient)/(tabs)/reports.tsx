import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Mood } from '@/api';
import { patientApi } from '@/api/patient';
import type { PatientReport } from '@/api/patient/types';
import {
  Button, capitalizeFirst, dayKey, EmptyState, formatDayKey, formatMonth, MonthCalendar, monthRange, MoodPicker, ReportFeed, Skeleton, StatusTag,
  statusTagKind, Text, type DayMark,
} from '@/design-system';
import { loadPatientPages } from '@/patient/load-pages';
import { NoBond } from '@/patient/no-bond';
import { errorMessage } from '@/patient/presentation';
import { reportStatus, unpublishWarning, type ReportStatus } from '@/patient/reports';
import { Confirmation, Feedback, PatientPage } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';

const reportLabel: Record<ReportStatus, string> = { private: 'Privado', shared: 'Compartilhado', unpublished: 'Compartilhamento retirado' };

export default function Reports() {
  const router = useRouter();
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const monthKey = formatMonth(month);
  // Um mês por vez: a tela continua leve mesmo com centenas de relatos.
  const load = useCallback(async () => {
    const range = monthRange(month);
    const today = dayKey(new Date());
    const [bonds, any, reports, moods, todayMood] = await Promise.all([
      loadPatientPages(patientApi.bonds),
      patientApi.reports({ per_page: 1 }),
      loadPatientPages((page) => patientApi.reports({ ...page, ...range })),
      loadPatientPages((page) => patientApi.moods({ ...page, ...range })),
      patientApi.moods({ from: today, to: today }),
    ]);
    return {
      key: formatMonth(month), active: bonds.some((b) => b.status === 'active'), total: any.meta.total, reports, moods,
      todayMood: todayMood.data[0]?.mood ?? null,
    };
  }, [month]);
  const { data, loading, error, reload } = usePatientData(load);
  const [removing, setRemoving] = useState<PatientReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // A escolha aparece na hora; o servidor confirma em seguida.
  const [picked, setPicked] = useState<Mood | null>(null);

  async function unpublish() {
    if (!removing) return;
    setBusy(true); setActionError(null);
    try { await patientApi.unpublishReport(removing.id); setRemoving(null); await reload(); }
    catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  }
  async function markMood(mood: Mood) {
    setPicked(mood); setActionError(null);
    try { await patientApi.markMood(mood); await reload(); }
    catch (e) { setActionError(errorMessage(e)); } finally { setPicked(null); }
  }
  function changeMonth(next: Date) { setMonth(next); setSelected(null); }

  // O mês que está na tela ainda não chegou: o calendário fica, e o conteúdo espera inteiro.
  const current = data?.key === monthKey ? data : null;
  const moods: Record<string, Mood> = {};
  const marks: Record<string, DayMark> = {};
  for (const entry of current?.moods ?? []) {
    moods[entry.date] ??= entry.mood;
    marks[entry.date] = { mood: moods[entry.date] };
  }
  for (const report of current?.reports ?? []) {
    const key = dayKey(report.created_at);
    marks[key] = { ...marks[key], count: (marks[key]?.count ?? 0) + 1 };
  }
  if (picked) {
    const today = dayKey(new Date());
    if (current) { moods[today] = picked; marks[today] = { ...marks[today], mood: picked }; }
  }
  const visible = (current?.reports ?? []).filter((report) => !selected || dayKey(report.created_at) === selected);

  return <PatientPage onRefresh={reload}>
    <Feedback loading={loading && data === null} error={error} retry={() => void reload()} initial skeleton="calendar" />
    {data && !error && !data.active && data.total === 0 ? <NoBond illustration="relatos" title="Nenhum relato por aqui"
      description="Os relatos são liberados quando você tem vínculo com um psicólogo." /> : null}
    {data && !error && (data.active || data.total > 0) ? <>
      {data.active ? <>
        <MoodPicker value={picked ?? data.todayMood} disabled={picked !== null} onChange={(mood) => void markMood(mood)} />
        <Button tone="patient" icon="pencil" label="Novo relato" onPress={() => router.push('/new-report')} />
      </> : <Text color="textSecondary">Sem vínculo ativo. Histórico somente para leitura.</Text>}
      {actionError ? <Text accessibilityRole="alert" color="error">{actionError}</Text> : null}
      <MonthCalendar tone="patient" month={month} onMonthChange={changeMonth} selected={selected} onSelect={setSelected} marks={marks} />
      {removing ? <Confirmation message={unpublishWarning(removing.used_in_analysis)} busy={busy} kind="destructive"
        confirm={() => void unpublish()} cancel={() => setRemoving(null)} /> : null}
      {!current ? <Skeleton /> : <>
        <Text variant="h5" accessibilityRole="header">{selected ? capitalizeFirst(formatDayKey(selected)) : `Relatos de ${monthKey}`}</Text>
        {selected ? <Button tone="patient" variant="secondary" icon="calendar" label="Ver o mês todo" onPress={() => setSelected(null)} /> : null}
        {visible.length ? <ReportFeed key={`${monthKey}-${selected}`} tone="patient" reports={visible} moods={moods}
          renderTag={(report) => <StatusTag kind={statusTagKind(reportStatus(report))} label={reportLabel[reportStatus(report)]} />}
          renderActions={(report) => data.active && report.visibility === 'shared' && !report.unpublished_at
            ? <Button tone="patient" variant="destructive" icon="link-break" label="Parar de compartilhar" disabled={busy} onPress={() => setRemoving(report)} /> : null} />
          : data.total === 0 ? <EmptyState illustration="relatos" title="Você ainda não escreveu relatos" />
            : <Text color="textSecondary">{selected ? 'Nenhum relato neste dia.' : 'Nenhum relato neste mês.'}</Text>}
      </>}
    </> : null}
  </PatientPage>;
}
