import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useImageSource } from './image-source';
import { RoleColors } from './tokens';

export type CoverProps = {
  tone: 'patient' | 'psychologist';
  // Capa escolhida pela pessoa. Vem de rota autenticada, por isso aceita cabeçalhos (Bearer).
  uri?: string | null;
  headers?: Record<string, string>;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

// Faixa de capa do perfil. Sem capa, ou com capa que não carrega, fica o degradê do tom claro à
// cor do lado, nunca foto de banco de imagem. Decorativa: o nome ao lado é que diz de quem é.
export function Cover({ tone, uri, headers, height = 120, style }: CoverProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const source = useImageSource(uri, headers);
  // Estável: o Image do expo-image é PureComponent, e na web cada renderização dele busca a foto
  // de novo e a tira da tela enquanto isso.
  const onError = useCallback(() => setFailed(source?.uri ?? null), [source]);
  const colors = RoleColors[tone];
  return (
    <View style={[styles.cover, { height }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient colors={[colors.tint, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {source && failed !== source.uri ? (
        <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" onError={onError} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { overflow: 'hidden', width: '100%' },
});
