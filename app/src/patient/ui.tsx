import { useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { Appear, Button, Colors, confirmationVariants, Radius, Screen, Skeleton, Spacing, Text, type ConfirmationKind, type SkeletonVariant } from '@/design-system';

// Tela empilhada já mostra o título no cabeçalho: repetir aqui seria dizer a mesma coisa duas vezes.
export function PatientPage({ title, children, onRefresh, footer, stickToEnd, onScrollOffset, scrollExtraSpace }: {
  title?: string; children: ReactNode; onRefresh?: () => Promise<void>; footer?: ReactNode; stickToEnd?: boolean;
  onScrollOffset?: (offset: number) => void; scrollExtraSpace?: number;
}) {
  // O indicador acompanha só o gesto: o recarregamento de quando a aba ganha foco já aparece no
  // indicador de rolagem, sem inserir aviso de texto no conteúdo.
  const [refreshing, setRefreshing] = useState(false);
  const refresh = onRefresh ? () => {
    setRefreshing(true);
    void onRefresh().finally(() => setRefreshing(false));
  } : undefined;
  return <Screen scroll refreshing={refreshing} onRefresh={refresh} footer={footer} stickToEnd={stickToEnd}
    onScrollOffset={onScrollOffset} scrollExtraSpace={scrollExtraSpace}>
    {title ? <Text variant="h4">{title}</Text> : null}
    {children}
  </Screen>;
}

export function Card({ children }: { children: ReactNode }) {
  return <Appear style={styles.card}>{children}</Appear>;
}

// `initial`: ainda não há nada da tela para mostrar, e o carregando ocupa o lugar do conteúdo.
// No recarregamento o conteúdo antigo continua na tela, e o aviso fica em texto para não empurrá-lo.
export function Feedback({ loading, error, retry, initial = false, skeleton = 'list' }: {
  loading: boolean; error: string | null; retry: () => void; initial?: boolean; skeleton?: SkeletonVariant;
}) {
  return <>
    {loading && initial ? <Skeleton variant={skeleton} /> : null}
    {error ? <><Text color="error" accessibilityRole="alert">{error}</Text>
      <Button tone="patient" variant="secondary" icon="arrow-clockwise" label="Tentar de novo" onPress={retry} disabled={loading} /></> : null}
  </>;
}

export function Confirmation({ message, confirm, cancel, busy = false, kind }: {
  message: string; confirm: () => void; cancel: () => void; busy?: boolean; kind?: ConfirmationKind;
}) {
  const variants = confirmationVariants(kind);
  return <Card>
    <Text accessibilityRole="alert" accessibilityLiveRegion="polite">{message}</Text>
    <Button tone="patient" variant={variants.confirm} icon="check" label={busy ? 'Aguarde...' : 'Confirmar'} disabled={busy} onPress={confirm} />
    <Button tone="patient" variant={variants.cancel} icon="x" label="Cancelar" disabled={busy} onPress={cancel} />
  </Card>;
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, gap: Spacing.two, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md },
});
