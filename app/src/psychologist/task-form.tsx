import { useRef, useState } from 'react';
import { View } from 'react-native';

import { ApiError } from '@/api';
import { psychologistApi } from '@/api/psychologist';
import type { Task } from '@/api/psychologist/types';
import { Spacing, Text } from '@/design-system';
import { formatDueDate } from '@/psychologist/domain';
import { Action, Card, ErrorNotice, Field, useConfirmation } from '@/psychologist/ui';

type TaskFormProps = { bondId: number; readonly: boolean; tasks: Task[]; onChanged: () => void };

export function TaskForm({ bondId, readonly, tasks, onChanged }: TaskFormProps) {
  const [editing, setEditing] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dateError, setDateError] = useState<string>();
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const { ask, confirmation } = useConfirmation();
  const errors = error instanceof ApiError ? error.errors : undefined;

  function reset() {
    setEditing(null);
    setTitle('');
    setDescription('');
    setDueDate('');
    setDateError(undefined);
    setError(null);
  }

  async function save() {
    if (submitting.current || readonly) return;
    const due_date = formatDueDate(dueDate);
    setDateError(due_date ? undefined : 'Informe uma data válida no formato DD/MM/AAAA.');
    if (!due_date) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const input = { title, description: description || null, due_date };
      if (editing !== null) await psychologistApi.updateTask(editing, input);
      else await psychologistApi.createTask({ ...input, bond_id: bondId });
      reset();
      onChanged();
    } catch (failure) {
      setError(failure);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  async function archive(task: Task) {
    if (submitting.current || readonly) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      await psychologistApi.archiveTask(task.id);
      if (editing === task.id) reset();
      onChanged();
    } catch (failure) {
      setError(failure);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return <View style={{ gap: Spacing.three }}>
    {tasks.length === 0 ? <Text>Nenhuma tarefa neste vínculo.</Text> : null}
    {tasks.map((task) => <Card key={task.id}>
      <Text variant="h5">{task.title}</Text>
      {task.description ? <Text>{task.description}</Text> : null}
      <Text>{task.status === 'completed' ? 'Concluída' : 'Pendente'}</Text>
      {task.due_date ? <Text>Prazo: {task.due_date.split('-').reverse().join('/')}</Text> : null}
      {task.completed_at ? <Text>Concluída em {new Date(task.completed_at).toLocaleString('pt-BR')}</Text> : null}
      {!readonly && task.status === 'pending' ? <>
        <Action label={`Editar tarefa: ${task.title}`} disabled={busy} onPress={() => {
          setEditing(task.id); setTitle(task.title); setDescription(task.description ?? '');
          setDueDate(task.due_date?.split('-').reverse().join('/') ?? '');
          setError(null); setDateError(undefined);
        }} />
        <Action label={`Arquivar tarefa: ${task.title}`} disabled={busy} onPress={() => {
          ask('Arquivar tarefa?', `A tarefa "${task.title}" sairá da lista.`, () => archive(task));
        }} />
      </> : null}
    </Card>)}
    <ErrorNotice error={error} />
    {!readonly ? <Card>
      <Text variant="h5">{editing === null ? 'Nova tarefa' : 'Editar tarefa'}</Text>
      <Field label="Título da tarefa" value={title} onChangeText={setTitle} maxLength={150} error={errors?.title?.join(' ')} editable={!busy} />
      <Field label="Descrição da tarefa (opcional)" value={description} onChangeText={setDescription} multiline error={errors?.description?.join(' ')} editable={!busy} />
      <Field label="Prazo (DD/MM/AAAA)" value={dueDate} onChangeText={setDueDate} placeholder="DD/MM/AAAA" maxLength={10} error={dateError ?? errors?.due_date?.join(' ')} editable={!busy} />
      <Action label={busy ? 'Salvando tarefa...' : 'Salvar tarefa'} disabled={busy} onPress={() => { void save(); }} />
      {editing !== null ? <Action label="Cancelar edição da tarefa" disabled={busy} onPress={reset} /> : null}
    </Card> : null}
    {confirmation}
  </View>;
}
