import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';

import { Icon, TabBar, type IconName } from '@/design-system';
import { SideHeader } from '@/navigation/side-header';

// As abas abrem pelo início, e é para ele que o voltar do Android leva antes de fechar o app.
export const unstable_settings = { anchor: 'dashboard' };

// O mesmo ícone vai na aba e no cabeçalho da tela dela. As notificações saíram das abas: o
// contador delas está no sino do cabeçalho.
const TABS = {
  dashboard: { title: 'Pacientes', icon: { ios: 'person.2', android: 'group' } },
  agenda: { title: 'Agenda', icon: { ios: 'calendar', android: 'calendar_month' } },
  profile: { title: 'Perfil', icon: { ios: 'person', android: 'person' } },
} satisfies Record<string, { title: string; icon: IconName }>;

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Icon name={name} color={color} size={size} />;
  };
}

export default function PsychologistTabsLayout() {
  return <Tabs tabBar={(props) => <TabBar {...props} tone="psychologist" />} screenOptions={({ route }) => ({
    header: ({ options }) => <SideHeader tone="psychologist" title={options.title ?? ''} icon={TABS[route.name as keyof typeof TABS]?.icon} actions />,
  })}>
    <Tabs.Screen name="dashboard" options={{ title: TABS.dashboard.title, tabBarAccessibilityLabel: TABS.dashboard.title, tabBarIcon: tabIcon(TABS.dashboard.icon) }} />
    <Tabs.Screen name="agenda" options={{ title: TABS.agenda.title, tabBarAccessibilityLabel: TABS.agenda.title, tabBarIcon: tabIcon(TABS.agenda.icon) }} />
    <Tabs.Screen name="profile" options={{ title: TABS.profile.title, tabBarAccessibilityLabel: TABS.profile.title, tabBarIcon: tabIcon(TABS.profile.icon) }} />
  </Tabs>;
}
