import { Pressable, StyleSheet, Text as NativeText, View } from 'react-native';

import { dayKey, formatDayKey, formatMonth, monthCells } from './calendar';
import { Icon } from './icon';
import { MoodIcons, MoodLabels, type Mood } from './mood';
import { Text } from './text';
import { Colors, MinTouchTarget, MoodColors, Radius, RoleColors, Spacing } from './tokens';

export type DayMark = { mood?: Mood; count?: number };

// Calendário de um mês. O fundo e o rosto da célula dizem o humor; o ponto embaixo diz que há
// relato. Tocar num dia o escolhe, e tocar de novo volta ao mês inteiro.
export function MonthCalendar({ tone, month, onMonthChange, selected, onSelect, marks }: {
  tone: 'patient' | 'psychologist';
  month: Date;
  onMonthChange: (month: Date) => void;
  selected: string | null;
  onSelect: (day: string | null) => void;
  marks: Record<string, DayMark>;
}) {
  const today = dayKey(new Date());
  const colors = RoleColors[tone];
  const shift = (step: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + step, 1));
  const atCurrentMonth = dayKey(new Date(month.getFullYear(), month.getMonth(), 1)) >= `${today.slice(0, 8)}01`;
  return (
    <View style={styles.card}>
      <View style={styles.monthRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" onPress={() => shift(-1)} style={styles.arrow}>
          <Icon name="caret-left" />
        </Pressable>
        <Text variant="h5" accessibilityRole="header" style={styles.monthTitle}>{formatMonth(month)}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Próximo mês" accessibilityState={{ disabled: atCurrentMonth }}
          disabled={atCurrentMonth} onPress={() => shift(1)} style={[styles.arrow, atCurrentMonth && styles.off]}>
          <Icon name="caret-right" />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <View key={`weekday-${index}`} style={styles.weekday}>
          <Text variant="small" color="textSecondary">{day}</Text>
        </View>)}
        {monthCells(month).map((key, index) => {
          if (!key) return <View key={index} style={styles.cell} />;
          const mark = marks[key];
          const isSelected = key === selected;
          const future = key > today;
          const label = [formatDayKey(key), mark?.mood ? `humor ${MoodLabels[mark.mood].toLowerCase()}` : null,
            mark?.count ? `${mark.count} ${mark.count === 1 ? 'relato' : 'relatos'}` : null].filter(Boolean).join(', ');
          return <View key={index} style={styles.cell}>
            <Pressable accessibilityRole="button" accessibilityLabel={label}
              accessibilityState={{ selected: isSelected, disabled: future }} disabled={future}
              onPress={() => onSelect(isSelected ? null : key)}
              style={[styles.day, mark?.mood && { backgroundColor: MoodColors[mark.mood] },
                key === today && { borderColor: colors.shade }, isSelected && styles.selected]}>
              <Text variant="small" style={future ? styles.futureText : undefined}>{Number(key.slice(8))}</Text>
              {mark?.mood ? <NativeText style={styles.face} accessible={false}>{MoodIcons[mark.mood]}</NativeText> : null}
              {mark?.count ? <View style={styles.dot} /> : null}
            </Pressable>
          </View>;
        })}
      </View>
      <View style={styles.legend}>
        {(['bad', 'neutral', 'good'] as const).map((mood) => <View key={mood} style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: MoodColors[mood] }]} />
          <Text variant="small" color="textSecondary">{MoodLabels[mood]}</Text>
        </View>)}
        <View style={styles.legendItem}>
          <View style={styles.legendDot} />
          <Text variant="small" color="textSecondary">Relato</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two, padding: Spacing.two, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.background },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthTitle: { textTransform: 'capitalize' },
  arrow: { width: MinTouchTarget, height: MinTouchTarget, alignItems: 'center', justifyContent: 'center' },
  off: { opacity: 0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.2857%', alignItems: 'center' },
  cell: { width: '14.2857%', padding: Spacing.half },
  day: { height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', borderRadius: Radius.control },
  selected: { borderColor: Colors.text },
  futureText: { color: Colors.onDisabled, opacity: 0.5 },
  face: { fontSize: 14, lineHeight: 18 },
  dot: { position: 'absolute', top: 3, right: 3, width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.text },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.three },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  legendDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.text },
});
