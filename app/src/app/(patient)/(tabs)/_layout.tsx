import { usePathname } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import type { ColorValue } from 'react-native';

import { patientApi } from '@/api/patient';
import { formatUnread, Icon, TabBar, tabBadge, type IconName } from '@/design-system';
import { SideHeader } from '@/navigation/side-header';
import { unreadMessages } from '@/patient/bonds';
import { loadPatientPages } from '@/patient/load-pages';

// As abas abrem pelo início, e é para ele que o voltar do Android leva antes de fechar o app.
export const unstable_settings = { anchor: 'home' };

// O mesmo ícone vai na aba e no cabeçalho da tela dela.
const TABS = {
  home: { title: 'Início', icon: 'house' },
  reports: { title: 'Relatos', icon: 'article' },
  tasks: { title: 'Tarefas', icon: 'list-checks' },
  chat: { title: 'Conversa', icon: 'chat' },
} satisfies Record<string, { title: string; icon: IconName }>;

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Icon name={name} color={color} size={size} />;
  };
}

export default function PatientTabsLayout() {
  const pathname = usePathname();
  const [unread, setUnread] = useState<number>();
  // Busca de novo a cada troca de tela, inclusive ao voltar de uma tela empilhada: assim o
  // contador acompanha o que foi lido sem canal próprio. Falha só mantém o último número,
  // porque a barra de abas não é lugar de mensagem de erro.
  useEffect(() => {
    let current = true;
    loadPatientPages(patientApi.bonds).then((bonds) => { if (current) setUnread(unreadMessages(bonds)); }, () => {});
    return () => { current = false; };
  }, [pathname]);
  return <Tabs tabBar={(props) => <TabBar {...props} tone="patient" />} screenOptions={({ route }) => ({
    animation: 'none',
    headerShown: route.name !== 'home',
    // O início tem o bloco de destaque colado ao cabeçalho, que ali fica com a base reta.
    header: ({ options }) => <SideHeader tone="patient" title={options.title ?? ''} icon={TABS[route.name as keyof typeof TABS]?.icon} actions
      />,
  })}>
    <Tabs.Screen name="home" options={{ title: TABS.home.title, tabBarAccessibilityLabel: TABS.home.title, tabBarIcon: tabIcon(TABS.home.icon) }} />
    <Tabs.Screen name="reports" options={{ title: TABS.reports.title, tabBarAccessibilityLabel: TABS.reports.title, tabBarIcon: tabIcon(TABS.reports.icon) }} />
    <Tabs.Screen name="tasks" options={{ title: TABS.tasks.title, tabBarAccessibilityLabel: TABS.tasks.title, tabBarIcon: tabIcon(TABS.tasks.icon) }} />
    {/* A conversa troca o título do cabeçalho pelo nome da profissional; o rótulo da aba fica fixo. */}
    <Tabs.Screen name="chat" options={{
      title: TABS.chat.title, tabBarLabel: TABS.chat.title, tabBarIcon: tabIcon(TABS.chat.icon),
      tabBarBadge: tabBadge(unread, pathname === '/chat'),
      tabBarAccessibilityLabel: unread ? `Conversa, ${formatUnread(unread)}` : 'Conversa',
    }} />
  </Tabs>;
}
