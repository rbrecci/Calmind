import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useImageSource } from './image-source';
import { initials } from './initials';
import { Text } from './text';
import { Colors, RoleColors } from './tokens';

export type AvatarProps = {
  name: string;
  tone: 'patient' | 'psychologist';
  size?: number;
  // Foto da pessoa. Vem de rota autenticada, por isso aceita cabeçalhos (Bearer).
  uri?: string | null;
  headers?: Record<string, string>;
  // Sem rótulo o avatar é decorativo e some do leitor de tela, que é o certo quando o nome já
  // está escrito ao lado. Onde ele está sozinho, quem usa passa o nome aqui.
  accessibilityLabel?: string;
};

// Círculo com a foto ou, sem foto, as iniciais em Dark sobre o tom claro do lado. Foto que não
// carrega (sem rede, 403, 404) também cai para as iniciais, e não deixa o círculo vazio.
export function Avatar({ name, tone, size = 40, uri, headers, accessibilityLabel }: AvatarProps) {
  // Guarda qual URI falhou: trocar de foto tenta de novo sem precisar zerar estado.
  const [failed, setFailed] = useState<string | null>(null);
  const source = useImageSource(uri, headers);
  // Estável: o Image do expo-image é PureComponent, e na web cada renderização dele busca a foto
  // de novo e a tira da tela enquanto isso.
  const onError = useCallback(() => setFailed(source?.uri ?? null), [source]);
  const showPhoto = source !== null && failed !== source.uri;
  const fontSize = Math.max(14, Math.round(size * 0.4)); // RNF-34: nada abaixo de 14
  const a11y = accessibilityLabel
    ? { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };
  return (
    <View
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: RoleColors[tone].tint }]}
      {...a11y}>
      {showPhoto ? (
        <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" onError={onError} />
      ) : (
        <Text variant="h5" style={{ fontSize, lineHeight: Math.round(fontSize * 1.2), color: Colors.text }}>
          {initials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
