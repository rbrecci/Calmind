import { usePathname } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useEffect, useState } from 'react';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

// A altura padrão da barra é 49, e o rótulo em 14 (lineHeight 21) perde a metade de baixo:
// 5 de respiro + ícone 28 + rótulo 21 + 5 dão 59. Com altura própria a barra não soma a área
// segura sozinha, só a usa de recuo por dentro, então ela entra na conta aqui.
const TAB_BAR_HEIGHT = 64;

export default function PatientTabsLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
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
    tabBarLabelStyle: { fontFamily: Typography.small.fontFamily, fontSize: Typography.small.fontSize, lineHeight: Typography.small.lineHeight },
    tabBarStyle: { backgroundColor: Colors.background, borderTopColor: Colors.border, height: TAB_BAR_HEIGHT + insets.bottom },
    // O contador padrão é vermelho com texto branco, que reprova o contraste; vai na cor do lado.
    tabBarBadgeStyle: { backgroundColor: RoleColors.patient.accent, color: RoleColors.patient.onAccent },
  }}>
    <Tabs.Screen name="home" options={{ title: 'Início', tabBarAccessibilityLabel: 'Início', tabBarIcon: tabIcon({ ios: 'house.fill', android: 'home' }) }} />
    <Tabs.Screen name="chat" options={{
      title: 'Conversa', tabBarIcon: tabIcon({ ios: 'bubble.left.and.bubble.right.fill', android: 'chat' }),
      tabBarBadge: tabBadge(unread, pathname === '/chat'),
      tabBarAccessibilityLabel: unread ? `Conversa, ${formatUnread(unread)}` : 'Conversa',
    }} />
    <Tabs.Screen name="tasks" options={{ title: 'Tarefas', tabBarAccessibilityLabel: 'Tarefas', tabBarIcon: tabIcon({ ios: 'checklist', android: 'checklist' }) }} />
    <Tabs.Screen name="agenda" options={{ title: 'Agenda', tabBarAccessibilityLabel: 'Agenda', tabBarIcon: tabIcon({ ios: 'calendar', android: 'calendar_month' }) }} />
    <Tabs.Screen name="reports" options={{ title: 'Relatos', tabBarAccessibilityLabel: 'Relatos', tabBarIcon: tabIcon({ ios: 'square.and.pencil', android: 'edit_note' }) }} />
  </Tabs>;
}
