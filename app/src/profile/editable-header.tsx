import { useState } from 'react';

import { imageHeaders } from '@/api';
import { ActionSheet, ProfileHeader, Text, type SheetAction } from '@/design-system';
import { useProfileImages } from './use-profile-images';

// Topo do próprio perfil, dos dois lados: banner ao fundo e um botão de editar que reúne trocar e
// remover foto e banner numa folha.
export function EditableProfileHeader({ tone, name, subtitle }: {
  tone: 'patient' | 'psychologist'; name: string; subtitle?: string;
}) {
  const images = useProfileImages();
  const [open, setOpen] = useState(false);
  const actions: SheetAction[] = [
    { label: 'Trocar foto', icon: 'camera', onPress: () => images.change('avatar') },
    { label: 'Trocar banner', icon: 'image', onPress: () => images.change('cover') },
    ...(images.avatarUrl ? [{ label: 'Remover foto', icon: 'trash', destructive: true, onPress: () => images.remove('avatar') } as const] : []),
    ...(images.coverUrl ? [{ label: 'Remover banner', icon: 'trash', destructive: true, onPress: () => images.remove('cover') } as const] : []),
  ];
  return <>
    <ProfileHeader tone={tone} name={name} subtitle={subtitle} avatarUri={images.avatarUrl} coverUri={images.coverUrl}
      headers={imageHeaders()} onEdit={images.busy ? undefined : () => setOpen(true)} />
    {images.busy ? <Text variant="small" color="textSecondary" accessibilityLiveRegion="polite">Enviando imagem...</Text> : null}
    {images.error ? <Text color="error" accessibilityRole="alert">{images.error}</Text> : null}
    <ActionSheet visible={open} title="Editar perfil" actions={actions} onClose={() => setOpen(false)} />
  </>;
}
