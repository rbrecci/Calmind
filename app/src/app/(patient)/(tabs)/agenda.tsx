import { Fragment } from 'react';

import { patientApi } from '@/api/patient';
import { formatTime, formatWeekdayDate, Text } from '@/design-system';
import { appointmentStatus, groupAppointments } from '@/patient/agenda';
import { loadPatientPages } from '@/patient/load-pages';
import { Card, Feedback, PatientPage } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';

const loadAgenda = () => loadPatientPages(patientApi.appointments);

export default function Agenda() {
  const { data, loading, error, reload } = usePatientData(loadAgenda);
  const groups = groupAppointments(data ?? []);
  return <PatientPage title="Minha agenda" onRefresh={reload}>
    <Text color="textSecondary">Consultas combinadas com seu profissional. Os horários seguem o fuso deste aparelho.</Text>
    <Feedback loading={loading} error={error} retry={() => void reload()} />
    {data?.length === 0 && !loading && !error ? <Text>Nenhuma consulta por enquanto.</Text> : null}
    {!error ? ([['Próximas consultas', groups.upcoming], ['Consultas passadas', groups.past]] as const).map(([title, days]) => days.length ? <Fragment key={title}>
      <Text variant="h5" accessibilityRole="header">{title}</Text>
      {days.map((day) => <Fragment key={day.day}>
        <Text color="textSecondary">{formatWeekdayDate(day.day)}</Text>
        {day.appointments.map((a) => <Card key={a.id}>
          <Text variant="h5">{formatTime(a.scheduled_at)} · {appointmentStatus(a.status)}</Text>
          <Text>{a.psychologist.name}</Text>
          <Text color="textSecondary">{a.modality === 'online' ? 'Online' : a.modality === 'presencial' ? 'Presencial' : 'Modalidade a combinar'}</Text>
          {a.notes ? <Text>{a.notes}</Text> : null}
        </Card>)}
      </Fragment>)}
    </Fragment> : null) : null}
  </PatientPage>;
}
