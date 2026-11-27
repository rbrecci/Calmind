import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import type { Mood, MoodEntry } from '@/api';
import { psychologistApi } from '@/api/psychologist';
import type { Appointment, PatientDetail, SharedReport, Task } from '@/api/psychologist/types';
import {
  ChoiceGroup, capitalizeFirst, dayKey, EmptyState, formatDateTime, formatDayKey, formatMonth, formatShortDate, Icon, ListItem, MonthCalendar, monthRange,
  ReportFeed, Skeleton, Spacing, StatusTag, statusTagKind, Text, type DayMark,
} from '@/design-system';
import { composeRecord } from '@/psychologist/domain';
import { GuardianConsentSection } from '@/psychologist/guardian-consent';
import { collectPages } from '@/psychologist/resource';
import { TaskForm } from '@/psychologist/task-form';
import { Action, Card, ErrorNotice, Page, useConfirmation, useResource } from '@/psychologist/ui';

type Section = 'reports' | 'tasks' | 'appointments';

const SECTIONS = [
  { value: 'reports', label: 'Relatos' },
  { value: 'tasks', label: 'Tarefas' },
  { value: 'appointments', label: 'Consultas' },
] as const;

const row = { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two } as const;

type MonthData = { key: string; reports: SharedReport[]; moods: MoodEntry[]; total: number };

// Um mês por vez. `total` é de todos os relatos compartilhados, para saber se há algum.
async function loadMonth(patientId: number, month: Date): Promise<MonthData> {
  const range = monthRange(month);
  const [any, reports, moods] = await Promise.all([
    psychologistApi.reports(patientId, { per_page: 1 }),
    collectPages((page) => psychologistApi.reports(patientId, { ...range, page, per_page: 50 })),
    collectPages((page) => psychologistApi.moods(patientId, { ...range, page, per_page: 100 })),
  ]);
  return { key: formatMonth(month), reports, moods, total: any.meta.total };
}

function ReportsSection({ patientId, month, onMonthChange, data, error, retry }: {
  patientId: number; month: Date; onMonthChange: (month: Date) => void; data: MonthData | null; error: unknown; retry: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const current = data?.key === formatMonth(month) ? data : null;
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
  const visible = (current?.reports ?? []).filter((report) => !selected || dayKey(report.created_at) === selected);
  if (current && current.total === 0 && !current.moods.length) {
    return <EmptyState illustration="relatos" title="Nenhum relato compartilhado" />;
  }
  return <>
    <MonthCalendar tone="psychologist" month={month} marks={marks} selected={selected} onSelect={setSelected}
      onMonthChange={(next) => { setSelected(null); onMonthChange(next); }} />
    <ErrorNotice error={error} retry={retry} />
    {!current ? error ? null : <Skeleton /> : <>
      <Text variant="h5" accessibilityRole="header">{selected ? capitalizeFirst(formatDayKey(selected)) : `Relatos de ${formatMonth(month)}`}</Text>
      {selected ? <Action variant="secondary" icon="calendar" label="Ver o mês todo" onPress={() => setSelected(null)} /> : null}
      {visible.length ? <ReportFeed key={`${patientId}-${formatMonth(month)}-${selected}`} tone="psychologist" reports={visible} moods={moods} />
        : <Text color="textSecondary">{selected ? 'Nenhum relato compartilhado neste dia.' : 'Nenhum relato compartilhado neste mês.'}</Text>}
    </>}
  </>;
}

type RecordData = { patient: PatientDetail; tasks: Task[]; appointments: Appointment[]; month: MonthData };

function RecordSections({ data, month, onMonthChange, monthData, monthError, reload, bondAction }: {
  data: RecordData; month: Date; onMonthChange: (month: Date) => void; monthData: MonthData | null; monthError: unknown;
  reload: () => void; bondAction: ReactNode;
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>('reports');
  const { patient } = data;
  const record = composeRecord(patient, [], data.tasks, data.appointments);
  return <>
    {/* O nome vai no cabeçalho; aqui fica só o estado do vínculo. */}
    <View style={row}>
      <StatusTag kind={statusTagKind(patient.bond_status)} label={record.readOnly ? 'Encerrado' : 'Ativo'} />
      <Text color="textSecondary">desde {formatShortDate(patient.since)}</Text>
    </View>
    {patient.is_minor && patient.guardian ? <Card><Text variant="h5">Responsável legal</Text>
      <Text>Nome: {patient.guardian.name}</Text><Text>Telefone: {patient.guardian.phone}</Text>
      <Text>Parentesco: {patient.guardian.relationship}</Text></Card> : null}
    {/* A conversa e o vínculo não pertencem a nenhuma aba: ficam acima delas, no mesmo lugar em todas. */}
    <ListItem tone="psychologist" icon="chat" title="Conversa" onPress={() => router.push(`/(psychologist)/patients/${patient.patient.id}/chat`)} />
    {bondAction}
    <ChoiceGroup variant="tabs" tone="psychologist" label="Seção do prontuário" value={section} onChange={setSection} options={SECTIONS} />
    {section === 'reports' ? <ReportsSection patientId={patient.patient.id} month={month} onMonthChange={onMonthChange}
      data={monthData} error={monthError} retry={reload} /> : null}
    {/* Atribuir tarefa é o formulário no fim desta aba, junto das tarefas que ele afeta. */}
    {section === 'tasks' ? <TaskForm bondId={patient.bond_id} readonly={record.readOnly} tasks={record.tasks} onChanged={reload} /> : null}
    {section === 'appointments' ? <>
      {!record.readOnly ? <ListItem tone="psychologist" icon="calendar-plus" title="Agendar consulta" onPress={() => router.dismissTo({ pathname: '/(psychologist)/(tabs)/agenda', params: { bond_id: patient.bond_id } })} /> : null}
      {record.appointments.length === 0 ? <Text color="textSecondary">Nenhuma consulta.</Text> : null}
      {record.appointments.map((appointment) => <Card key={appointment.id}>
        <View style={row}>
          <Icon name="calendar" size={20} />
          <Text>{[formatDateTime(appointment.scheduled_at), appointment.modality === 'presencial' ? 'Presencial' : appointment.modality === 'online' ? 'Online' : null].filter(Boolean).join(' · ')}</Text>
          <StatusTag kind={statusTagKind(appointment.status)}
            label={({ scheduled: 'Agendada', rescheduled: 'Reagendada', cancelled: 'Cancelada', done: 'Realizada' })[appointment.status]} />
        </View>
        {appointment.notes ? <Text color="textSecondary">{appointment.notes}</Text> : null}
      </Card>)}
    </> : null}
    {patient.is_minor && !record.readOnly ? <GuardianConsentSection patientId={patient.patient.id} guardianName={patient.guardian?.name ?? ''} /> : null}
  </>;
}

export default function PatientRecord() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const patientId = Number(id);
  const [month, setMonth] = useState(() => new Date());
  // O prontuário entra inteiro: cabeçalho do vínculo e as três abas chegam na mesma carga.
  const record = useResource<RecordData>(async () => {
    const patient = await psychologistApi.patient(patientId);
    const [tasks, appointments, monthData] = await Promise.all([
      collectPages((page) => psychologistApi.tasks({ bond_id: patient.bond_id, page, per_page: 50 })),
      collectPages((page) => psychologistApi.appointments({ bond_id: patient.bond_id, page, per_page: 50 })),
      loadMonth(patientId, new Date()),
    ]);
    return { patient, tasks, appointments, month: monthData };
  }, id);
  // Os outros meses são buscados só quando a pessoa navega até eles.
  const [other, setOther] = useState<{ data: MonthData | null; error: unknown }>({ data: null, error: null });
  const currentKey = formatMonth(new Date());
  const monthKey = formatMonth(month);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (monthKey === currentKey) return;
    let live = true;
    loadMonth(patientId, month).then(
      (data) => { if (live) setOther({ data, error: null }); },
      (error) => { if (live) setOther({ data: null, error }); },
    );
    return () => { live = false; };
  }, [patientId, month, monthKey, currentKey, attempt]);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const { ask, confirmation } = useConfirmation();
  const reload = record.reload;
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  const refresh = () => { void reload(); setAttempt((value) => value + 1); };
  async function endBond() {
    if (!record.data) return;
    setBusy(true); setError(null);
    try { await psychologistApi.endBond(record.data.patient.bond_id); router.dismissTo('/(psychologist)/(tabs)/dashboard'); }
    catch (cause) { setError(cause); } finally { setBusy(false); }
  }
  const data = record.data;
  // Objeto estável: um novo a cada renderização reaplicaria as opções sem parar.
  const name = data?.patient.patient.name;
  const headerOptions = useMemo(() => ({ title: name }), [name]);
  // O título do cabeçalho é o nome do paciente; enquanto carrega, "Prontuário".
  return <Page>
    {name ? <Stack.Screen options={headerOptions} /> : null}
    {record.loading && !data ? <Skeleton variant="detail" /> : null}
    <ErrorNotice error={record.error} retry={record.reload} />
    {/* Encerrar fica num item só, acima das abas: no fim da tela ele parecia parte da aba aberta e
        aparecia sob as três. O item não é vermelho; quem destrói é o Confirmar da confirmação. */}
    {data ? <RecordSections key={`${data.patient.patient.id}-${data.patient.bond_id}`} data={data} month={month} onMonthChange={setMonth}
      monthData={monthKey === currentKey ? data.month : other.data} monthError={monthKey === currentKey ? null : other.error} reload={refresh}
      bondAction={<>
        {data.patient.bond_status === 'active' ? <ListItem tone="psychologist" icon="link-break" title="Vínculo" description="Encerrar o acompanhamento" disabled={busy}
          onPress={() => ask('Encerrar vínculo?', 'O histórico ficará disponível somente para leitura. Deseja encerrar?', () => { void endBond(); }, 'destructive')} /> : null}
        <ErrorNotice error={error} />
      </>} /> : null}
    {confirmation}
  </Page>;
}
