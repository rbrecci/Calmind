import { Redirect, Stack, usePathname } from 'expo-router';
import { psychologistApi } from '@/api/psychologist';
import { Loading, Screen, ScreenToneContext, type IconName } from '@/design-system';
import { SideHeader, UnreadNotificationsProvider } from '@/navigation/side-header';
import { useSession } from '@/session/session-context';
import { AccessContext } from '@/psychologist/access';
import { accessDestination } from '@/psychologist/domain';
import { Action, ErrorNotice, useResource } from '@/psychologist/ui';

// Sem âncora, o grupo abre pela primeira rota em ordem alfabética, e não pelo início. O início
// mora nas abas, então a âncora é o grupo delas.
export const unstable_settings = { anchor: '(tabs)' };

// Portão: sem cabeçalho nem gesto de voltar, como a tela de login.
const gateOptions = { headerShown: false, gestureEnabled: false };

// Telas empilhadas. `actions` põe sino e engrenagem no cabeçalho; formulário não tem, e as
// telas de notificações e de conta não apontam para si mesmas.
const SCREENS: Record<string, { title: string; icon: IconName; actions?: boolean }> = {
  requests: { title: 'Solicitações', icon: 'user-plus', actions: true },
  'patients/[id]': { title: 'Prontuário', icon: 'article', actions: true },
  'patients/[id]/chat': { title: 'Chat', icon: 'chat', actions: true },
  notifications: { title: 'Notificações', icon: 'bell' },
  settings: { title: 'Conta', icon: 'gear' },
  profile: { title: 'Perfil', icon: 'user' },
  invitations: { title: 'Convite', icon: 'key' },
};

const loadUnread = () => psychologistApi.notifications({ unread: 1, per_page: 1 }).then((page) => page.meta.total);

function PsychologistNavigator() {
  const pathname = usePathname();
  const { signOut } = useSession();
  const access = useResource(async () => {
    const term = await psychologistApi.currentConsent();
    const profile = term.accepted ? await psychologistApi.profile() : null;
    return { term, profile };
  });
  // So na primeira carga. Numa atualizacao (Atualizar, salvar o perfil) a navegacao continua montada:
  // desmontar e remontar deixa os parametros de rota sem consumir e as abas entram em laco.
  if (access.loading && !access.data) return <Screen center><Loading /></Screen>;
  if (access.error || !access.data) return <Screen center><ErrorNotice error={access.error} retry={access.reload} />
    <Action variant="secondary" label="Sair da conta" onPress={() => { void signOut(); }} /></Screen>;
  const { term, profile } = access.data;
  const target = accessDestination(term.accepted, profile?.approval_status ?? null, pathname);
  // O início mora no grupo das abas; os portões, direto no grupo do psicólogo.
  if (target) return <Redirect href={target === 'dashboard' ? '/(psychologist)/(tabs)/dashboard' : `/(psychologist)/${target}`} />;
  // O sino só busca depois dos portões: antes do aceite e da aprovação não há cabeçalho.
  const released = accessDestination(term.accepted, profile?.approval_status ?? null, '/dashboard') === null;
  return <AccessContext.Provider value={{ term, profile, refresh: access.reload }}>
    <UnreadNotificationsProvider load={loadUnread} enabled={released}>
      <Stack screenOptions={{
        animation: 'none',
        header: ({ navigation, route, options, back }) => <SideHeader tone="psychologist" title={options.title ?? ''}
          icon={SCREENS[route.name]?.icon} actions={SCREENS[route.name]?.actions}
          onBack={back ? () => navigation.goBack() : undefined} />,
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="consent" options={gateOptions} />
        <Stack.Screen name="registration" options={gateOptions} />
        <Stack.Screen name="review" options={gateOptions} />
        {Object.entries(SCREENS).map(([name, { title }]) => <Stack.Screen key={name} name={name} options={{ title }} />)}
      </Stack>
    </UnreadNotificationsProvider>
  </AccessContext.Provider>;
}

export default function PsychologistLayout() {
  return <ScreenToneContext value="psychologist"><PsychologistNavigator /></ScreenToneContext>;
}
