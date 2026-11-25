import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { patientApi } from '@/api/patient';
import type { Message } from '@/api/patient/types';
import { Appear, Button, Colors, EmptyState, formatDate, formatDateTime, formatUnread, ListItem, MessageComposer, Radius, RoleColors, SkipInitialAppear, Spacing, Text } from '@/design-system';
import { bondsWithConversation, selectBond } from '@/patient/bonds';
import { deliverMessage, lastOwnMessageId, mergeMessages, watchConversation } from '@/patient/conversation';
import { loadPatientPages } from '@/patient/load-pages';
import { Card, Feedback, PatientPage } from '@/patient/ui';
import { usePatientData } from '@/patient/use-patient-data';

const loadBonds = () => loadPatientPages(patientApi.bonds);

export default function Chat() {
  const { bondId } = useLocalSearchParams<{ bondId?: string }>();
  const bonds = usePatientData(loadBonds);
  const bond = bondId ? bonds.data?.find((b) => b.id === Number(bondId)) : selectBond(bonds.data ?? []);
  const id = bond?.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [failed, setFailed] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const lifecycle = useRef({ active: false, generation: 0, bondId: 0 });
  const watcher = useRef<ReturnType<typeof watchConversation> | null>(null);
  useFocusEffect(useCallback(() => {
    if (!id) return;
    const scope = lifecycle.current;
    if (scope.bondId !== id) { setDraft(''); setFailed(null); setSendError(null); scope.bondId = id; }
    scope.generation++;
    scope.active = true;
    setSending(false);
    setMessages([]); setLoading(true); setError(null);
    const conversation = watchConversation(patientApi, id, (incoming) => {
      setMessages((current) => mergeMessages(current, incoming)); setLoading(false); setError(null);
    }, (message) => { setError(message); setLoading(false); });
    watcher.current = conversation;
    return () => { scope.active = false; conversation.stop(); watcher.current = null; };
  }, [id]));
  async function send(body: string) {
    if (!id || sending) return;
    const generation = lifecycle.current.generation;
    setSending(true); setSendError(null);
    const result = await deliverMessage(patientApi, id, body);
    if (generation !== lifecycle.current.generation) return;
    setSending(false);
    if (!lifecycle.current.active) return;
    if (result.status === 'sent') {
      setMessages((current) => mergeMessages(current, [result.message])); setDraft(''); setFailed(null);
    } else { setFailed(result.body); setSendError(result.error); }
  }
  const conversations = bondsWithConversation(bonds.data ?? []);
  const statusId = lastOwnMessageId(messages);
  const composer = bond?.status === 'active' ? failed !== null ? <Card>
    <Text accessibilityRole="alert" color="error">Não enviada. {sendError}</Text>
    <Text>{failed}</Text>
    <Button tone="patient" label="Reenviar" disabled={sending} onPress={() => void send(failed)} />
    <Button tone="patient" variant="secondary" label="Editar mensagem" disabled={sending} onPress={() => { setDraft(failed); setFailed(null); setSendError(null); }} />
  </Card> : <MessageComposer tone="patient" value={draft} onChangeText={setDraft} sending={sending}
    onSend={() => void send(draft)} /> : undefined;
  // A aba já diz "Conversa": o título é a profissional, e o CRP fica no início.
  return <PatientPage title={bond?.psychologist.name ?? 'Conversa'} footer={composer} stickToEnd>
    <Feedback loading={bonds.loading} error={bonds.error} retry={() => void bonds.reload()} initial={bonds.data === null} />
    {!bonds.loading && !bonds.error && !bond ? <EmptyState illustration="conversa" title="Nenhum vínculo disponível" /> : null}
    {/* A aba abre a conversa do vínculo atual; as anteriores continuam alcançáveis daqui. */}
    {conversations.length > 1 ? conversations.map((b) => {
      const title = `${b.status === 'active' ? 'Conversa' : 'Conversa anterior'} com ${b.psychologist.name}`;
      const since = b.status === 'active' ? undefined : formatDate(b.requested_at);
      return <ListItem key={b.id} tone="patient" title={title} description={since} badge={b.unread_messages || undefined}
        accessibilityLabel={[title, formatUnread(b.unread_messages), since].filter(Boolean).join(', ')}
        onPress={() => router.setParams({ bondId: String(b.id) })} />;
    }) : null}
    {bond ? <>
      {bond.status !== 'active' ? <Text>Este vínculo não está ativo. Conversa somente para leitura.</Text> : null}
      <Feedback loading={loading} error={error} retry={() => void watcher.current?.refresh()} initial={!messages.length} />
      {!loading && !messages.length && !error ? <EmptyState illustration="conversa" title="Nenhuma mensagem ainda" /> : null}
      {/* O histórico monta junto com a primeira leva: o que já estava na conversa aparece parado,
          e só a mensagem que chega ou é enviada depois entra animada. */}
      {!loading || messages.length ? <SkipInitialAppear><View accessibilityLiveRegion="polite" style={styles.history}>
        {messages.map((message) => {
          const meta = message.id === statusId ? `${formatDateTime(message.sent_at)} · ${message.read_at ? 'Lida' : 'Enviada'}` : formatDateTime(message.sent_at);
          // Numa conversa a dois o lado e a cor já dizem quem falou; o nome fica só para o leitor de tela.
          return <Appear rise key={message.id} accessible accessibilityLabel={`${message.mine ? 'Você' : bond.psychologist.name}: ${message.body}. ${meta}`}
            style={[styles.message, message.mine ? styles.mine : styles.theirs]}>
            <Text>{message.body}</Text>
            <Text variant="small" color={message.mine ? 'text' : 'textSecondary'}>{meta}</Text>
          </Appear>;
        })}
      </View></SkipInitialAppear> : null}
    </> : null}
  </PatientPage>;
}

const styles = StyleSheet.create({
  history: { gap: Spacing.two },
  message: { maxWidth: '92%', padding: Spacing.three, gap: Spacing.one, borderRadius: Radius.md },
  mine: { backgroundColor: RoleColors.patient.accent, alignSelf: 'flex-end' },
  theirs: { backgroundColor: Colors.surface, alignSelf: 'flex-start' },
});
