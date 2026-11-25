import { Redirect, Stack, usePathname } from 'expo-router';
import { psychologistApi } from '@/api/psychologist';
import { Loading, RoleColors, Screen, Typography } from '@/design-system';
import { useSession } from '@/session/session-context';
import { AccessContext } from '@/psychologist/access';
import { accessDestination } from '@/psychologist/domain';
import { Action, ErrorNotice, useResource } from '@/psychologist/ui';

// Sem âncora, o grupo abre pela primeira rota em ordem alfabética, e não pelo início. O início
// mora nas abas, então a âncora é o grupo delas.
export const unstable_settings = { anchor: '(tabs)' };

// Texto sobre a cor do lado é sempre Dark: branco reprova o contraste (RNF-35).
const headerOptions = {
  headerStyle: { backgroundColor: RoleColors.psychologist.accent },
  headerTintColor: RoleColors.psychologist.onAccent,
  headerTitleStyle: { fontFamily: Typography.h5.fontFamily, fontSize: Typography.h5.fontSize, color: RoleColors.psychologist.onAccent },
};

// Portão: sem cabeçalho nem gesto de voltar, como a tela de login.
const gateOptions = { headerShown: false, gestureEnabled: false };

export default function PsychologistLayout() {
  const pathname = usePathname();
  const { signOut } = useSession();
  const access = useResource(async () => {
    const term = await psychologistApi.currentConsent();
    const profile = term.accepted ? await psychologistApi.profile() : null;
    return { term, profile };
  });
  if (access.loading) return <Screen center><Loading /></Screen>;
  if (access.error || !access.data) return <Screen center><ErrorNotice error={access.error} retry={access.reload} />
    <Action variant="secondary" label="Sair da conta" onPress={() => { void signOut(); }} /></Screen>;
  const { term, profile } = access.data;
  const target = accessDestination(term.accepted, profile?.approval_status ?? null, pathname);
  // O início mora no grupo das abas; os portões, direto no grupo do psicólogo.
  if (target) return <Redirect href={target === 'dashboard' ? '/(psychologist)/(tabs)/dashboard' : `/(psychologist)/${target}`} />;
  return <AccessContext.Provider value={{ term, profile, refresh: access.reload }}>
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="consent" options={gateOptions} />
      <Stack.Screen name="registration" options={gateOptions} />
      <Stack.Screen name="review" options={gateOptions} />
      <Stack.Screen name="requests" options={{ title: 'Solicitações de vínculo' }} />
      <Stack.Screen name="invitations" options={{ title: 'Convite para paciente' }} />
      <Stack.Screen name="patients/[id]" options={{ title: 'Prontuário' }} />
      <Stack.Screen name="patients/[id]/chat" options={{ title: 'Chat' }} />
    </Stack>
  </AccessContext.Provider>;
}
