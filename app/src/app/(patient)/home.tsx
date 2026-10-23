import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { api, ApiError, type PatientTask } from '@/api';
import { Button, Colors, Radius, Screen, Spacing, Text } from '@/design-system';
import { useSession } from '@/session/session-context';

function displayDate(value: string | null): string | null {
  if (!value) return null;
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export default function PatientHome() {
  const { signOut } = useSession();
  const [tasks, setTasks] = useState<PatientTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await api.patientTasks();
      setTasks(result.data);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Não foi possível carregar as tarefas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.patientTasks()
      .then((result) => {
        if (!cancelled) setTasks(result.data);
      })
      .catch((error) => {
        if (!cancelled) setMessage(error instanceof ApiError ? error.message : 'Não foi possível carregar as tarefas.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function completeTask(id: number) {
    setWorkingId(id);
    setMessage(null);
    try {
      const updated = await api.completePatientTask(id);
      setTasks((current) => current.map((task) => task.id === id ? updated : task));
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Não foi possível concluir a tarefa.');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <Screen scroll>
      <Text variant="small" color="textSecondary">Calmind</Text>
      <Text variant="h3">Minhas tarefas</Text>
      <Text variant="small" color="textSecondary">Atividades combinadas com seu psicólogo.</Text>
      {message ? <Text variant="small" color="error" accessibilityRole="alert">{message}</Text> : null}
      {loading ? <Text>Carregando tarefas...</Text> : tasks.length === 0 ? (
        <Text>Nenhuma tarefa por enquanto.</Text>
      ) : tasks.map((task) => (
        <View key={task.id} style={styles.card}>
          <Text variant="h5">{task.title}</Text>
          {task.description ? <Text variant="small">{task.description}</Text> : null}
          {task.due_date ? <Text variant="small" color="textSecondary">Prazo: {displayDate(task.due_date)}</Text> : null}
          <Text variant="small" color={task.status === 'completed' ? 'success' : 'textSecondary'}>
            {task.status === 'completed' ? 'Concluída' : 'Pendente'}
          </Text>
          {task.status === 'pending' ? (
            <Button tone="patient" label={workingId === task.id ? 'Concluindo...' : 'Marcar como concluída'}
              disabled={workingId !== null} onPress={() => void completeTask(task.id)} />
          ) : null}
        </View>
      ))}
      <Button tone="patient" label="Atualizar tarefas" disabled={loading || workingId !== null}
        onPress={() => void loadTasks()} />
      <Button tone="patient" label="Sair" accessibilityLabel="Sair da conta" onPress={() => void signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.three, gap: Spacing.two },
});
