import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { patientApi } from '@/api/patient';
import type { Visibility } from '@/api/patient/types';
import { Button, Colors, MinTouchTarget, Radius, RoleColors, Spacing, Text, TextField } from '@/design-system';
import { errorMessage } from '@/patient/presentation';
import { PatientPage } from '@/patient/ui';

export default function NewReport() {
  const router = useRouter();
  const [visibility, setVisibility] = useState<Visibility>('shared');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    setBusy(true); setError(null);
    try { await patientApi.createReport({ body, visibility }); router.dismissTo('/reports'); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <PatientPage title="Novo relato">
    <Text variant="h5">Quem pode ver?</Text>
    <View accessibilityRole="radiogroup" style={styles.selector}>
      {(['shared', 'private'] as const).map((value) => <Pressable key={value}
        accessibilityRole="radio" accessibilityLabel={value === 'shared' ? 'Compartilhado' : 'Privado, só para mim'}
        aria-checked={visibility === value}
        accessibilityState={{ checked: visibility === value, disabled: busy }} disabled={busy}
        onPress={() => setVisibility(value)} style={[styles.option, { backgroundColor: visibility === value ? RoleColors.patient.accent : Colors.surface }]}>
        <Text>{value === 'shared' ? 'Compartilhado' : 'Privado'}</Text>
      </Pressable>)}
    </View>
    <Text variant="small" color="textSecondary">{visibility === 'shared' ? 'Seu profissional poderá ler este relato.' : 'Só você poderá ler este relato.'}</Text>
    <TextField label="Seu relato" accessibilityLabel="Texto do relato" value={body} onChangeText={setBody}
      multiline numberOfLines={7} textAlignVertical="top" maxLength={10000} editable={!busy} error={error ?? undefined} />
    <Text variant="small" color="textSecondary">A visibilidade é definida na postagem. Você pode despublicar um relato compartilhado depois.</Text>
    <Button tone="patient" label={busy ? 'Salvando...' : 'Salvar relato'} disabled={busy || !body.trim()} onPress={() => void save()} />
  </PatientPage>;
}

const styles = StyleSheet.create({
  selector: { flexDirection: 'row', gap: Spacing.two },
  option: { flex: 1, minHeight: MinTouchTarget, borderRadius: Radius.md, padding: Spacing.two, alignItems: 'center', justifyContent: 'center' },
});
