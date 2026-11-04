import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ApiError } from '@/api';
import { psychologistApi } from '@/api/psychologist';
import type { Appointment, AppointmentInput } from '@/api/psychologist/types';
import { Spacing, Text } from '@/design-system';
import { isAppointmentConflict, localAppointmentIso, sortAppointments } from '@/psychologist/domain';
import { collectPages } from '@/psychologist/resource';
import { Action, Card, displayDate, ErrorNotice, Field, Page, useConfirmation, useResource } from '@/psychologist/ui';

const statusText: Record<Appointment['status'], string> = {
  scheduled: 'Agendada', rescheduled: 'Reagendada', cancelled: 'Cancelada', done: 'Realizada',
};

export default function Agenda() {
  const params = useLocalSearchParams<{ bond_id?: string }>();
  const [bondId, setBondId] = useState<number | null>(params.bond_id ? Number(params.bond_id) : null);
  const [editing, setEditing] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [modality, setModality] = useState<Appointment['modality']>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState<unknown>(null);
  const [dateError, setDateError] = useState<string>();
  const [conflict, setConflict] = useState<{ id: number | null; input: AppointmentInput } | null>(null);
  const { ask, confirmation } = useConfirmation();
  const resource = useResource(useCallback(async () => {
    const [appointments, patients] = await Promise.all([
      collectPages((page) => psychologistApi.appointments({ page, per_page: 50 })),
      collectPages((page) => psychologistApi.patients({ status: 'active', page, per_page: 50 })),
    ]);
    return { appointments, patients };
  }, []));
  const activeBonds = new Set(resource.data?.patients.map((item) => item.bond_id));
  const errors = error instanceof ApiError ? error.errors : undefined;

  function reset() {
    setEditing(null); setDate(''); setTime(''); setModality(null); setNotes('');
    setError(null); setDateError(undefined); setConflict(null);
  }

  async function submit(input: AppointmentInput, appointmentId: number | null) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true); setError(null);
    try {
      if (appointmentId === null) await psychologistApi.createAppointment(input);
      else await psychologistApi.updateAppointment(appointmentId, {
        scheduled_at: input.scheduled_at, modality: input.modality,
        notes: input.notes, confirm_conflict: input.confirm_conflict,
      });
      reset();
      await resource.reload();
    } catch (failure) {
      setError(failure);
      if (isAppointmentConflict(failure)) setConflict({ id: appointmentId, input });
      else setConflict(null);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  function save() {
    const scheduled_at = localAppointmentIso(date, time);
    setDateError(scheduled_at ? undefined : 'Informe data DD/MM/AAAA e hora HH:MM válidas no fuso do aparelho.');
    if (!scheduled_at || bondId === null) return;
    void submit({ bond_id: bondId, scheduled_at, modality, notes: notes || null }, editing);
  }

  function edit(appointment: Appointment) {
    const local = new Date(appointment.scheduled_at);
    const pad = (value: number) => String(value).padStart(2, '0');
    setEditing(appointment.id); setBondId(appointment.bond_id);
    setDate(`${pad(local.getDate())}/${pad(local.getMonth() + 1)}/${local.getFullYear()}`);
    setTime(`${pad(local.getHours())}:${pad(local.getMinutes())}`);
    setModality(appointment.modality); setNotes(appointment.notes ?? '');
    setConflict(null); setError(null); setDateError(undefined);
  }

  async function cancel(id: number) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true); setError(null);
    try {
      await psychologistApi.cancelAppointment(id);
      if (editing === id) reset();
      await resource.reload();
    } catch (failure) {
      setError(failure);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const appointments = sortAppointments(resource.data?.appointments ?? []);

  return <Page title="Agenda">
    {resource.loading ? <Text>Carregando agenda...</Text> : null}
    <ErrorNotice error={resource.error} retry={resource.reload} />
    <ErrorNotice error={error} />
    {resource.data ? <>
      {appointments.length === 0 ? <Text>Nenhuma consulta agendada.</Text> : null}
      {appointments.map((appointment) => <Card key={appointment.id}>
        <Text variant="h5">{appointment.patient.name}</Text>
        <Text>{displayDate(appointment.scheduled_at)}</Text>
        <Text>{statusText[appointment.status]}</Text>
        <Text>Modalidade: {appointment.modality === 'online' ? 'Online' : appointment.modality === 'presencial' ? 'Presencial' : 'Não informada'}</Text>
        {appointment.notes ? <Text>{appointment.notes}</Text> : null}
        {activeBonds.has(appointment.bond_id) && (appointment.status === 'scheduled' || appointment.status === 'rescheduled') ? <>
          <Action label={`Reagendar consulta de ${appointment.patient.name}`} disabled={busy || conflict !== null} onPress={() => edit(appointment)} />
          <Action label={`Cancelar consulta de ${appointment.patient.name}`} disabled={busy || conflict !== null} onPress={() => {
            ask('Cancelar consulta?', `Consulta de ${appointment.patient.name}, ${displayDate(appointment.scheduled_at)}.`, () => { void cancel(appointment.id); });
          }} />
        </> : null}
        {!activeBonds.has(appointment.bond_id) ? <Text>Vínculo encerrado. Somente leitura.</Text> : null}
      </Card>)}
      {resource.data.patients.length === 0 ? <Text>É preciso ter um vínculo ativo para agendar uma consulta.</Text> : <Card>
        <Text variant="h4">{editing === null ? 'Agendar consulta' : 'Reagendar consulta'}</Text>
        <Text>Paciente</Text>
        {resource.data.patients.map((item) => <Action key={item.bond_id}
          label={`${bondId === item.bond_id ? 'Selecionado: ' : 'Selecionar: '}${item.patient.name}`}
          disabled={busy || conflict !== null || editing !== null} onPress={() => setBondId(item.bond_id)} />)}
        {errors?.bond_id ? <Text color="error" accessibilityRole="alert">{errors.bond_id.join(' ')}</Text> : null}
        <Field label="Data da consulta (DD/MM/AAAA)" value={date} onChangeText={setDate} placeholder="DD/MM/AAAA" maxLength={10}
          editable={!busy && conflict === null} error={dateError ?? errors?.scheduled_at?.join(' ')} />
        <Field label="Hora da consulta (HH:MM)" value={time} onChangeText={setTime} placeholder="HH:MM" maxLength={5} editable={!busy && conflict === null} />
        <View style={{ gap: Spacing.two }}>
          <Text>Modalidade: {modality === 'online' ? 'Online' : modality === 'presencial' ? 'Presencial' : 'Não informada'}</Text>
          <Action label="Atendimento online" disabled={busy || conflict !== null} onPress={() => setModality('online')} />
          <Action label="Atendimento presencial" disabled={busy || conflict !== null} onPress={() => setModality('presencial')} />
          <Action label="Deixar modalidade sem informar" disabled={busy || conflict !== null} onPress={() => setModality(null)} />
          {errors?.modality ? <Text color="error" accessibilityRole="alert">{errors.modality.join(' ')}</Text> : null}
        </View>
        <Field label="Observação (opcional)" value={notes} onChangeText={setNotes} maxLength={255} multiline
          editable={!busy && conflict === null} error={errors?.notes?.join(' ')} />
        {conflict ? <>
          <Text color="error" accessibilityRole="alert">{errors?.confirm_conflict?.join(' ')}</Text>
          <Action label="Agendar mesmo assim" disabled={busy} onPress={() => {
            void submit({ ...conflict.input, confirm_conflict: true }, conflict.id);
          }} />
          <Action label="Escolher outro horário" disabled={busy} onPress={() => { setConflict(null); setError(null); }} />
        </> : <Action label={editing === null ? 'Agendar consulta' : 'Salvar reagendamento'} disabled={busy || bondId === null || !activeBonds.has(bondId)} onPress={save} />}
        {editing !== null ? <Action label="Cancelar edição da consulta" disabled={busy} onPress={reset} /> : null}
      </Card>}
    </> : null}
    {confirmation}
  </Page>;
}
