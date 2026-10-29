import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { patientApi } from '@/api/patient';
import type { Message } from '@/api/patient/types';
import { Button, Colors, Radius, RoleColors, Spacing, Text, TextField } from '@/design-system';
import { selectBond } from '@/patient/bonds';
import { deliverMessage, mergeMessages, watchConversation } from '@/patient/conversation';
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
  return <PatientPage title="Conversa">
    <Feedback loading={bonds.loading} error={bonds.error} retry={() => void bonds.reload()} />
    {!bonds.loading && !bonds.error && !bond ? <Text>Nenhum vínculo disponível para esta conversa.</Text> : null}
    {bond ? <>
      <Text variant="h5">{bond.psychologist.name}</Text>
      <Text variant="small" color="textSecondary">CRP {bond.psychologist.crp}</Text>
      {bond.status !== 'active' ? <Text>Este vínculo não está ativo. Conversa somente para leitura.</Text> : null}
      <Feedback loading={loading} error={error} retry={() => void watcher.current?.refresh()} />
      {!loading && !messages.length && !error ? <Text>Nenhuma mensagem por enquanto.</Text> : null}
      <View accessibilityLiveRegion="polite" style={styles.history}>
        {messages.map((message) => <View key={message.id} style={[styles.message, message.mine ? styles.mine : styles.theirs]}>
          <Text variant="small">{message.mine ? 'Você' : bond.psychologist.name}</Text>
          <Text>{message.body}</Text>
          <Text variant="small" color={message.mine ? 'text' : 'textSecondary'}>{new Date(message.sent_at).toLocaleString('pt-BR')}</Text>
          {message.mine ? <Text variant="small">{message.read_at ? 'Lida' : 'Enviada'}</Text> : null}
        </View>)}
      </View>
      {bond.status === 'active' ? <>
        {failed !== null ? <Card>
          <Text accessibilityRole="alert" color="error">Não enviada. {sendError}</Text>
          <Text>{failed}</Text>
          <Button tone="patient" label="Reenviar" disabled={sending} onPress={() => void send(failed)} />
          <Button tone="patient" label="Editar mensagem" disabled={sending} onPress={() => { setDraft(failed); setFailed(null); setSendError(null); }} />
        </Card> : <>
          <TextField label="Mensagem" accessibilityLabel="Texto da mensagem" value={draft} onChangeText={setDraft}
            multiline maxLength={2000} editable={!sending} />
          <Button tone="patient" label={sending ? 'Enviando...' : 'Enviar mensagem'} disabled={sending || !draft.trim()} onPress={() => void send(draft)} />
        </>}
      </> : null}
    </> : null}
  </PatientPage>;
}

const styles = StyleSheet.create({
  history: { gap: Spacing.two },
  message: { maxWidth: '92%', padding: Spacing.three, gap: Spacing.one, borderRadius: Radius.md },
  mine: { backgroundColor: RoleColors.patient.accent, alignSelf: 'flex-end' },
  theirs: { backgroundColor: Colors.surface, alignSelf: 'flex-start' },
});
