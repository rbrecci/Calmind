import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from './icon';
import { Text } from './text';
import { Colors, MaxContentWidth, MinTouchTarget, Radius, Spacing } from './tokens';

export type SheetAction = { label: string; icon: IconName; onPress: () => void; destructive?: boolean };

// Folha que sobe do rodapé com as ações de um botão só, como o "editar" do perfil. Tocar fora ou
// no voltar do Android fecha.
export function ActionSheet({ visible, title, actions, onClose, children }: {
  visible: boolean; title: string; onClose: () => void; actions?: SheetAction[]; children?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} style={styles.backdrop} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.three }]} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text variant="h5" style={styles.title}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} style={styles.close}>
              <Icon name="x" />
            </Pressable>
          </View>
          {actions?.map((action) => (
            <Pressable key={action.label} accessibilityRole="button" accessibilityLabel={action.label}
              onPress={() => { onClose(); action.onPress(); }}
              style={({ pressed }) => [styles.action, pressed && { backgroundColor: Colors.surface }]}>
              <Icon name={action.icon} color={action.destructive ? Colors.error : Colors.text} />
              <Text color={action.destructive ? 'error' : 'text'}>{action.label}</Text>
            </Pressable>
          ))}
          {children ? <ScrollView style={styles.scroll} contentContainerStyle={styles.body}>{children}</ScrollView> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  sheet: {
    width: '100%', maxWidth: MaxContentWidth, maxHeight: '85%', gap: Spacing.one, padding: Spacing.three,
    borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, backgroundColor: Colors.background,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1 },
  close: { width: MinTouchTarget, height: MinTouchTarget, alignItems: 'center', justifyContent: 'center' },
  action: { minHeight: MinTouchTarget + Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.two, borderRadius: Radius.md },
  scroll: { flexGrow: 0 },
  body: { gap: Spacing.three, paddingBottom: Spacing.two },
});
