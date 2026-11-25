import { useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { Appear, Button, Colors, confirmationVariants, Loading, Radius, Screen, Spacing, Text, type ConfirmationKind } from '@/design-system';

// Tela empilhada já mostra o título no cabeçalho: repetir aqui seria dizer a mesma coisa duas vezes.
export function PatientPage({ title, children, onRefresh, footer, stickToEnd }: {
  title?: string; children: ReactNode; onRefresh?: () => Promise<void>; footer?: ReactNode; stickToEnd?: boolean;
}) {
  // O indicador acompanha só o gesto: o recarregamento de quando a aba ganha foco já aparece no
  // "Carregando..." e não precisa de um segundo aviso no topo.
  const [refreshing, setRefreshing] = useState(false);
  const refresh = onRefresh ? () => {
    setRefreshing(true);
    void onRefresh().finally(() => setRefreshing(false));
  } : undefined;
  return <Screen scroll refreshing={refreshing} onRefresh={refresh} footer={footer} stickToEnd={stickToEnd}>
    {title ? <Text variant="h4">{title}</Text> : null}
    {children}
  </Screen>;
}

export function Card({ children }: { children: ReactNode }) {
  return <Appear style={styles.card}>{children}</Appear>;
}

// `initial`: ainda não há nada da tela para mostrar, e o carregando ocupa o lugar do conteúdo.
// No recarregamento o conteúdo antigo continua na tela, e o aviso fica em texto para não empurrá-lo.
export function Feedback({ loading, error, retry, initial = false }: {
  loading: boolean; error: string | null; retry: () => void; initial?: boolean;
}) {
  return <>
    {loading ? initial ? <Loading /> : <Text accessibilityLiveRegion="polite">Carregando...</Text> : null}
    {error ? <><Text color="error" accessibilityRole="alert">{error}</Text>
      <Button tone="patient" variant="secondary" label="Tentar de novo" onPress={retry} disabled={loading} /></> : null}
  </>;
}

export function Confirmation({ message, confirm, cancel, busy = false, kind }: {
  message: string; confirm: () => void; cancel: () => void; busy?: boolean; kind?: ConfirmationKind;
}) {
  const variants = confirmationVariants(kind);
  return <Card>
    <Text accessibilityRole="alert" accessibilityLiveRegion="polite">{message}</Text>
    <Button tone="patient" variant={variants.confirm} label={busy ? 'Aguarde...' : 'Confirmar'} disabled={busy} onPress={confirm} />
    <Button tone="patient" variant={variants.cancel} label="Cancelar" disabled={busy} onPress={cancel} />
  </Card>;
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, gap: Spacing.two, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md },
});
