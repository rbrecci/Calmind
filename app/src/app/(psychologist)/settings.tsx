import { useRouter } from 'expo-router';
import { psychologistApi } from '@/api/psychologist';
import { ListItem, Section, Skeleton } from '@/design-system';
import { AccountInfo } from '@/navigation/account-info';
import { usePsychologistAccess } from '@/psychologist/access';
import { Action, ErrorNotice, Page, useResource } from '@/psychologist/ui';
import { useSession } from '@/session/session-context';

// Conta: aberta pela engrenagem do cabeçalho, com os atalhos do consultório.
export default function PsychologistSettings() {
  const router = useRouter();
  const { name, signOut } = useSession();
  const { term } = usePsychologistAccess();
  const state = useResource(() => psychologistApi.profile());
  const bonds = state.data?.active_bonds;
  return <Page>
    {state.loading && !state.data ? <Skeleton /> : <>
      <ErrorNotice error={state.error} retry={state.reload} />
      <Section title="Minha conta">
        <ListItem tone="psychologist" icon="user" title="Meu perfil" description={name ?? undefined} onPress={() => router.navigate('/(psychologist)/profile')} />
        <ListItem tone="psychologist" icon="bell" title="Notificações" onPress={() => router.push('/(psychologist)/notifications')} />
      </Section>
      <Section title="Consultório">
        <ListItem tone="psychologist" icon="users" title="Meus pacientes" onPress={() => router.dismissTo('/(psychologist)/(tabs)/dashboard')}
          description={bonds === undefined ? undefined : `${bonds} ${bonds === 1 ? 'vínculo ativo' : 'vínculos ativos'}`} />
        <ListItem tone="psychologist" icon="user-plus" title="Solicitações" onPress={() => router.push('/(psychologist)/requests')} />
        <ListItem tone="psychologist" icon="key" title="Convite" description="Gerar código para um paciente" onPress={() => router.push('/(psychologist)/invitations')} />
        <ListItem tone="psychologist" icon="calendar" title="Agenda" onPress={() => router.dismissTo('/(psychologist)/(tabs)/agenda')} />
      </Section>
      <AccountInfo tone="psychologist" term={term.body} />
      <Action variant="secondary" icon="sign-out" label="Sair da conta" onPress={() => { void signOut(); }} />
    </>}
  </Page>;
}
