import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { SessionProvider, useSession } from '@/session/session-context';

// Cada papel vê só a sua árvore de telas: paciente e psicólogo são o mesmo app,
// escolhido pelo papel, não telas com `if` no meio.
function RootNavigator() {
  const { role } = useSession();

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

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </ThemeProvider>
  );
}
