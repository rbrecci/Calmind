import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ApiError } from '@/api';
import { Appear, Button, Colors, confirmationVariants, Radius, Screen, Spacing, Text, TextField, type ButtonVariant, type ConfirmationKind, type IconName } from '@/design-system';
import type { TextFieldProps } from '@/design-system/text-field';
import { createResource, type ResourceState } from './resource';

// O título fica no cabeçalho, nas abas e nas telas empilhadas: repetir aqui seria dizer a mesma coisa duas vezes.
export function Page({ children, footer, stickToEnd, onRefresh }: {
  children: ReactNode; footer?: ReactNode; stickToEnd?: boolean; onRefresh?: () => Promise<void>;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const refresh = onRefresh ? () => {
    setRefreshing(true);
    void onRefresh().finally(() => setRefreshing(false));
  } : undefined;
  return <Screen scroll footer={footer} stickToEnd={stickToEnd} refreshing={refreshing} onRefresh={refresh}>{children}</Screen>;
}

export function Card({ children }: { children: ReactNode }) {
  return <Appear style={styles.card}>{children}</Appear>;
}

export function Action({ label, onPress, disabled = false, loading = false, variant, accessibilityLabel, style, icon }: {
  icon?: IconName; label: string; onPress: () => void; disabled?: boolean; loading?: boolean; variant?: ButtonVariant; accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return <Button tone="psychologist" variant={variant} icon={icon} label={loading ? 'Aguarde...' : label}
    accessibilityLabel={accessibilityLabel ?? label} onPress={onPress} disabled={disabled || loading} style={style} />;
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
    {retry ? <Action variant="secondary" icon="arrow-clockwise" label="Tentar de novo" onPress={retry} /> : null}</View>;
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
      <Action variant={variants.confirm} icon="check" label="Confirmar" onPress={() => { const action = pending?.action; setPending(null); action?.(); }} />
      <Action variant={variants.cancel} icon="caret-left" label="Voltar" onPress={() => setPending(null)} />
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
