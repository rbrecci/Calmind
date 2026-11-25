import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { psychologistApi } from '@/api/psychologist';
import { Appear, Colors, EmptyState, formatDateTime, Loading, MessageComposer, Radius, RoleColors, SkipInitialAppear, Spacing, Text } from '@/design-system';
import { createChatController, type ChatState } from '@/psychologist/chat-state';
import { lastOwnMessageId } from '@/psychologist/domain';
import { Action, ErrorNotice, Page, useResource } from '@/psychologist/ui';

export default function PatientChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const patientId = Number(id);
  const patient = useResource(useCallback(() => psychologistApi.patient(patientId), [patientId]), patientId);
  const [body, setBody] = useState('');
  const [state, setState] = useState<ChatState>({ messages: [], outbox: [], loading: true, error: null });
  const bondId = patient.data?.bond_id;
  const controller = useMemo(() => bondId === undefined ? null : createChatController(psychologistApi, bondId, setState), [bondId]);

  useFocusEffect(useCallback(() => {
    if (!controller) return;
    controller.start();
    return () => controller.stop();
  }, [controller]));

  const readOnly = patient.data?.bond_status !== 'active';
  const statusId = lastOwnMessageId(state.messages);
  const composer = !patient.data ? undefined : readOnly
    ? <Text>Vínculo encerrado. O chat está disponível somente para leitura.</Text>
    : <MessageComposer tone="psychologist" value={body} onChangeText={setBody} onSend={() => {
      const draft = body;
      setBody('');
      void controller?.send(draft);
    }} />;
  // O nome do paciente vai no cabeçalho, que diz "Chat" enquanto carrega; repetir na página
  // quebrava o título em duas linhas.
  return <Page footer={composer} stickToEnd>
    {patient.data ? <Stack.Screen options={{ title: patient.data.patient.name }} /> : null}
    {patient.loading && !patient.data ? <Loading /> : null}
    <ErrorNotice error={patient.error} retry={patient.reload} />
    {patient.data ? <>
      {/* Na volta à tela as mensagens continuam aí: o logo só entra quando não há nenhuma. */}
      {state.loading ? state.messages.length ? <Text>Carregando mensagens...</Text> : <Loading /> : null}
      <ErrorNotice error={state.error} retry={() => { void controller?.reload(); }} />
      {!state.loading && !state.error && state.messages.length === 0 ? <EmptyState illustration="conversa" title="Nenhuma mensagem ainda" /> : null}
      {/* O histórico monta junto com a primeira leva: o que já estava na conversa aparece parado,
          e só a mensagem que chega ou é enviada depois entra animada. */}
      {!state.loading || state.messages.length ? <SkipInitialAppear><View style={styles.history}>
        {state.messages.map((message) => {
          const meta = message.id === statusId ? `${formatDateTime(message.sent_at)} · ${message.read_at ? 'Lida' : 'Enviada'}` : formatDateTime(message.sent_at);
          // Numa conversa a dois o lado e a cor já dizem quem falou; o nome fica só para o leitor de tela.
          return <Appear rise key={message.id} accessible accessibilityLabel={`${message.mine ? 'Você' : patient.data?.patient.name}: ${message.body}. ${meta}`}
            style={[styles.message, message.mine ? styles.mine : styles.theirs]}>
            <Text selectable>{message.body}</Text>
            <Text variant="small">{meta}</Text>
          </Appear>;
        })}
      </View></SkipInitialAppear> : null}
      {state.outbox.map((draft) => <View key={`draft-${draft.id}`} style={[styles.message, styles.draft]}>
        <Text>{draft.body}</Text>
        <Text color={draft.status === 'failed' ? 'error' : 'textSecondary'} accessibilityLiveRegion="polite">
          {draft.status === 'failed' ? `Não enviada. ${draft.error ?? ''}` : 'Enviando...'}
        </Text>
        {draft.status === 'failed' && !readOnly ? <Action variant="secondary" label="Reenviar mensagem" onPress={() => { void controller?.retry(draft.id); }} /> : null}
      </View>)}
    </> : null}
  </Page>;
}

const styles = StyleSheet.create({
  history: { gap: Spacing.three },
  message: { borderRadius: Radius.md, padding: Spacing.three, gap: Spacing.two, maxWidth: '95%' },
  mine: { alignSelf: 'flex-end', backgroundColor: RoleColors.psychologist.accent },
  // Rascunho fica em contorno: "Enviando..." e o erro reprovam o contraste sobre o rosa.
  draft: { alignSelf: 'flex-end', borderWidth: 1, borderColor: RoleColors.psychologist.accent, backgroundColor: Colors.background },
  theirs: { alignSelf: 'flex-start', backgroundColor: Colors.surface },
});
