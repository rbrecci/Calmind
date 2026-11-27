import { useCallback, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { psychologistApi } from '@/api/psychologist';
import type { PatientDetail } from '@/api/psychologist/types';
import { ChoiceGroup, formatDateTime, formatDayHeading, formatShortDate, ListItem, Loading, Spacing, StatusTag, statusTagKind, Text } from '@/design-system';
import { composeRecord } from '@/psychologist/domain';
import { GuardianConsentSection } from '@/psychologist/guardian-consent';
import { collectPages } from '@/psychologist/resource';
import { TaskForm } from '@/psychologist/task-form';
import { Card, ErrorNotice, Page, useConfirmation, useResource } from '@/psychologist/ui';

type Section = 'reports' | 'tasks' | 'appointments';

const SECTIONS = [
  { value: 'reports', label: 'Relatos' },
  { value: 'tasks', label: 'Tarefas' },
  { value: 'appointments', label: 'Consultas' },
] as const;

const row = { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two } as const;

function RecordSections({ patient, bondAction }: { patient: PatientDetail; bondAction: ReactNode }) {
  const router = useRouter();
  const [section, setSection] = useState<Section>('reports');
  const reports = useResource(() => collectPages((page) => psychologistApi.reports(patient.patient.id, { page, per_page: 50 })));
  const tasks = useResource(() => collectPages((page) => psychologistApi.tasks({ bond_id: patient.bond_id, page, per_page: 50 })));
  const appointments = useResource(() => collectPages((page) => psychologistApi.appointments({ bond_id: patient.bond_id, page, per_page: 50 })));
  const record = composeRecord(patient, reports.data ?? [], tasks.data ?? [], appointments.data ?? []);
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
    <ListItem tone="psychologist" title="Conversa" onPress={() => router.push(`/(psychologist)/patients/${patient.patient.id}/chat`)} />
    {bondAction}
    <ChoiceGroup variant="tabs" tone="psychologist" label="Seção do prontuário" value={section} onChange={setSection} options={SECTIONS} />
    {section === 'reports' ? <>
      {reports.loading && !reports.data ? <Loading /> : null}
      <ErrorNotice error={reports.error} retry={reports.reload} />
      {reports.data?.length === 0 ? <Text>Nenhum relato compartilhado.</Text> : null}
      {record.reports.map((report) => <Card key={report.id}>
        <Text variant="h5" accessibilityLabel={formatDateTime(report.created_at)}>{formatDayHeading(report.created_at)}</Text>
        <Text color="textSecondary">{report.body}</Text>
      </Card>)}
    </> : null}
    {/* Atribuir tarefa é o formulário no fim desta aba, junto das tarefas que ele afeta. */}
    {section === 'tasks' ? <>
      {tasks.loading && !tasks.data ? <Loading /> : null}
      <ErrorNotice error={tasks.error} retry={tasks.reload} />
      {tasks.data ? <TaskForm bondId={patient.bond_id} readonly={record.readOnly} tasks={record.tasks} onChanged={() => { void tasks.reload(); }} /> : null}
    </> : null}
    {section === 'appointments' ? <>
      {!record.readOnly ? <ListItem tone="psychologist" title="Agendar consulta" onPress={() => router.dismissTo({ pathname: '/(psychologist)/(tabs)/agenda', params: { bond_id: patient.bond_id } })} /> : null}
      {appointments.loading && !appointments.data ? <Loading /> : null}
      <ErrorNotice error={appointments.error} retry={appointments.reload} />
      {appointments.data?.length === 0 ? <Text>Nenhuma consulta.</Text> : null}
      {record.appointments.map((appointment) => <Card key={appointment.id}>
        <View style={row}>
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
  const patient = useResource(() => psychologistApi.patient(Number(id)), id);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const { ask, confirmation } = useConfirmation();
  const reload = patient.reload;
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  async function endBond() {
    if (!patient.data) return;
    setBusy(true); setError(null);
    try { await psychologistApi.endBond(patient.data.bond_id); router.dismissTo('/(psychologist)/(tabs)/dashboard'); }
    catch (cause) { setError(cause); } finally { setBusy(false); }
  }
  // O título do cabeçalho é o nome do paciente; enquanto carrega, "Prontuário".
  return <Page>
    {patient.data ? <Stack.Screen options={{ title: patient.data.patient.name }} /> : null}
    {patient.loading && !patient.data ? <Loading /> : null}
    <ErrorNotice error={patient.error} retry={patient.reload} />
    {/* Encerrar fica num item só, acima das abas: no fim da tela ele parecia parte da aba aberta e
        aparecia sob as três. O item não é vermelho; quem destrói é o Confirmar da confirmação. */}
    {patient.data ? <RecordSections key={`${patient.data.patient.id}-${patient.data.bond_id}`} patient={patient.data} bondAction={<>
      {patient.data.bond_status === 'active' ? <ListItem tone="psychologist" title="Vínculo" description="Encerrar o acompanhamento" disabled={busy}
        onPress={() => ask('Encerrar vínculo?', 'O histórico ficará disponível somente para leitura. Deseja encerrar?', () => { void endBond(); }, 'destructive')} /> : null}
      <ErrorNotice error={error} />
    </>} /> : null}
    {confirmation}
  </Page>;
}
