import { useRouter } from 'expo-router';

import { ListItem } from '@/design-system';
import { Action, Page } from '@/psychologist/ui';
import { useSession } from '@/session/session-context';

// Conta: aberta pela engrenagem do cabeçalho. O perfil continua sendo uma aba; daqui ele é um
// atalho, e voltar para ele fecha esta tela em vez de empilhar a aba por cima.
export default function PsychologistSettings() {
  const router = useRouter();
  const { signOut } = useSession();
  return <Page>
    <ListItem tone="psychologist" title="Perfil" onPress={() => router.dismissTo('/(psychologist)/(tabs)/profile')} />
    <Action variant="secondary" label="Sair da conta" onPress={() => { void signOut(); }} />
  </Page>;
}
