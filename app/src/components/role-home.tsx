import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Role } from '@/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MinTouchTarget, RoleColors, Spacing } from '@/constants/theme';
import { useSession } from '@/session/session-context';

type Props = {
  role: Role;
  title: string;
};

// Tela provisória de cada lado: prova que a navegação por papel funciona.
// As telas reais (início do paciente, painel do psicólogo) substituem esta.
export function RoleHome({ role, title }: Props) {
  const { signOut } = useSession();
  const colors = RoleColors[role];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">{title}</ThemedText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
          onPress={signOut}
          style={[styles.button, { backgroundColor: colors.background }]}>
          <Text style={[styles.buttonText, { color: colors.text }]}>Sair</Text>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  button: {
    minHeight: MinTouchTarget,
    minWidth: MinTouchTarget,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
