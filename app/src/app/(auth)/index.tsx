import { Redirect } from 'expo-router';
import { useState } from 'react';

import { ApiError, type FieldErrors } from '@/api';
import { Button, Screen, Text, TextField } from '@/design-system';
import { useSession } from '@/session/session-context';

const MOCK_ACTIVE = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// Tela provisória de login: o visual definitivo (telas 01 a 03 do protótipo) substitui este.
// O que fica é o fluxo: signIn chama a API, e o papel vem do /me.
export default function EntryScreen() {
  const { role, signIn } = useSession();

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

  return (
    <Screen scroll>
      <Text variant="h1">Calmind</Text>

      <TextField
        label="E-mail"
        placeholder="voce@exemplo.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email?.[0]}
      />

      <TextField
        label="Senha"
        placeholder="Sua senha"
        autoCapitalize="none"
        autoComplete="current-password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password?.[0]}
      />

      {message ? (
        <Text variant="small" color="error" accessibilityRole="alert">
          {message}
        </Text>
      ) : null}

      <Button
        label={submitting ? 'Entrando...' : 'Entrar'}
        accessibilityLabel="Entrar"
        disabled={submitting}
        onPress={submit}
      />

      {__DEV__ && MOCK_ACTIVE ? (
        <Text variant="small" color="textSecondary">
          Modo de teste: as contas de exemplo estão em src/api/mock.ts
        </Text>
      ) : null}
    </Screen>
  );
}
