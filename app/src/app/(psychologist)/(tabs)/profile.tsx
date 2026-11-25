import { useRef, useState } from 'react';
import { ApiError } from '@/api';
import { psychologistApi } from '@/api/psychologist';
import type { Profile, ProfileInput } from '@/api/psychologist/types';
import { ChoiceGroup, Text } from '@/design-system';
import { usePsychologistAccess } from '@/psychologist/access';
import { useSession } from '@/session/session-context';
import { Action, ErrorNotice, Field, FieldErrorsDisplay, Page } from '@/psychologist/ui';

export default function ProfileScreen() {
  const { profile, refresh } = usePsychologistAccess();
  const { signOut } = useSession();
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
  return <Page title="Perfil"><Text color="textSecondary">CRP {current?.crp}</Text>
    <Text color="textSecondary">Aparece no catálogo de profissionais.</Text>
    <Field label="Abordagem" value={form.profile_approach ?? ''} onChangeText={(value) => setForm({ ...form, profile_approach: value })} error={fieldError('profile_approach')} />
    <Field label="Especialidade" value={form.profile_specialty ?? ''} onChangeText={(value) => setForm({ ...form, profile_specialty: value })} error={fieldError('profile_specialty')} />
    <ChoiceGroup tone="psychologist" label="Modalidade" value={form.profile_modality ?? null}
      onChange={(modality) => setForm({ ...form, profile_modality: modality })} disabled={busy}
      options={[{ value: 'online', label: 'Online' }, { value: 'presencial', label: 'Presencial' }, { value: 'ambos', label: 'Online e presencial' }]} />
    <Field label="Região de atendimento" value={form.profile_region ?? ''} onChangeText={(value) => setForm({ ...form, profile_region: value })} error={fieldError('profile_region')} />
    <Field label="Sobre você" multiline maxLength={3000} value={form.profile_bio ?? ''} onChangeText={(value) => setForm({ ...form, profile_bio: value })} error={fieldError('profile_bio')} />
    <ErrorNotice error={error} /><FieldErrorsDisplay error={error} />
    {saved ? <Text accessibilityLiveRegion="polite">Perfil salvo{current?.profile_published_at ? ' e publicado' : ''}.</Text> : null}
    <Action label="Salvar perfil" loading={busy} onPress={() => { void save(false); }} />
    <Action variant="secondary" label="Salvar e publicar no catálogo" disabled={busy} onPress={() => { void save(true); }} />
    {saved ? <Action variant="secondary" label="Atualizar início" onPress={refresh} /> : null}
    <Action variant="secondary" label="Sair da conta" onPress={() => { void signOut(); }} />
  </Page>;
}
