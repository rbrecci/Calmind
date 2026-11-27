import Constants from 'expo-constants';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { ActionSheet, ListItem, Section, Text } from '@/design-system';

// Parte da tela de conta igual nos dois lados: ajuda de emergência, termo aceito e versão.
export function AccountInfo({ tone, term }: { tone: 'patient' | 'psychologist'; term?: string | null }) {
  const [sheet, setSheet] = useState<'help' | 'term' | null>(null);
  return <>
    <Section title="Ajuda e privacidade">
      <ListItem tone={tone} icon="phone" title="Preciso de ajuda agora" description="CVV 188 e SAMU 192" onPress={() => setSheet('help')} />
      {term ? <ListItem tone={tone} icon="shield-check" title="Termo de consentimento" description="O que é coletado e quem vê" onPress={() => setSheet('term')} /> : null}
    </Section>
    <Text variant="small" color="textSecondary" style={styles.version}>Calmind {Constants.expoConfig?.version}</Text>
    <ActionSheet visible={sheet === 'help'} title="Ajuda imediata" onClose={() => setSheet(null)}>
      <Text>O Calmind não é um serviço de emergência e não substitui a sessão.</Text>
      <Text>Em crise ou risco à vida, ligue para o CVV no 188 (gratuito, 24 horas) ou para o SAMU no 192.</Text>
    </ActionSheet>
    <ActionSheet visible={sheet === 'term'} title="Termo de consentimento" onClose={() => setSheet(null)}>
      <Text>{term}</Text>
    </ActionSheet>
  </>;
}

const styles = StyleSheet.create({
  version: { textAlign: 'center' },
});
