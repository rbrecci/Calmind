import { Pressable, StyleSheet, Text as NativeText, View } from 'react-native';

import { Text } from './text';
import { Colors, MinTouchTarget, MoodColors, Radius, Spacing } from './tokens';

export type Mood = 'bad' | 'neutral' | 'good';

export const MoodIcons: Record<Mood, string> = { bad: '😞', neutral: '😐', good: '😄' };
export const MoodLabels: Record<Mood, string> = { bad: 'Ruim', neutral: 'Neutro', good: 'Bom' };
const MOODS: Mood[] = ['bad', 'neutral', 'good'];

// "Como está sendo seu dia hoje?": três rostos grandes. O escolhido ganha o fundo da cor com que o
// dia aparece no calendário, e a borda Dark, que mostra a escolha sem depender da cor.
export function MoodPicker({ value, onChange, disabled = false }: {
  value: Mood | null; onChange: (mood: Mood) => void; disabled?: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text variant="h5" style={styles.title}>Como está sendo seu dia hoje?</Text>
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Humor de hoje">
        {MOODS.map((mood) => {
          const checked = value === mood;
          return (
            <Pressable key={mood} accessibilityRole="radio" accessibilityLabel={MoodLabels[mood]}
              accessibilityState={{ checked, disabled }} aria-checked={checked} disabled={disabled}
              onPress={() => onChange(mood)}
              style={({ pressed }) => [styles.option, checked && { backgroundColor: MoodColors[mood], borderColor: Colors.text },
                (pressed || disabled) && styles.dim]}>
              <NativeText style={styles.face} accessible={false}>{MoodIcons[mood]}</NativeText>
              <Text variant="small">{MoodLabels[mood]}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text variant="small" color="textSecondary" style={styles.title}>Seu profissional vê o humor marcado no calendário.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two, padding: Spacing.three, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.background },
  title: { textAlign: 'center' },
  row: { flexDirection: 'row', gap: Spacing.two },
  option: {
    flex: 1, minHeight: MinTouchTarget, alignItems: 'center', gap: Spacing.half, paddingVertical: Spacing.two,
    borderWidth: 2, borderColor: Colors.border, borderRadius: Radius.md,
  },
  dim: { opacity: 0.6 },
  face: { fontSize: 32, lineHeight: 42 },
});
