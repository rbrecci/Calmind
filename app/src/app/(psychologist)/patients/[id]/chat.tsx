import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { psychologistApi } from '@/api/psychologist';
import { Colors, formatDateTime, MessageComposer, Radius, RoleColors, Spacing, Text } from '@/design-system';
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
    {patient.loading ? <Text>Carregando paciente...</Text> : null}
    <ErrorNotice error={patient.error} retry={patient.reload} />
    {patient.data ? <>
      {state.loading ? <Text>Carregando mensagens...</Text> : null}
      <ErrorNotice error={state.error} retry={() => { void controller?.reload(); }} />
      {!state.loading && !state.error && state.messages.length === 0 ? <Text>Nenhuma mensagem neste vínculo.</Text> : null}
      {state.messages.map((message) => <View key={message.id} style={[styles.message, message.mine ? styles.mine : styles.theirs]}>
        <Text variant="small">{message.mine ? 'Você' : patient.data?.patient.name}</Text>
        <Text selectable>{message.body}</Text>
        <Text variant="small">{formatDateTime(message.sent_at)}</Text>
        {message.id === statusId ? <Text variant="small">{message.read_at ? 'Lida' : 'Enviada'}</Text> : null}
      </View>)}
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
  message: { borderRadius: Radius.md, padding: Spacing.three, gap: Spacing.two, maxWidth: '95%' },
  mine: { alignSelf: 'flex-end', backgroundColor: RoleColors.psychologist.accent },
  // Rascunho fica em contorno: "Enviando..." e o erro reprovam o contraste sobre o rosa.
  draft: { alignSelf: 'flex-end', borderWidth: 1, borderColor: RoleColors.psychologist.accent, backgroundColor: Colors.background },
  theirs: { alignSelf: 'flex-start', backgroundColor: Colors.surface },
});
