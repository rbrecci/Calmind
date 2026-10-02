import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { Colors, Palette } from '@/design-system';
import { useDesignSystemFonts } from '@/design-system/fonts';
import { SessionProvider, useSession } from '@/session/session-context';

// A splash fica na tela até o app saber se há sessão guardada e ter as fontes carregadas; sem
// isso o login piscaria, ou o texto trocaria de fonte, no instante em que o app abre.
SplashScreen.preventAutoHideAsync();

// Cada papel vê só a sua árvore de telas: paciente e psicólogo são o mesmo app,
// escolhido pelo papel, não telas com `if` no meio.
function RootNavigator() {
  const { role, isLoading } = useSession();
  const fontsReady = useDesignSystemFonts();
  const ready = !isLoading && fontsReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={role === null}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'patient'}>
        <Stack.Screen name="(patient)" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'psychologist'}>
        <Stack.Screen name="(psychologist)" />
      </Stack.Protected>
    </Stack>
  );
}

// O app só tem tema claro. O fundo do navegador precisa ser o branco da identidade: o padrão
// do React Navigation é um cinza, que apareceria entre uma tela e outra.
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    primary: Palette.dark.base,
    border: Colors.border,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={navigationTheme}>
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </ThemeProvider>
  );
}
