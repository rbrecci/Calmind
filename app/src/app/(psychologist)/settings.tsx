import { useRouter } from 'expo-router';

import { ListItem } from '@/design-system';
import { Action, Page } from '@/psychologist/ui';
import { useSession } from '@/session/session-context';

// Conta: aberta pela engrenagem do cabeçalho, com atalho para o perfil.
export default function PsychologistSettings() {
  const router = useRouter();
  const { signOut } = useSession();
  return <Page>
    <ListItem tone="psychologist" title="Perfil" onPress={() => router.navigate('/(psychologist)/profile')} />
    <Action variant="secondary" label="Sair da conta" onPress={() => { void signOut(); }} />
  </Page>;
}
