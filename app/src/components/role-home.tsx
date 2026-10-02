import type { Role } from '@/api';
import { Button, Screen, Text } from '@/design-system';
import { useSession } from '@/session/session-context';

type Props = {
  role: Role;
  title: string;
};

// Tela provisória de cada lado: prova que a navegação por papel funciona.
// As telas reais (início do paciente, painel do psicólogo) substituem esta.
export function RoleHome({ role, title }: Props) {
  const { signOut } = useSession();

  return (
    <Screen>
      <Text variant="h2">{title}</Text>
      <Button tone={role} label="Sair" accessibilityLabel="Sair da conta" onPress={signOut} />
    </Screen>
  );
}
