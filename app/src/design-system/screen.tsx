import { useContext, useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { HeaderShownContext } from 'expo-router/react-navigation';
// O expo-router não reexporta este contexto num caminho público; é o mesmo módulo que a barra de abas usa.
import { BottomTabBarHeightContext } from 'expo-router/build/react-navigation/bottom-tabs';

import { Colors, MaxContentWidth, Spacing } from './tokens';

type ScreenProps = {
  children: ReactNode;
  // Telas com formulário rolam, para o teclado não cobrir o botão.
  scroll?: boolean;
  // Centraliza na vertical. Só para tela de conteúdo único e curto (carregando, aviso de
  // espera): em lista ou formulário a metade de cima fica vazia quando há pouco item.
  center?: boolean;
  // Arrastar para baixo recarrega a tela. Só vale com `scroll`.
  refreshing?: boolean;
  onRefresh?: () => void;
  // Fica fixo embaixo, fora da rolagem e acima do teclado, como o campo de mensagem da conversa.
  footer?: ReactNode;
  // Mantém a rolagem no fim: a conversa abre na mensagem mais recente e acompanha as novas.
  stickToEnd?: boolean;
};

// Base de toda tela: fundo branco (a identidade pede fundo majoritariamente branco), área
// segura do aparelho e conteúdo a partir do topo, centrado na horizontal com largura máxima
// em tela grande.
export function Screen({
  children,
  scroll = false,
  center = false,
  refreshing = false,
  onRefresh,
  footer,
  stickToEnd = false,
}: ScreenProps) {
  // O cabeçalho já desconta a barra de status e a barra de abas já desconta a borda de baixo.
  // Aplicar a área segura de novo deixa uma faixa branca que corta o conteúdo rolado.
  const headerShown = useContext(HeaderShownContext);
  const tabBarHeight = useContext(BottomTabBarHeightContext);
  const edges: Edge[] = ['left', 'right'];
  if (!headerShown) edges.push('top');
  if (!tabBarHeight) edges.push('bottom');
  const containerStyle = [styles.container, center && styles.center];
  const scrollRef = useRef<ScrollView>(null);
  const frameRef = useRef<View>(null);
  const [frameTop, setFrameTop] = useState(0);
  // A primeira ida ao fim é sem animação, para a conversa já abrir na última mensagem.
  const reachedEnd = useRef(false);
  const followEnd = stickToEnd ? () => {
    scrollRef.current?.scrollToEnd({ animated: reachedEnd.current });
    reachedEnd.current = true;
  } : undefined;

  const body = scroll ? (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={containerStyle}
      keyboardShouldPersistTaps="handled"
      // Com rodapé, quem desvia do teclado é o KeyboardAvoidingView; ajustar aqui também dobraria o recuo.
      automaticallyAdjustKeyboardInsets={!footer}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
      onContentSizeChange={followEnd}
      // O teclado abrindo encolhe a rolagem e esconderia as últimas mensagens.
      onLayout={followEnd}>
      <View style={styles.content}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[containerStyle, styles.fill]}>
      <View style={styles.content}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {footer ? (
        // O KeyboardAvoidingView compara a própria posição, relativa ao pai, com o topo do teclado,
        // que vem em coordenada da janela. Sem somar onde a tela começa, numa tela empilhada o
        // teclado cobre do rodapé a altura do cabeçalho. Numa aba a tela já termina acima da barra.
        <View ref={frameRef} style={styles.fill}
          onLayout={() => frameRef.current?.measureInWindow((_x, y) => setFrameTop(y))}>
          <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={frameTop} style={styles.fill}>
            {body}
            <View style={styles.footer}>
              <View style={styles.content}>{footer}</View>
            </View>
          </KeyboardAvoidingView>
        </View>
      ) : body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  fill: {
    flex: 1,
  },
  // `flexGrow` faz o conteúdo da rolagem ocupar a altura toda, que é o que permite o `center`
  // funcionar também com `scroll`.
  container: {
    flexGrow: 1,
    padding: Spacing.four,
  },
  center: {
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
});
