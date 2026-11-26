import { Fragment, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { patientApi } from '@/api/patient';
import { EmptyState, formatTime, formatWeekdayDate, Icon, RoleColors, Spacing, StatusTag, statusTagKind, Text } from '@/design-system';
import { appointmentStatus, calendarDays, groupAppointments } from '@/patient/agenda';
import { loadPatientPages } from '@/patient/load-pages';
import { Card, Feedback, PatientPage } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';

const loadAgenda = () => loadPatientPages(patientApi.appointments);

export default function Agenda() {
  const { data, loading, error, reload } = usePatientData(loadAgenda);
  const [month, setMonth] = useState(() => new Date());
  const groups = groupAppointments(data ?? []);
  return <PatientPage onRefresh={reload}>
    <Feedback loading={loading} error={error} retry={() => void reload()} initial={data === null} />
    {data && !error ? <View style={styles.calendar}>
      <View style={styles.monthRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={styles.monthButton}>
          <Icon name={'caret-left'} />
        </Pressable>
        <Text variant="h5" accessibilityRole="header">{month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Próximo mês" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={styles.monthButton}>
          <Icon name={'caret-right'} />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <View key={`weekday-${index}`} style={styles.cell}><Text variant="small" color="textSecondary">{day}</Text></View>)}
        {calendarDays(month, data).map((entry, index) => <View key={index} style={styles.cell}>
          {entry ? <View accessible accessibilityLabel={`${entry.day} de ${month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}${entry.hasAppointment ? ', com consulta' : ''}`} style={[styles.day, entry.hasAppointment && styles.marked]}>
            <Text variant="small">{entry.day}</Text>
          </View> : null}
        </View>)}
      </View>
    </View> : null}
    {data?.length === 0 && !error ? <EmptyState illustration="agenda" title="Nenhuma consulta por enquanto" /> : null}
    {!error ? ([['Próximas consultas', groups.upcoming], ['Consultas passadas', groups.past]] as const).map(([title, days]) => days.length ? <Fragment key={title}>
      <Text variant="h5" accessibilityRole="header">{title}</Text>
      {days.map((day) => <Fragment key={day.day}>
        <Text color="textSecondary">{formatWeekdayDate(day.day)}</Text>
        {day.appointments.map((a) => <Card key={a.id}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two }}>
            <Text variant="h5">{formatTime(a.scheduled_at)}</Text>
            <StatusTag kind={statusTagKind(a.status)} label={appointmentStatus(a.status)} />
          </View>
          <Text color="textSecondary">{a.psychologist.name} · {a.modality === 'online' ? 'Online' : a.modality === 'presencial' ? 'Presencial' : 'Modalidade a combinar'}</Text>
          {a.notes ? <Text>{a.notes}</Text> : null}
        </Card>)}
      </Fragment>)}
    </Fragment> : null) : null}
  </PatientPage>;
}

const styles = StyleSheet.create({
  calendar: { gap: Spacing.two },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  marked: { backgroundColor: RoleColors.patient.tint },
});
