import { Redirect, Stack, usePathname } from 'expo-router';
import { psychologistApi } from '@/api/psychologist';
import { Screen, Text } from '@/design-system';
import { useSession } from '@/session/session-context';
import { AccessContext } from '@/psychologist/access';
import { accessDestination } from '@/psychologist/domain';
import { Action, ErrorNotice, useResource } from '@/psychologist/ui';

export default function PsychologistLayout() {
  const pathname = usePathname();
  const { signOut } = useSession();
  const access = useResource(async () => {
    const term = await psychologistApi.currentConsent();
    const profile = term.accepted ? await psychologistApi.profile() : null;
    return { term, profile };
  });
  if (access.loading) return <Screen><Text accessibilityLiveRegion="polite">Carregando seu acesso...</Text></Screen>;
  if (access.error || !access.data) return <Screen><ErrorNotice error={access.error} retry={access.reload} />
    <Action label="Sair da conta" onPress={() => { void signOut(); }} /></Screen>;
  const { term, profile } = access.data;
  const target = accessDestination(term.accepted, profile?.approval_status ?? null, pathname);
  if (target) return <Redirect href={`/(psychologist)/${target}`} />;
  return <AccessContext.Provider value={{ term, profile, refresh: access.reload }}>
    <Stack screenOptions={{ headerShown: false }} />
  </AccessContext.Provider>;
}
