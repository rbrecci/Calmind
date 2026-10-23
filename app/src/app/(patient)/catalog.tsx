import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { api } from '@/api';
import { Button, Colors, Radius, Screen, Spacing, Text } from '@/design-system';
import { loadCatalog, modalityLabel, type CatalogState } from '@/catalog/load-catalog';

export default function PatientCatalog() {
  const router = useRouter();
  const [state, setState] = useState<CatalogState | null>(null);

  const retry = useCallback(() => {
    setState(null);
    void loadCatalog(api).then(setState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadCatalog(api).then((next) => {
      if (!cancelled) setState(next);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <Screen scroll>
      <Text variant="small" color="textSecondary">Calmind</Text>
      <Text variant="h3">Encontrar profissional</Text>
      <Text variant="small" color="textSecondary">Psicólogos com registro conferido no CRP.</Text>
      {state === null ? <Text>Carregando profissionais...</Text> : null}
      {state?.status === 'error' ? (
        <>
          <Text variant="small" color="error" accessibilityRole="alert">{state.message}</Text>
          <Button tone="patient" label="Tentar de novo" onPress={retry} />
        </>
      ) : null}
      {state?.status === 'empty' ? <Text>Nenhum profissional disponível por enquanto.</Text> : null}
      {state?.status === 'ready' ? state.psychologists.map((psychologist) => {
        const modality = modalityLabel(psychologist.modality);
        return (
          <View key={psychologist.id} style={styles.card}>
            <Text variant="h5">{psychologist.name}</Text>
            <Text variant="small" color="textSecondary">CRP {psychologist.crp}</Text>
            {psychologist.approach ? <Text variant="small">{psychologist.approach}</Text> : null}
            {modality ? <Text variant="small" color="textSecondary">{modality}</Text> : null}
          </View>
        );
      }) : null}
      <Text variant="small" color="textSecondary">
        Sem preço, sem nota, sem estrela e sem ordenação por reputação (art. 20 do Código de Ética).
      </Text>
      <Button tone="patient" label="Voltar" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.three, gap: Spacing.one },
});
