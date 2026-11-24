import { usePathname } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useEffect, useState } from 'react';
import type { ColorValue } from 'react-native';

import { patientApi } from '@/api/patient';
import { Colors, formatUnread, RoleColors, tabBadge, Typography } from '@/design-system';
import { unreadMessages } from '@/patient/bonds';
import { loadPatientPages } from '@/patient/load-pages';

// As abas abrem pelo início, e é para ele que o voltar do Android leva antes de fechar o app.
export const unstable_settings = { anchor: 'home' };

// No Android e na web o expo-symbols desenha o ícone com a fonte Material Symbols.
function tabIcon({ ios, android }: { ios: SFSymbol; android: AndroidSymbol }) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <SymbolView name={{ ios, android, web: android }} tintColor={color} size={size} />;
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
  // A aba ativa ganha o fundo verde do lado com texto Dark; verde sobre branco reprovaria o
  // contraste do rótulo (RNF-35). O rótulo fica no degrau small, que é o piso de 14 (RNF-34).
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveBackgroundColor: RoleColors.patient.accent,
    tabBarActiveTintColor: RoleColors.patient.onAccent,
    tabBarInactiveTintColor: Colors.textSecondary,
    tabBarLabelStyle: { fontFamily: Typography.small.fontFamily, fontSize: Typography.small.fontSize },
    tabBarStyle: { backgroundColor: Colors.background, borderTopColor: Colors.border },
    // O contador padrão é vermelho com texto branco, que reprova o contraste; vai na cor do lado.
    tabBarBadgeStyle: { backgroundColor: RoleColors.patient.accent, color: RoleColors.patient.onAccent },
  }}>
    <Tabs.Screen name="home" options={{ title: 'Início', tabBarIcon: tabIcon({ ios: 'house.fill', android: 'home' }) }} />
    <Tabs.Screen name="chat" options={{
      title: 'Conversa', tabBarIcon: tabIcon({ ios: 'bubble.left.and.bubble.right.fill', android: 'chat' }),
      tabBarBadge: tabBadge(unread, pathname === '/chat'),
      tabBarAccessibilityLabel: unread ? `Conversa, ${formatUnread(unread)}` : undefined,
    }} />
    <Tabs.Screen name="tasks" options={{ title: 'Tarefas', tabBarIcon: tabIcon({ ios: 'checklist', android: 'checklist' }) }} />
    <Tabs.Screen name="agenda" options={{ title: 'Agenda', tabBarIcon: tabIcon({ ios: 'calendar', android: 'calendar_month' }) }} />
    <Tabs.Screen name="reports" options={{ title: 'Relatos', tabBarIcon: tabIcon({ ios: 'square.and.pencil', android: 'edit_note' }) }} />
  </Tabs>;
}
