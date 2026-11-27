import { usePathname, useRouter } from 'expo-router';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { imageHeaders } from '@/api';
import { AppHeader, type IconName } from '@/design-system';
import { useSession } from '@/session/session-context';

type Side = 'patient' | 'psychologist';

// Os grupos não entram na URL, mas os dois lados têm "/notifications" e "/settings": o grupo
// no caminho deixa claro de qual lado é a tela.
const ROUTES = {
  patient: { notifications: '/(patient)/notifications', settings: '/(patient)/settings', profile: '/(patient)/profile' },
  psychologist: { notifications: '/(psychologist)/notifications', settings: '/(psychologist)/settings', profile: '/(psychologist)/profile' },
} as const;

const UnreadNotificationsContext = createContext<number | undefined>(undefined);

// Contagem do sino. Fica no layout do lado, acima das abas e das telas empilhadas, para uma busca
// só servir a todos os cabeçalhos. Busca de novo a cada troca de tela, inclusive ao voltar da
// lista de notificações: assim o número acompanha o que foi lido sem canal próprio. Falha só
// mantém o último número, porque o cabeçalho não é lugar de mensagem de erro.
export function UnreadNotificationsProvider({ load, enabled, children }: {
  load: () => Promise<number>; enabled: boolean; children: ReactNode;
}) {
  const pathname = usePathname();
  const [count, setCount] = useState<number>();
  useEffect(() => {
    if (!enabled) return;
    let current = true;
    load().then((total) => { if (current) setCount(total); }, () => {});
    return () => { current = false; };
  }, [pathname, load, enabled]);
  return <UnreadNotificationsContext value={count}>{children}</UnreadNotificationsContext>;
}

// Cabeçalho de um lado ligado ao roteador e à sessão. Tela raiz de aba: avatar de quem está
// logado à esquerda, com a foto quando houver. Tela empilhada: seta de voltar. `actions` põe o
// sino e a engrenagem, que ficam fora dos formulários e das próprias telas de notificações e de
// conta. `flush` deixa a base reta, para o bloco de destaque do início continuar a cor.
export function SideHeader({ tone, title, icon, onBack, actions = false, flush = false, collapseProgress }: {
  tone: Side; title: string; icon?: IconName; onBack?: () => void; actions?: boolean; flush?: boolean; collapseProgress?: number;
}) {
  const router = useRouter();
  const count = useContext(UnreadNotificationsContext);
  const { name, avatarUrl } = useSession();
  const routes = ROUTES[tone];
  const profile = routes.profile;
  return <AppHeader tone={tone} title={title} icon={icon} onBack={onBack} flush={flush} collapseProgress={collapseProgress}
    avatar={!onBack && name ? {
      name, uri: avatarUrl, headers: avatarUrl ? imageHeaders() : undefined,
      onPress: () => router.navigate(profile), accessibilityLabel: 'Meu perfil',
    } : undefined}
    notifications={actions ? { count, onPress: () => router.push(routes.notifications) } : undefined}
    onSettings={actions ? () => router.push(routes.settings) : undefined} />;
}
