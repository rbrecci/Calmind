import { Redirect, Stack, usePathname } from 'expo-router';

import { Button, Screen, Text } from '@/design-system';
import { ConsentProvider, useConsent } from '@/patient/consent-context';
import { decideConsentGate } from '@/patient/consent-gate';
import { useSession } from '@/session/session-context';

function ConsentNavigator() {
  const { state, reload } = useConsent();
  const { signOut } = useSession();
  const pathname = usePathname();
  const gate = decideConsentGate(state);
  if (gate === 'loading') return <Screen><Text>Carregando termo de uso...</Text></Screen>;
  if (gate === 'error') return <Screen>
    <Text accessibilityRole="alert" color="error">{state.status === 'error' ? state.message : ''}</Text>
    <Button tone="patient" label="Tentar de novo" onPress={() => void reload()} />
    <Button tone="patient" label="Sair da conta" onPress={() => void signOut()} />
  </Screen>;
  if (gate === 'consent' && pathname !== '/consent') return <Redirect href="/consent" />;
  if (gate === 'allow' && pathname === '/consent') return <Redirect href="/home" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function PatientLayout() {
  return <ConsentProvider><ConsentNavigator /></ConsentProvider>;
}
