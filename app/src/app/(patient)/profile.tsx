import { useRouter } from 'expo-router';

import { imageHeaders } from '@/api';
import { patientApi } from '@/api/patient';
import { CoverCard, ListItem, Section } from '@/design-system';
import { selectBond } from '@/patient/bonds';
import { bondDuration } from '@/patient/bonds-duration';
import { loadPatientPages } from '@/patient/load-pages';
import { Feedback, PatientPage } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';
import { EditableProfileHeader } from '@/profile/editable-header';
import { useSession } from '@/session/session-context';

const loadBonds = () => loadPatientPages(patientApi.bonds);

// Meu perfil: aberto pelo avatar do cabeçalho e pela tela de conta. Foto e banner ficam só entre o
// paciente e quem tem vínculo com ele (a API não os mostra a mais ninguém).
export default function PatientProfile() {
  const router = useRouter();
  const { name } = useSession();
  const { data, loading, error, reload } = usePatientData(loadBonds);
  const bond = selectBond(data ?? []);
  const duration = bondDuration(bond?.bond_days);
  return <PatientPage>
    <Feedback loading={loading && data === null} error={error} retry={() => void reload()} initial skeleton="profile" />
    {data || error ? <>
      <EditableProfileHeader tone="patient" name={name ?? ''} />
      {bond?.status === 'active' ? <Section title="Meu acompanhamento">
        <CoverCard tone="patient" name={bond.psychologist.name} avatarUri={bond.psychologist.avatar_url}
          coverUri={bond.psychologist.cover_url} headers={imageHeaders()} description={duration ? `Vínculo: ${duration}` : undefined}
          onPress={() => router.push({ pathname: '/(patient)/psychologist/[id]', params: { id: String(bond.psychologist.id) } })} />
      </Section> : null}
      <Section title="Conta">
        <ListItem tone="patient" icon="gear" title="Configurações" onPress={() => router.push('/(patient)/settings')} />
      </Section>
    </> : null}
  </PatientPage>;
}
