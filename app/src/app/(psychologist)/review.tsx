import { Screen, Text } from '@/design-system';
import { useSession } from '@/session/session-context';
import { usePsychologistAccess } from '@/psychologist/access';
import { Action } from '@/psychologist/ui';

export default function Review() {
  const { refresh } = usePsychologistAccess();
  const { signOut } = useSession();
  return <Screen><Text variant="h3">Seu cadastro está em análise</Text>
    <Text>Assim que a análise terminar, você poderá acessar sua área.</Text>
    <Action label="Atualizar" onPress={refresh} />
    <Action label="Sair da conta" onPress={() => { void signOut(); }} />
  </Screen>;
}
