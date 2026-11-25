import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { psychologistApi } from '@/api/psychologist';
import type { PatientDetail } from '@/api/psychologist/types';
import { formatDateTime, formatShortDate, ListItem, Loading, Spacing, StatusTag, statusTagKind, Text } from '@/design-system';
import { composeRecord } from '@/psychologist/domain';
import { GuardianConsentSection } from '@/psychologist/guardian-consent';
import { collectPages } from '@/psychologist/resource';
import { TaskForm } from '@/psychologist/task-form';
import { Action, Card, ErrorNotice, Page, useConfirmation, useResource } from '@/psychologist/ui';

function RecordSections({ patient }: { patient: PatientDetail }) {
  const router = useRouter();
  const reports = useResource(() => collectPages((page) => psychologistApi.reports(patient.patient.id, { page, per_page: 50 })));
  const tasks = useResource(() => collectPages((page) => psychologistApi.tasks({ bond_id: patient.bond_id, page, per_page: 50 })));
  const appointments = useResource(() => collectPages((page) => psychologistApi.appointments({ bond_id: patient.bond_id, page, per_page: 50 })));
  const record = composeRecord(patient, reports.data ?? [], tasks.data ?? [], appointments.data ?? []);
  return <>
    <Card><Text variant="h4">{patient.patient.name}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two }}>
        <StatusTag kind={statusTagKind(patient.bond_status)} label={record.readOnly ? 'Encerrado' : 'Ativo'} />
        <Text color="textSecondary">desde {formatShortDate(patient.since)}</Text>
      </View>
      {patient.is_minor && patient.guardian ? <><Text variant="h5">Responsável legal</Text>
        <Text>Nome: {patient.guardian.name}</Text><Text>Telefone: {patient.guardian.phone}</Text>
        <Text>Parentesco: {patient.guardian.relationship}</Text></> : null}
    </Card>
    <ListItem tone="psychologist" title="Conversa" onPress={() => router.push(`/(psychologist)/patients/${patient.patient.id}/chat`)} />
    {!record.readOnly ? <ListItem tone="psychologist" title="Agendar consulta" onPress={() => router.dismissTo({ pathname: '/(psychologist)/(tabs)/agenda', params: { bond_id: patient.bond_id } })} /> : null}
    <Text variant="h4">Relatos compartilhados</Text>
    {reports.loading && !reports.data ? <Text>Carregando relatos...</Text> : null}
    <ErrorNotice error={reports.error} retry={reports.reload} />
    {reports.data?.length === 0 ? <Text>Nenhum relato compartilhado.</Text> : null}
    {record.reports.map((report) => <Card key={report.id}><Text>{formatDateTime(report.created_at)}</Text><Text>{report.body}</Text></Card>)}
    <Text variant="h4">Tarefas</Text>
    {tasks.loading && !tasks.data ? <Text>Carregando tarefas...</Text> : null}
    <ErrorNotice error={tasks.error} retry={tasks.reload} />
    {tasks.data ? <TaskForm bondId={patient.bond_id} readonly={record.readOnly} tasks={record.tasks} onChanged={() => { void tasks.reload(); }} /> : null}
    <Text variant="h4">Consultas</Text>
    {appointments.loading && !appointments.data ? <Text>Carregando consultas...</Text> : null}
    <ErrorNotice error={appointments.error} retry={appointments.reload} />
    {appointments.data?.length === 0 ? <Text>Nenhuma consulta.</Text> : null}
    {record.appointments.map((appointment) => <Card key={appointment.id}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two }}>
        <Text>{[formatDateTime(appointment.scheduled_at), appointment.modality === 'presencial' ? 'Presencial' : appointment.modality === 'online' ? 'Online' : null].filter(Boolean).join(' · ')}</Text>
        <StatusTag kind={statusTagKind(appointment.status)}
          label={({ scheduled: 'Agendada', rescheduled: 'Reagendada', cancelled: 'Cancelada', done: 'Realizada' })[appointment.status]} />
      </View>
      {appointment.notes ? <Text color="textSecondary">{appointment.notes}</Text> : null}
    </Card>)}
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
  return <Page>
    {patient.loading && !patient.data ? <Loading /> : null}
    <ErrorNotice error={patient.error} retry={patient.reload} />
    {patient.data ? <RecordSections key={`${patient.data.patient.id}-${patient.data.bond_id}`} patient={patient.data} /> : null}
    <ErrorNotice error={error} />
    {patient.data?.bond_status === 'active' ? <Action variant="destructive" label="Encerrar vínculo" disabled={busy}
      onPress={() => ask('Encerrar vínculo?', 'O histórico ficará disponível somente para leitura. Deseja encerrar?', () => { void endBond(); }, 'destructive')} /> : null}
    {confirmation}
  </Page>;
}
