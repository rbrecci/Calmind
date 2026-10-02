import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text as NativeText, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, type FieldErrors } from '@/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Text } from '@/design-system/text';
import { MinTouchTarget, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/session/session-context';

const MOCK_ACTIVE = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// Tela provisória de login: o visual definitivo (telas 01 a 03 do protótipo) substitui este.
// O que fica é o fluxo: signIn chama a API, e o papel vem do /me.
export default function EntryScreen() {
  const { role, signIn } = useSession();
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Rota de outro papel (link ou URL forçada) cai aqui; quem já está logado volta ao seu lado.
  if (role !== null) {
    return <Redirect href={role === 'patient' ? '/home' : '/dashboard'} />;
  }

  async function submit() {
    setSubmitting(true);
    setMessage(null);
    setFieldErrors({});
    try {
      await signIn({ email, password });
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message);
        setFieldErrors(error.errors ?? {});
      } else {
        setMessage('Não foi possível entrar. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = [styles.input, { borderColor: theme.border, color: theme.text }];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Text variant="h1">Calmind</Text>

        <TextInput
          accessibilityLabel="E-mail"
          placeholder="E-mail"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={inputStyle}
        />
        {fieldErrors.email?.[0] ? (
          <ThemedText type="small" themeColor="danger">
            {fieldErrors.email[0]}
          </ThemedText>
        ) : null}

        <TextInput
          accessibilityLabel="Senha"
          placeholder="Senha"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoComplete="current-password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={inputStyle}
        />
        {fieldErrors.password?.[0] ? (
          <ThemedText type="small" themeColor="danger">
            {fieldErrors.password[0]}
          </ThemedText>
        ) : null}

        {message ? (
          <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
            {message}
          </ThemedText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Entrar"
          accessibilityState={{ disabled: submitting }}
          disabled={submitting}
          onPress={submit}
          style={[styles.button, { backgroundColor: theme.text, opacity: submitting ? 0.6 : 1 }]}>
          <NativeText style={[styles.buttonText, { color: theme.background }]}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </NativeText>
        </Pressable>

        {__DEV__ && MOCK_ACTIVE ? (
          <ThemedText type="small" themeColor="textSecondary">
            Modo de teste: as contas de exemplo estão em src/api/mock.ts
          </ThemedText>
        ) : null}
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
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    minHeight: MinTouchTarget,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  button: {
    minHeight: MinTouchTarget,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
