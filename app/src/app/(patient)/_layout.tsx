import { Redirect, Stack, usePathname } from 'expo-router';

import { Button, RoleColors, Screen, Text, Typography } from '@/design-system';
import { ConsentProvider, useConsent } from '@/patient/consent-context';
import { decideConsentGate } from '@/patient/consent-gate';
import { useSession } from '@/session/session-context';

// Sem âncora, o grupo abre pela primeira rota em ordem alfabética, e não pelo início. O início
// mora nas abas, então a âncora é o grupo delas.
export const unstable_settings = { anchor: '(tabs)' };

// Texto sobre a cor do lado é sempre Dark: branco reprova o contraste (RNF-35).
const headerOptions = {
  headerStyle: { backgroundColor: RoleColors.patient.accent },
  headerTintColor: RoleColors.patient.onAccent,
  headerTitleStyle: { fontFamily: Typography.h5.fontFamily, fontSize: Typography.h5.fontSize, color: RoleColors.patient.onAccent },
};

function ConsentNavigator() {
  const { state, reload } = useConsent();
  const { signOut } = useSession();
  const pathname = usePathname();
  const gate = decideConsentGate(state);
  if (gate === 'loading') return <Screen center><Text>Carregando termo de uso...</Text></Screen>;
  if (gate === 'error') return <Screen center>
    <Text accessibilityRole="alert" color="error">{state.status === 'error' ? state.message : ''}</Text>
    <Button tone="patient" variant="secondary" label="Tentar de novo" onPress={() => void reload()} />
    <Button tone="patient" variant="secondary" label="Sair da conta" onPress={() => void signOut()} />
  </Screen>;
  if (gate === 'consent' && pathname !== '/consent') return <Redirect href="/consent" />;
  if (gate === 'allow' && pathname === '/consent') return <Redirect href="/home" />;
  return <Stack screenOptions={headerOptions}>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    {/* Portão: sem cabeçalho nem gesto de voltar, como a tela de login. */}
    <Stack.Screen name="consent" options={{ headerShown: false, gestureEnabled: false }} />
    <Stack.Screen name="notifications" options={{ title: 'Notificações' }} />
    <Stack.Screen name="catalog" options={{ title: 'Encontrar profissional' }} />
    <Stack.Screen name="invitation" options={{ title: 'Código de convite' }} />
    <Stack.Screen name="new-report" options={{ title: 'Novo relato' }} />
  </Stack>;
}

export default function PatientLayout() {
  return <ConsentProvider><ConsentNavigator /></ConsentProvider>;
}
