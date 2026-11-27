import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from './icon';
import { Text } from './text';
import { Colors, MinTouchTarget, Spacing } from './tokens';

const BACK: IconName = 'caret-left';

export type BackHeaderProps = {
  title: string;
  onBack: () => void;
  backLabel?: string;
};

// Topo das etapas anteriores ao login que voltam para a anterior (escolha de perfil, cadastro):
// seta e título numa linha, sem a barra colorida, que é só de depois do login.
export function BackHeader({ title, onBack, backLabel = 'Voltar' }: BackHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack} hitSlop={4}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <Icon name={BACK} size={20} />
      </Pressable>
      <Text variant="h5" style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  // A seta fica rente à margem do texto, e o alvo de 44 avança sobre o respiro da tela.
  back: {
    width: MinTouchTarget, // RNF-35
    height: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.three,
  },
  pressed: {
    opacity: 0.6,
  },
  title: {
    flex: 1,
  },
});
