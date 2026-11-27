import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from './icon';
import { StatusTag } from './status-tag';
import { Text } from './text';
import { ButtonVariants, Colors, MinTouchTarget, Radius, Spacing } from './tokens';

const CHECK: IconName = 'check';

export type CheckCardProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  // Etiqueta à direita, como "obrigatório".
  tag?: string;
  disabled?: boolean;
};

// Aceite em cartão tocável inteiro, como "Li e aceito o termo". Marcado, a caixa fica cheia em
// Dark com o visto branco e a borda do cartão engrossa em Dark, então o estado se vê sem ler texto.
export function CheckCard({ label, checked, onChange, tag, disabled = false }: CheckCardProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={tag ? `${label}, ${tag}` : label}
      accessibilityState={{ checked, disabled }}
      aria-checked={checked}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={[styles.card, checked ? styles.checkedCard : null]}>
      <View style={[styles.box, checked ? styles.checkedBox : null]}>
        {checked ? <Icon name={CHECK} size={18} color={Colors.background} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
      {tag ? <StatusTag kind="neutral" label={tag} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: MinTouchTarget, // RNF-35
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: ButtonVariants.secondary.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  // Borda Dark de 2 pontos: a marca de "escolhido" que não depende da cor de lado. O recuo
  // desconta o ponto a mais, para o conteúdo não pular ao marcar.
  checkedCard: {
    borderWidth: 2,
    borderColor: Colors.text,
    padding: Spacing.three - 1,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: ButtonVariants.secondary.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  label: {
    flex: 1,
  },
});
