import { useRouter } from 'expo-router';

import { Button, EmptyState, type IllustrationName } from '@/design-system';

// Tela de quem não tem vínculo: só a imagem e a mensagem, no meio, com os dois caminhos para sair
// dali. Nenhuma outra informação aparece junto.
export function NoBond({ illustration = 'boas-vindas', title, description }: {
  illustration?: IllustrationName; title: string; description: string;
}) {
  const router = useRouter();
  return <EmptyState illustration={illustration} title={title} description={description}>
    <Button tone="patient" icon="search" label="Encontrar um profissional" onPress={() => router.push('/catalog')} />
    <Button tone="patient" variant="secondary" icon="key" label="Tenho um código" onPress={() => router.push('/invitation')} />
  </EmptyState>;
}
