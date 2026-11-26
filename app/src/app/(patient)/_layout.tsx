import { Redirect, Stack, usePathname } from 'expo-router';

import { patientApi } from '@/api/patient';
import { Button, Loading, Screen, ScreenToneContext, Text, type IconName } from '@/design-system';
import { SideHeader, UnreadNotificationsProvider } from '@/navigation/side-header';
import { ConsentProvider, useConsent } from '@/patient/consent-context';
import { decideConsentGate } from '@/patient/consent-gate';
import { useSession } from '@/session/session-context';

// Sem âncora, o grupo abre pela primeira rota em ordem alfabética, e não pelo início. O início
// mora nas abas, então a âncora é o grupo delas.
export const unstable_settings = { anchor: '(tabs)' };

// Telas empilhadas. `actions` põe sino e engrenagem no cabeçalho; formulário não tem, e as
// telas de notificações e de conta não apontam para si mesmas.
const SCREENS: Record<string, { title: string; icon: IconName; actions?: boolean }> = {
  agenda: { title: 'Agenda', icon: { ios: 'calendar', android: 'calendar_month' }, actions: true },
  catalog: { title: 'Profissionais', icon: { ios: 'magnifyingglass', android: 'search' }, actions: true },
  notifications: { title: 'Notificações', icon: { ios: 'bell', android: 'notifications' } },
  settings: { title: 'Conta', icon: { ios: 'gearshape', android: 'settings' } },
  profile: { title: 'Meu perfil', icon: { ios: 'person', android: 'person' } },
  'psychologist/[id]': { title: 'Perfil', icon: { ios: 'person', android: 'person' }, actions: true },
  invitation: { title: 'Convite', icon: { ios: 'key', android: 'key' } },
  'new-report': { title: 'Novo relato', icon: { ios: 'pencil', android: 'edit' } },
};

const loadUnread = () => patientApi.notifications({ unread: true, per_page: 1 }).then((page) => page.meta.total);

function ConsentNavigator() {
  const { state, reload } = useConsent();
  const { signOut } = useSession();
  const pathname = usePathname();
  const gate = decideConsentGate(state);
  if (gate === 'loading') return <Screen center><Loading /></Screen>;
  if (gate === 'error') return <Screen center>
    <Text accessibilityRole="alert" color="error">{state.status === 'error' ? state.message : ''}</Text>
    <Button tone="patient" variant="secondary" label="Tentar de novo" onPress={() => void reload()} />
    <Button tone="patient" variant="secondary" label="Sair da conta" onPress={() => void signOut()} />
  </Screen>;
  if (gate === 'consent' && pathname !== '/consent') return <Redirect href="/consent" />;
  if (gate === 'allow' && pathname === '/consent') return <Redirect href="/home" />;
  return <UnreadNotificationsProvider load={loadUnread} enabled={gate === 'allow'}>
    <Stack screenOptions={{
      header: ({ navigation, route, options, back }) => <SideHeader tone="patient" title={options.title ?? ''}
        icon={SCREENS[route.name]?.icon} actions={SCREENS[route.name]?.actions}
        onBack={back ? () => navigation.goBack() : undefined} />,
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Portão: sem cabeçalho nem gesto de voltar, como a tela de login. */}
      <Stack.Screen name="consent" options={{ headerShown: false, gestureEnabled: false }} />
      {Object.entries(SCREENS).map(([name, { title }]) => <Stack.Screen key={name} name={name} options={{ title }} />)}
    </Stack>
  </UnreadNotificationsProvider>;
}

export default function PatientLayout() {
  return <ScreenToneContext value="patient"><ConsentProvider><ConsentNavigator /></ConsentProvider></ScreenToneContext>;
}
