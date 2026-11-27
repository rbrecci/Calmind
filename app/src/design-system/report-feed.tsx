import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Appear } from './appear';
import { Button } from './button';
import { capitalizeFirst, formatDayKey, groupByDay } from './calendar';
import { formatTime } from './format-date';
import { Icon } from './icon';
import { MoodIcons, MoodLabels, type Mood } from './mood';
import { Text } from './text';
import { Colors, Radius, RoleColors, Spacing } from './tokens';

type Item = { id: number; body: string; created_at: string };

// Quantos cartões entram de cada vez: um mês cheio passa de oitenta relatos.
const STEP = 20;
// A partir daqui o texto não cabe em três linhas e o cartão oferece "Ler mais".
const LONG = 120;

// Relatos agrupados por dia, em cartões compactos. O cabeçalho do dia leva o humor marcado.
export function ReportFeed<T extends Item>({ tone, reports, moods, renderTag, renderActions }: {
  tone: 'patient' | 'psychologist';
  reports: readonly T[];
  moods: Record<string, Mood>;
  renderTag?: (report: T) => ReactNode;
  renderActions?: (report: T) => ReactNode;
}) {
  const [limit, setLimit] = useState(STEP);
  const [open, setOpen] = useState<number | null>(null);
  const all = groupByDay(reports);
  // Cada dia recebe o que sobra do limite depois dos dias anteriores.
  const groups = all.flatMap((group, index) => {
    const before = all.slice(0, index).reduce((total, previous) => total + previous.items.length, 0);
    return before < limit ? [{ key: group.key, items: group.items.slice(0, limit - before), total: group.items.length }] : [];
  });
  const shown = Math.min(limit, reports.length);
  return (
    <View style={styles.feed}>
      {groups.map((group) => <View key={group.key} style={styles.group}>
        <View style={styles.dayRow}>
          <Text style={styles.day} accessibilityRole="header">{capitalizeFirst(formatDayKey(group.key))}</Text>
          {moods[group.key] ? <Text variant="small" accessibilityLabel={`Humor: ${MoodLabels[moods[group.key]]}`}>
            {MoodIcons[moods[group.key]]} {MoodLabels[moods[group.key]]}
          </Text> : null}
          <Text variant="small" color="textSecondary">{group.total} {group.total === 1 ? 'relato' : 'relatos'}</Text>
        </View>
        {group.items.map((report) => {
          const long = report.body.length > LONG || report.body.includes('\n');
          const expanded = open === report.id;
          const actions = expanded || !long ? renderActions?.(report) : null;
          return <Appear key={report.id} style={[styles.card, { borderLeftColor: RoleColors[tone].accent }]}>
            <View style={styles.meta}>
              <Icon name="clock" size={16} color={Colors.textSecondary} />
              <Text variant="small" color="textSecondary" style={styles.time}>{formatTime(report.created_at)}</Text>
              {renderTag?.(report)}
            </View>
            <Text numberOfLines={long && !expanded ? 3 : undefined}>{report.body}</Text>
            {long ? <Button tone={tone} variant="secondary" label={expanded ? 'Mostrar menos' : 'Ler mais'}
              accessibilityLabel={`${expanded ? 'Mostrar menos' : 'Ler mais'}, relato das ${formatTime(report.created_at)}`}
              onPress={() => setOpen(expanded ? null : report.id)} /> : null}
            {actions}
          </Appear>;
        })}
      </View>)}
      {shown < reports.length ? <Button tone={tone} variant="secondary" icon="plus" label={`Mostrar mais (${reports.length - shown})`}
        onPress={() => setLimit(limit + STEP)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  feed: { gap: Spacing.three },
  group: { gap: Spacing.two },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  day: { marginRight: 'auto' },
  card: {
    gap: Spacing.two, padding: Spacing.three, borderWidth: 1, borderLeftWidth: 4, borderColor: Colors.border,
    borderRadius: Radius.md, backgroundColor: Colors.background,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  time: { marginRight: 'auto' },
});
