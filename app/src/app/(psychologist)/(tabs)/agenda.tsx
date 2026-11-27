import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { ApiError } from '@/api';
import { psychologistApi } from '@/api/psychologist';
import type { Appointment, AppointmentInput } from '@/api/psychologist/types';
import { ChoiceGroup, Colors, EmptyState, formatDateTime, Icon, Radius, RoleColors, Skeleton, Spacing, StatusTag, statusTagKind, Text } from '@/design-system';
import { calendarDays } from '@/patient/agenda';
import { isAppointmentConflict, localAppointmentIso, splitAppointments } from '@/psychologist/domain';
import { collectPages } from '@/psychologist/resource';
import { Action, Card, ErrorNotice, Field, Page, useConfirmation, useResource } from '@/psychologist/ui';

const statusText: Record<Appointment['status'], string> = {
  scheduled: 'Agendada', rescheduled: 'Reagendada', cancelled: 'Cancelada', done: 'Realizada',
};

export default function Agenda() {
  const [month, setMonth] = useState(() => new Date());
  const params = useLocalSearchParams<{ bond_id?: string }>();
  const [bondId, setBondId] = useState<number | null>(params.bond_id ? Number(params.bond_id) : null);
  // O formulário abre no modal para uma consulta por vez.
  const [form, setForm] = useState<'new' | number | null>(params.bond_id ? 'new' : null);
  const editing = typeof form === 'number' ? form : null;
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [modality, setModality] = useState<Appointment['modality']>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState<unknown>(null);
  const [cancelError, setCancelError] = useState<unknown>(null);
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
  // A aba fica montada entre uma visita e outra: sem recarregar no foco, a agenda envelhece.
  const reload = resource.reload;
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  const patients = resource.data?.patients ?? [];
  const activeBonds = new Set(patients.map((item) => item.bond_id));
  // Com um paciente só não há o que escolher: ele já vem marcado.
  const selectedBond = bondId ?? (patients.length === 1 ? patients[0].bond_id : null);
  const errors = error instanceof ApiError ? error.errors : undefined;

  function reset() {
    setForm(null); setBondId(null); setDate(''); setTime(''); setModality(null); setNotes('');
    setError(null); setCancelError(null); setDateError(undefined); setConflict(null);
  }

  // A aba fica montada: o prontuário que pede um agendamento troca o parâmetro sem recriar a tela.
  const [requestedBond, setRequestedBond] = useState(params.bond_id);
  if (params.bond_id !== requestedBond) {
    setRequestedBond(params.bond_id);
    if (params.bond_id) { reset(); setBondId(Number(params.bond_id)); setForm('new'); }
  }
  // Consumido o pedido, o parâmetro sai: o próximo pedido do mesmo paciente volta a abrir o formulário.
  useEffect(() => {
    if (params.bond_id) router.setParams({ bond_id: undefined });
  }, [params.bond_id]);

  function openNew() {
    reset();
    setForm('new');
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
    if (!scheduled_at || selectedBond === null) return;
    void submit({ bond_id: selectedBond, scheduled_at, modality, notes: notes || null }, editing);
  }

  function edit(appointment: Appointment) {
    const local = new Date(appointment.scheduled_at);
    const pad = (value: number) => String(value).padStart(2, '0');
    setForm(appointment.id); setBondId(appointment.bond_id);
    setDate(`${pad(local.getDate())}/${pad(local.getMonth() + 1)}/${local.getFullYear()}`);
    setTime(`${pad(local.getHours())}:${pad(local.getMinutes())}`);
    setModality(appointment.modality); setNotes(appointment.notes ?? '');
    setConflict(null); setError(null); setCancelError(null); setDateError(undefined);
  }

  async function cancel(id: number) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true); setCancelError(null);
    try {
      await psychologistApi.cancelAppointment(id);
      if (editing === id) reset();
      await resource.reload();
    } catch (failure) {
      setCancelError(failure);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const appointments = splitAppointments(resource.data?.appointments ?? []);

  function renderForm() {
    return <>
      <Text variant="h5">{editing === null ? 'Agendar consulta' : 'Reagendar consulta'}</Text>
      {/* No reagendamento o paciente não muda, e o cartão já diz quem é. */}
      {editing === null ? <>
        <ChoiceGroup tone="psychologist" label="Paciente" value={selectedBond} onChange={setBondId}
          options={patients.map((item) => ({ value: item.bond_id, label: item.patient.name }))}
          disabled={busy || conflict !== null} />
        {errors?.bond_id ? <Text color="error" accessibilityRole="alert">{errors.bond_id.join(' ')}</Text> : null}
      </> : null}
      <Field label="Data" value={date} onChangeText={setDate} placeholder="DD/MM/AAAA" maxLength={10}
        editable={!busy && conflict === null} error={dateError ?? errors?.scheduled_at?.join(' ')} />
      <Field label="Hora" value={time} onChangeText={setTime} placeholder="HH:MM" maxLength={5} editable={!busy && conflict === null} />
      <View style={{ gap: Spacing.two }}>
        <ChoiceGroup tone="psychologist" label="Modalidade" value={modality} onChange={setModality}
          options={[{ value: 'online', label: 'Online' }, { value: 'presencial', label: 'Presencial' }, { value: null, label: 'A definir' }]}
          disabled={busy || conflict !== null} />
        {errors?.modality ? <Text color="error" accessibilityRole="alert">{errors.modality.join(' ')}</Text> : null}
      </View>
      <Field label="Observação (opcional)" value={notes} onChangeText={setNotes} maxLength={255} multiline
        accessibilityHint="O paciente vê esta observação. Não use para anotação clínica."
        editable={!busy && conflict === null} error={errors?.notes?.join(' ')} />
      <Text variant="small" color="textSecondary">O paciente vê esta observação.</Text>
      <ErrorNotice error={error} />
      {conflict ? <>
        <Text color="error" accessibilityRole="alert">{errors?.confirm_conflict?.join(' ')}</Text>
        <Action icon="check" label="Agendar mesmo assim" disabled={busy} onPress={() => {
          void submit({ ...conflict.input, confirm_conflict: true }, conflict.id);
        }} />
        <Action variant="secondary" icon="clock" label="Escolher outro horário" disabled={busy} onPress={() => { setConflict(null); setError(null); }} />
      </> : <Action icon="check" label={editing === null ? 'Agendar consulta' : 'Salvar reagendamento'}
        disabled={busy || selectedBond === null || !activeBonds.has(selectedBond)} onPress={save} />}
      <Action variant="secondary" icon="x" label="Cancelar" accessibilityLabel="Cancelar e fechar o formulário" disabled={busy} onPress={reset} />
    </>;
  }

  return <Page>
    {resource.loading && !resource.data ? <Skeleton variant="calendar" /> : null}
    <ErrorNotice error={resource.error} retry={resource.reload} />
    <ErrorNotice error={cancelError} />
    {/* Sem vínculo e sem consulta não há o que mostrar: só a imagem e a mensagem. */}
    {resource.data && !patients.length && !resource.data.appointments.length ? <EmptyState illustration="agenda" title="Sua agenda está vazia"
      description="É preciso ter um vínculo ativo para agendar uma consulta." /> : null}
    {resource.data && patients.length && !resource.data.appointments.length ? <EmptyState illustration="agenda" title="Nenhuma consulta agendada">
      <Action icon="calendar-plus" label="Agendar consulta" disabled={busy} onPress={openNew} />
    </EmptyState> : null}
    {resource.data?.appointments.length ? <>
      <View style={styles.calendar}>
        <View style={styles.monthRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" style={styles.monthButton} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Icon name="caret-left" /></Pressable>
          <Text variant="h5">{month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Próximo mês" style={styles.monthButton} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Icon name="caret-right" /></Pressable>
        </View>
        <View style={styles.grid}>
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <View key={`weekday-${index}`} style={styles.cell}><Text variant="small" color="textSecondary">{day}</Text></View>)}
          {calendarDays(month, resource.data.appointments).map((entry, index) => <View key={index} style={styles.cell}>
            {entry ? <View accessible accessibilityLabel={`${entry.day} de ${month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}${entry.hasAppointment ? ', com consulta' : ''}`} style={[styles.day, entry.hasAppointment && styles.marked]}><Text variant="small">{entry.day}</Text></View> : null}
          </View>)}
        </View>
      </View>
      {patients.length === 0 ? <Text>É preciso ter um vínculo ativo para agendar uma consulta.</Text>
        : <Action icon="calendar-plus" label="Agendar consulta" disabled={busy} onPress={openNew} />}
      {([['Próximas', appointments.upcoming], ['Anteriores', appointments.previous]] as const).map(([title, items]) => items.length ? <Fragment key={title}>
        <Text variant="h4" accessibilityRole="header">{title}</Text>
        {items.map((appointment) => <Card key={appointment.id}>
          {/* A etiqueta fica ao lado do nome, que é curto: ao lado de "data · Presencial" ela quebrava sozinha para baixo. */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two }}>
            <Icon name="calendar" size={20} />
            <Text variant="h5">{appointment.patient.name}</Text>
            <StatusTag kind={statusTagKind(appointment.status)} label={statusText[appointment.status]} />
          </View>
          <Text>{[formatDateTime(appointment.scheduled_at), appointment.modality === 'online' ? 'Online' : appointment.modality === 'presencial' ? 'Presencial' : null].filter(Boolean).join(' · ')}</Text>
          {appointment.notes ? <Text color="textSecondary">{appointment.notes}</Text> : null}
          {activeBonds.has(appointment.bond_id) && (appointment.status === 'scheduled' || appointment.status === 'rescheduled') ? <View style={{ flexDirection: 'row', gap: Spacing.two }}>
              <Action variant="secondary" icon="calendar" label="Reagendar" accessibilityLabel={`Reagendar consulta de ${appointment.patient.name}`}
                disabled={busy || conflict !== null} onPress={() => edit(appointment)} style={{ flex: 1 }} />
              <Action variant="destructive" icon="x" label="Cancelar" accessibilityLabel={`Cancelar consulta de ${appointment.patient.name}`}
                disabled={busy || conflict !== null} style={{ flex: 1 }} onPress={() => {
                  ask('Cancelar consulta?', `Consulta de ${appointment.patient.name}, ${formatDateTime(appointment.scheduled_at)}.`,
                    () => { void cancel(appointment.id); }, 'destructive');
                }} />
            </View> : null}
          {!activeBonds.has(appointment.bond_id) ? <Text>Vínculo encerrado. Somente leitura.</Text> : null}
        </Card>)}
      </Fragment> : null)}
    </> : null}
    <Modal visible={form !== null} transparent animationType="fade" onRequestClose={() => { if (!busy) reset(); }}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
            {renderForm()}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    {confirmation}
  </Page>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  dialog: { width: '100%', maxWidth: 560, maxHeight: '90%', padding: Spacing.four, backgroundColor: Colors.background, borderRadius: Radius.md },
  form: { gap: Spacing.three, paddingBottom: Spacing.two },
  calendar: { gap: Spacing.two },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  marked: { backgroundColor: RoleColors.psychologist.tint },
});
