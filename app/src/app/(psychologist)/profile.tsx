import { useRef, useState } from 'react';
import { ApiError } from '@/api';
import { psychologistApi } from '@/api/psychologist';
import type { Profile, ProfileInput } from '@/api/psychologist/types';
import { Text } from '@/design-system';
import { usePsychologistAccess } from '@/psychologist/access';
import { Action, ErrorNotice, Field, FieldErrorsDisplay, Page } from '@/psychologist/ui';

export default function ProfileScreen() {
  const { profile, refresh } = usePsychologistAccess();
  const [current, setCurrent] = useState<Profile | null>(profile);
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
  return <Page title="Meu perfil profissional"><Text>CRP: {current?.crp}</Text>
    <Text>Escreva sua apresentação para as pessoas que consultam o catálogo.</Text>
    <Field label="Abordagem" value={form.profile_approach ?? ''} onChangeText={(value) => setForm({ ...form, profile_approach: value })} error={fieldError('profile_approach')} />
    <Field label="Especialidade" value={form.profile_specialty ?? ''} onChangeText={(value) => setForm({ ...form, profile_specialty: value })} error={fieldError('profile_specialty')} />
    <Text>Modalidade: {form.profile_modality === 'ambos' ? 'Online e presencial' : form.profile_modality === 'online' ? 'Online' : 'Presencial'}</Text>
    {(['online', 'presencial', 'ambos'] as const).map((modality) => <Action key={modality}
      label={({ online: 'Atender online', presencial: 'Atender presencialmente', ambos: 'Atender online e presencialmente' })[modality]}
      disabled={busy} onPress={() => setForm({ ...form, profile_modality: modality })} />)}
    <Field label="Região de atendimento" value={form.profile_region ?? ''} onChangeText={(value) => setForm({ ...form, profile_region: value })} error={fieldError('profile_region')} />
    <Field label="Sobre você (até 3000 caracteres)" multiline maxLength={3000} value={form.profile_bio ?? ''} onChangeText={(value) => setForm({ ...form, profile_bio: value })} error={fieldError('profile_bio')} />
    <ErrorNotice error={error} /><FieldErrorsDisplay error={error} />
    {saved ? <Text accessibilityLiveRegion="polite">Perfil salvo{current?.profile_published_at ? ' e publicado' : ''}.</Text> : null}
    <Action label="Salvar perfil" loading={busy} onPress={() => { void save(false); }} />
    <Action label="Salvar e publicar no catálogo" disabled={busy} onPress={() => { void save(true); }} />
    {saved ? <Action label="Atualizar início" onPress={refresh} /> : null}
  </Page>;
}
