import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { HeaderShownContext } from 'expo-router/react-navigation';

// Raiz de aba que desenha o próprio cabeçalho (o início dos dois lados, quando não tem o destaque).
// Ligar e desligar o cabeçalho do navegador de dentro da tela mudaria as opções das abas a cada
// renderização, e esse tipo de laço ("Maximum update depth") derruba o app na build de release.
export function TabRoot({ header, children }: { header: ReactNode; children: ReactNode }) {
  return <View style={styles.root}>
    {header}
    {/* O cabeçalho já cobre a barra de status: a tela abaixo não soma a área segura de novo. */}
    <HeaderShownContext.Provider value={true}>{children}</HeaderShownContext.Provider>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
