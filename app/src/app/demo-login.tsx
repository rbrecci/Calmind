import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { demoCredentials, demoEnv } from '@/auth/demo-accounts';
import { authErrorMessage } from '@/auth/register-form';
import { Screen, Text } from '@/design-system';
import { useSession } from '@/session/session-context';

// Atalho de APK de teste: calmind://demo-login?as=<chave> troca de conta sem digitar.
export default function DemoLoginScreen() {
  const { as: key } = useLocalSearchParams<{ as?: string }>();
  const { role, signIn, signOut } = useSession();
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // O papel muda no meio do fluxo (signOut zera, signIn preenche) e reexecutaria o efeito;
  // a chave já tratada impede um segundo login com a mesma URL.
  const handledKey = useRef<string | null | undefined>(null);
  const credentials = demoCredentials(demoEnv, key);

  useEffect(() => {
    const target = demoCredentials(demoEnv, key);
    if (!target || handledKey.current === key) return;
    handledKey.current = key;
    (async () => {
      try {
        if (role !== null) await signOut();
        await signIn(target);
        setDone(true);
      } catch (error) {
        setMessage(authErrorMessage('login', error));
      }
    })();
  }, [key, role, signIn, signOut]);

  // Com sessão, "/" (a tela de login) sai do navegador pelo Stack.Protected; por isso o destino
  // é o início de cada papel, como na tela de login.
  if (!credentials || done) {
    return <Redirect href={role === null ? '/' : role === 'patient' ? '/home' : '/dashboard'} />;
  }

  return (
    <Screen center>
      <Text variant="small" color={message ? 'error' : 'textSecondary'} accessibilityRole={message ? 'alert' : undefined}>
        {message ?? 'Entrando na conta de teste...'}
      </Text>
    </Screen>
  );
}
