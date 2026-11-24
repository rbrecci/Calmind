import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { ApiError } from '@/api';
import { Button, Colors, confirmationVariants, Radius, Screen, Spacing, Text, TextField, type ButtonVariant, type ConfirmationKind } from '@/design-system';
import type { TextFieldProps } from '@/design-system/text-field';
import { createResource, type ResourceState } from './resource';

// Tela empilhada já mostra o título no cabeçalho: repetir aqui seria dizer a mesma coisa duas vezes.
export function Page({ title, children }: { title?: string; children: ReactNode }) {
  return <Screen scroll>{title ? <Text variant="h3">{title}</Text> : null}{children}</Screen>;
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Action({ label, onPress, disabled = false, loading = false, variant, accessibilityLabel }: {
  label: string; onPress: () => void; disabled?: boolean; loading?: boolean; variant?: ButtonVariant; accessibilityLabel?: string;
}) {
  return <Button tone="psychologist" variant={variant} label={loading ? 'Aguarde...' : label}
    accessibilityLabel={accessibilityLabel ?? label} onPress={onPress} disabled={disabled || loading} />;
}

export function Field(props: TextFieldProps) {
  return <TextField accessibilityLabel={props.label} {...props} />;
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Não foi possível concluir a ação. Tente novamente.';
}

export function ErrorNotice({ error, retry }: { error: unknown; retry?: () => void }) {
  if (!error) return null;
  return <View style={styles.group}><Text color="error" accessibilityRole="alert">{errorMessage(error)}</Text>
    {retry ? <Action variant="secondary" label="Tentar de novo" onPress={retry} /> : null}</View>;
}

export function FieldErrorsDisplay({ error }: { error: unknown }) {
  if (!(error instanceof ApiError) || !error.errors) return null;
  return <View>{Object.entries(error.errors).map(([field, messages]) =>
    <Text key={field} color="error" accessibilityRole="alert">{messages.join(' ')}</Text>)}</View>;
}

export function useResource<T>(loader: () => Promise<T>, resourceKey?: string | number) {
  const loaderRef = useRef(loader);
  useEffect(() => { loaderRef.current = loader; });
  const resourceRef = useRef<ReturnType<typeof createResource<T>> | null>(null);
  const [state, setState] = useState<ResourceState<T>>({ data: null, error: null, loading: true });
  const reload = useCallback(() => resourceRef.current?.load(() => loaderRef.current()), []);
  useEffect(() => {
    const resource = createResource<T>(setState);
    resourceRef.current = resource;
    void resource.load(() => loaderRef.current());
    return () => { resource.dispose(); resourceRef.current = null; };
  }, [resourceKey]);
  return { ...state, reload };
}

export function useConfirmation() {
  const [pending, setPending] = useState<{ title: string; message: string; action: () => void; kind: ConfirmationKind } | null>(null);
  const ask = (title: string, message: string, action: () => void, kind: ConfirmationKind = 'default') =>
    setPending({ title, message, action, kind });
  const variants = confirmationVariants(pending?.kind);
  const confirmation = <Modal visible={pending !== null} transparent animationType="fade"
    onRequestClose={() => setPending(null)}>
    <View style={styles.modal}><View style={styles.dialog} accessibilityViewIsModal>
      <Text variant="h4">{pending?.title}</Text><Text>{pending?.message}</Text>
      <Action variant={variants.confirm} label="Confirmar" onPress={() => { const action = pending?.action; setPending(null); action?.(); }} />
      <Action variant={variants.cancel} label="Voltar" onPress={() => setPending(null)} />
    </View></View>
  </Modal>;
  return { ask, confirmation };
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  card: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.three, gap: Spacing.two },
  modal: { flex: 1, justifyContent: 'center', padding: Spacing.four, backgroundColor: Colors.surface },
  dialog: { padding: Spacing.four, backgroundColor: Colors.background, borderRadius: Radius.md, gap: Spacing.three },
});
