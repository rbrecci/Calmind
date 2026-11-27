import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ApiError } from '@/api';
import { psychologistApi } from '@/api/psychologist';
import type { Profile, ProfileInput } from '@/api/psychologist/types';
import { modalityLabel } from '@/catalog/load-catalog';
import { ChoiceGroup, Chip, Colors, ListItem, Radius, Spacing, Text } from '@/design-system';
import { EditableProfileHeader } from '@/profile/editable-header';
import { usePsychologistAccess } from '@/psychologist/access';
import { Action, ErrorNotice, Field, FieldErrorsDisplay, Page, useResource } from '@/psychologist/ui';
import { useSession } from '@/session/session-context';

// Perfil como o paciente o vê no catálogo: capa, foto, nome e CRP, atributos em chips e a
// apresentação. O formulário de edição fica atrás de "Editar perfil".
export default function ProfileScreen() {
  const { profile, refresh } = usePsychologistAccess();
  const { name } = useSession();
  const [current, setCurrent] = useState<Profile | null>(profile);
  const router = useRouter();
  // A contagem vem de uma leitura nova: a do portão de entrada pode ter envelhecido.
  const bonds = useResource(() => psychologistApi.profile());
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileInput>({
    profile_approach: profile?.profile_approach ?? '', profile_specialty: profile?.profile_specialty ?? '',
    profile_modality: profile?.profile_modality ?? 'online', profile_region: profile?.profile_region ?? '', profile_bio: profile?.profile_bio ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const submitting = useRef(false);
  const fieldError = (key: string) => error instanceof ApiError ? error.errors?.[key]?.join(' ') : undefined;
  async function save(publish: boolean) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true); setError(null); setSaved(false);
    try {
      let result = await psychologistApi.updateProfile(form);
      if (publish) result = await psychologistApi.publishProfile();
      setCurrent(result); setSaved(true); refresh();
    } catch (cause) { setError(cause); } finally { submitting.current = false; setBusy(false); }
  }
  const chips = [current?.profile_specialty, current?.profile_approach, modalityLabel(current?.profile_modality ?? null), current?.profile_region]
    .filter((value): value is string => Boolean(value));
  return <Page>
    <EditableProfileHeader tone="psychologist" name={name ?? ''} subtitle={current?.crp ? `CRP ${current.crp}` : undefined} />
    {bonds.data?.active_bonds !== undefined ? <ListItem tone="psychologist" icon="users"
      title={`${bonds.data.active_bonds} ${bonds.data.active_bonds === 1 ? 'vínculo ativo' : 'vínculos ativos'}`}
      onPress={() => router.dismissTo('/(psychologist)/(tabs)/dashboard')} /> : null}
    {chips.length ? <View style={styles.chips}>{chips.map((chip) => <Chip key={chip} tone="psychologist" label={chip} />)}</View> : null}
    {current?.profile_bio ? <>
      <Text variant="h5">Apresentação</Text>
      <Text>{current.profile_bio}</Text>
    </> : null}
    <Action variant="secondary" icon="pencil" label="Editar perfil" onPress={() => setEditing(true)} />
    <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text variant="h4">Editar perfil</Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
          <Field label="Abordagem" value={form.profile_approach ?? ''} onChangeText={(value) => setForm({ ...form, profile_approach: value })} error={fieldError('profile_approach')} />
          <Field label="Especialidade" value={form.profile_specialty ?? ''} onChangeText={(value) => setForm({ ...form, profile_specialty: value })} error={fieldError('profile_specialty')} />
          <ChoiceGroup tone="psychologist" label="Modalidade" value={form.profile_modality ?? null}
            onChange={(modality) => setForm({ ...form, profile_modality: modality })} disabled={busy}
            options={[{ value: 'online', label: 'Online' }, { value: 'presencial', label: 'Presencial' }, { value: 'ambos', label: 'Online e presencial' }]} />
          <Field label="Região de atendimento" value={form.profile_region ?? ''} onChangeText={(value) => setForm({ ...form, profile_region: value })} error={fieldError('profile_region')} />
          <Field label="Sobre você" multiline maxLength={3000} value={form.profile_bio ?? ''} onChangeText={(value) => setForm({ ...form, profile_bio: value })} error={fieldError('profile_bio')} />
          <ErrorNotice error={error} /><FieldErrorsDisplay error={error} />
          {saved ? <Text accessibilityLiveRegion="polite">Perfil salvo{current?.profile_published_at ? ' e publicado' : ''}.</Text> : null}
          <Action icon="floppy-disk" label="Salvar perfil" loading={busy} onPress={() => { void save(false); }} />
          <Action variant="secondary" icon="globe" label="Salvar e publicar no catálogo" disabled={busy} onPress={() => { void save(true); }} />
          {saved ? <Action variant="secondary" icon="arrow-clockwise" label="Atualizar início" onPress={refresh} /> : null}
          <Action variant="secondary" icon="x" label="Fechar edição" disabled={busy} onPress={() => setEditing(false)} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </Page>;
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  dialog: { width: '100%', maxWidth: 560, maxHeight: '90%', padding: Spacing.four, backgroundColor: Colors.background, borderRadius: Radius.md, gap: Spacing.three },
  form: { gap: Spacing.three, paddingBottom: Spacing.two },
});
