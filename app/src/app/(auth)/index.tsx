import { Redirect } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MinTouchTarget, RoleColors, Spacing } from '@/constants/theme';
import { useSession, type Role } from '@/session/session-context';

const OPTIONS: { role: Role; label: string }[] = [
  { role: 'patient', label: 'Entrar como paciente' },
  { role: 'psychologist', label: 'Entrar como psicólogo' },
];

// Tela provisória: escolhe o papel direto. O login real (telas 01 a 03 do protótipo)
// chama o /me pelo módulo de API e passa o papel devolvido para signIn.
export default function EntryScreen() {
  const { role, signIn } = useSession();

  // Rota de outro papel (link ou URL forçada) cai aqui; quem já está logado volta ao seu lado.
  if (role !== null) {
    return <Redirect href={role === 'patient' ? '/home' : '/dashboard'} />;
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Calmind</ThemedText>

        {OPTIONS.map(({ role, label }) => (
          <Pressable
            key={role}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => signIn(role)}
            style={[styles.button, { backgroundColor: RoleColors[role].background }]}>
            <Text style={[styles.buttonText, { color: RoleColors[role].text }]}>{label}</Text>
          </Pressable>
        ))}
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
    gap: Spacing.three,
  },
  button: {
    minHeight: MinTouchTarget,
    alignSelf: 'stretch',
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
