import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './text';
import { ButtonVariants, Colors, MinTouchTarget, Radius, RoleColors, Spacing } from './tokens';

export type ChoiceOption<T> = { value: T; label: string };

// `chips`: chips soltos, a escolhida cheia na cor do lado (modalidade da agenda).
// `segmented`: duas ou três opções coladas num trilho cinza, como "Compartilhado | Só para mim".
// `tabs`: chips em pílula que trocam o conteúdo da tela, como as abas do prontuário. O rótulo
// não aparece (as opções já dizem o que são) e vira o nome do grupo para o leitor de tela.
export type ChoiceGroupVariant = 'chips' | 'segmented' | 'tabs';

export type ChoiceGroupProps<T extends string | number | null> = {
  label: string;
  options: readonly ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  tone: 'patient' | 'psychologist';
  disabled?: boolean;
  variant?: ChoiceGroupVariant;
};

// Escolha de uma opção entre poucas. A escolhida é cheia na cor do lado, então o estado se vê
// sem ler texto. Texto sobre a cor é o onAccent (RNF-35).
export function ChoiceGroup<T extends string | number | null>({
  label,
  options,
  value,
  onChange,
  tone,
  disabled = false,
  variant = 'chips',
}: ChoiceGroupProps<T>) {
  const tabs = variant === 'tabs';
  const segmented = variant === 'segmented';
  return (
    <View style={styles.container}>
      {tabs ? null : <Text variant="small">{label}</Text>}
      <View accessibilityRole={tabs ? 'tablist' : 'radiogroup'} accessibilityLabel={label}
        style={segmented ? styles.track : styles.options}>
        {options.map((option) => {
          const checked = option.value === value;
          const colors = disabled
            ? { background: checked ? Colors.disabled : Colors.background, border: Colors.disabled, text: Colors.onDisabled }
            : checked
              ? { background: RoleColors[tone].accent, border: RoleColors[tone].accent, text: RoleColors[tone].onAccent }
              // No trilho cinza a opção solta não tem borda, e o texto de apoio passa sobre ele.
              : segmented
                ? { background: Colors.surface, border: Colors.surface, text: Colors.textSecondary }
                : { background: ButtonVariants.secondary.background, border: ButtonVariants.secondary.border, text: ButtonVariants.secondary.text };
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole={tabs ? 'tab' : 'radio'}
              accessibilityLabel={option.label}
              accessibilityState={tabs ? { selected: checked, disabled } : { checked, disabled }}
              aria-checked={tabs ? undefined : checked}
              aria-selected={tabs ? checked : undefined}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={[styles.option, tabs && styles.pill, segmented && styles.segment,
                { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={{ color: colors.text }}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  option: {
    minHeight: MinTouchTarget, // RNF-35
    // Com 16 de cada lado, as três modalidades da agenda quebravam linha num cartão de celular.
    paddingHorizontal: Spacing.two + Spacing.one,
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: Radius.md,
  },
  pill: {
    borderWidth: 1,
    borderRadius: MinTouchTarget / 2,
    paddingHorizontal: Spacing.three,
  },
  track: {
    flexDirection: 'row',
    padding: Spacing.one,
    gap: Spacing.one,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    borderRadius: Radius.md - Spacing.one,
  },
});
