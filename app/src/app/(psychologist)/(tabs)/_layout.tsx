import { usePathname } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useEffect, useState } from 'react';
import type { ColorValue } from 'react-native';

import { psychologistApi } from '@/api/psychologist';
import { Colors, formatUnread, RoleColors, tabBadge, Typography } from '@/design-system';

// As abas abrem pelo início, e é para ele que o voltar do Android leva antes de fechar o app.
export const unstable_settings = { anchor: 'dashboard' };

// No Android e na web o expo-symbols desenha o ícone com a fonte Material Symbols.
function tabIcon({ ios, android }: { ios: SFSymbol; android: AndroidSymbol }) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <SymbolView name={{ ios, android, web: android }} tintColor={color} size={size} />;
  };
}

export default function PsychologistTabsLayout() {
  const pathname = usePathname();
  const [unread, setUnread] = useState<number>();
  // Busca de novo a cada troca de tela, inclusive ao voltar de uma tela empilhada: assim o
  // contador acompanha o que foi lido sem canal próprio. Falha só mantém o último número,
  // porque a barra de abas não é lugar de mensagem de erro.
  useEffect(() => {
    let current = true;
    psychologistApi.notifications({ unread: 1, per_page: 1 }).then((page) => { if (current) setUnread(page.meta.total); }, () => {});
    return () => { current = false; };
  }, [pathname]);
  // A aba ativa ganha o fundo rosa do lado com texto Dark; rosa sobre branco reprovaria o
  // contraste do rótulo (RNF-35). O rótulo fica no degrau small, que é o piso de 14 (RNF-34).
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveBackgroundColor: RoleColors.psychologist.accent,
    tabBarActiveTintColor: RoleColors.psychologist.onAccent,
    tabBarInactiveTintColor: Colors.textSecondary,
    tabBarLabelStyle: { fontFamily: Typography.small.fontFamily, fontSize: Typography.small.fontSize },
    tabBarStyle: { backgroundColor: Colors.background, borderTopColor: Colors.border },
    // O contador padrão é vermelho com texto branco, que reprova o contraste; vai na cor do lado.
    tabBarBadgeStyle: { backgroundColor: RoleColors.psychologist.accent, color: RoleColors.psychologist.onAccent },
  }}>
    <Tabs.Screen name="dashboard" options={{ title: 'Início', tabBarIcon: tabIcon({ ios: 'house.fill', android: 'home' }) }} />
    <Tabs.Screen name="agenda" options={{ title: 'Agenda', tabBarIcon: tabIcon({ ios: 'calendar', android: 'calendar_month' }) }} />
    <Tabs.Screen name="notifications" options={{
      title: 'Notificações', tabBarIcon: tabIcon({ ios: 'bell.fill', android: 'notifications' }),
      tabBarBadge: tabBadge(unread, pathname === '/notifications'),
      tabBarAccessibilityLabel: unread ? `Notificações, ${formatUnread(unread)}` : undefined,
    }} />
    <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: tabIcon({ ios: 'person.crop.circle', android: 'person' }) }} />
  </Tabs>;
}
