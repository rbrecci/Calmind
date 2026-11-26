import { Fragment } from 'react';
import { View } from 'react-native';

import { patientApi } from '@/api/patient';
import { EmptyState, formatTime, formatWeekdayDate, Spacing, StatusTag, statusTagKind, Text } from '@/design-system';
import { appointmentStatus, groupAppointments } from '@/patient/agenda';
import { loadPatientPages } from '@/patient/load-pages';
import { Card, Feedback, PatientPage } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';

const loadAgenda = () => loadPatientPages(patientApi.appointments);

export default function Agenda() {
  const { data, loading, error, reload } = usePatientData(loadAgenda);
  const groups = groupAppointments(data ?? []);
  return <PatientPage onRefresh={reload}>
    <Feedback loading={loading} error={error} retry={() => void reload()} initial={data === null} />
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
