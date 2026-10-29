import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Colors, MinTouchTarget, Radius, Screen, Spacing, Text } from '@/design-system';

export function PatientPage({ title, children, home = false }: { title: string; children: ReactNode; home?: boolean }) {
  const router = useRouter();
  return <Screen scroll>
    <Text variant="small" color="textSecondary">Calmind · Paciente</Text>
    {!home ? <TextAction label="Voltar ao início" onPress={() => router.dismissTo('/home')} /> : null}
    <Text variant="h4">{title}</Text>
    {children}
  </Screen>;
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function TextAction({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress} style={styles.action}>
    <Text color={disabled ? 'textSecondary' : 'text'}>{label}</Text>
  </Pressable>;
}

export function Feedback({ loading, error, retry }: { loading: boolean; error: string | null; retry: () => void }) {
  return <>
    {loading ? <Text accessibilityLiveRegion="polite">Carregando...</Text> : null}
    {error ? <><Text color="error" accessibilityRole="alert">{error}</Text>
      <Button tone="patient" label="Tentar de novo" onPress={retry} disabled={loading} /></> : null}
  </>;
}

export function Confirmation({ message, confirm, cancel, busy = false }: {
  message: string; confirm: () => void; cancel: () => void; busy?: boolean;
}) {
  return <Card>
    <Text accessibilityRole="alert" accessibilityLiveRegion="polite">{message}</Text>
    <Button tone="patient" label={busy ? 'Aguarde...' : 'Confirmar'} disabled={busy} onPress={confirm} />
    <TextAction label="Cancelar" disabled={busy} onPress={cancel} />
  </Card>;
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, gap: Spacing.two, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md },
  action: { minHeight: MinTouchTarget, justifyContent: 'center', paddingVertical: Spacing.two },
});
