import { imageHeaders } from '@/api';
import { ProfileHeader } from '@/design-system';
import { PatientPage } from '@/patient/ui';
import { ProfileImageActions } from '@/profile/image-actions';
import { useProfileImages } from '@/profile/use-profile-images';
import { useSession } from '@/session/session-context';

// Meu perfil: aberto pelo avatar do cabeçalho e pela tela de conta. Foto e capa ficam só entre o
// paciente e quem tem vínculo com ele (a API não as mostra a mais ninguém).
export default function PatientProfile() {
  const { name } = useSession();
  const images = useProfileImages();
  const headers = imageHeaders();
  return <PatientPage>
    <ProfileHeader tone="patient" name={name ?? ''} avatarUri={images.avatarUrl} coverUri={images.coverUrl} headers={headers} />
    <ProfileImageActions tone="patient" images={images} />
  </PatientPage>;
}
