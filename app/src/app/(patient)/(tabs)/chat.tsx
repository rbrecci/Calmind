import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { patientApi } from '@/api/patient';
import type { Message } from '@/api/patient/types';
import { Button, EmptyState, formatDate, formatDateTime, formatTime, formatUnread, groupMessagesByDay, ListItem, MessageBubble, MessageComposer, MessageDay, SkipInitialAppear, Spacing, Text } from '@/design-system';
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
  const name = bond?.psychologist.name;
  // R1: um título só, no cabeçalho. O nome da profissional entra no lugar de "Conversa" quando há
  // vínculo; a aba continua "Conversa" pelo `tabBarLabel` do layout.
  const headerOptions = useMemo(() => ({ title: name ?? 'Conversa' }), [name]);
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
  return <PatientPage footer={composer} stickToEnd>
    <Tabs.Screen options={headerOptions} />
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
      {!loading || messages.length ? <SkipInitialAppear><View accessibilityLiveRegion="polite" style={{ gap: Spacing.three }}>
        {groupMessagesByDay(messages).map((day) => <MessageDay key={day.key} label={day.label}>
          {day.messages.map((message) => {
            // A hora vai no balão e o dia no separador; o "Lida" só na última minha.
            const status = message.id === statusId ? (message.read_at ? 'Lida' : 'Enviada') : null;
            const meta = [formatTime(message.sent_at), status].filter(Boolean).join(' · ');
            // Numa conversa a dois o lado e a cor já dizem quem falou; o nome fica só para o leitor de tela.
            return <MessageBubble key={message.id} tone="patient" mine={message.mine} body={message.body} meta={meta}
              accessibilityLabel={`${message.mine ? 'Você' : bond.psychologist.name}: ${message.body}. ${[formatDateTime(message.sent_at), status].filter(Boolean).join(' · ')}`} />;
          })}
        </MessageDay>)}
      </View></SkipInitialAppear> : null}
    </> : null}
  </PatientPage>;
}

