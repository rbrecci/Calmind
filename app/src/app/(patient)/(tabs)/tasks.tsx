import { useState } from 'react';

import { patientApi } from '@/api/patient';
import { Button, formatDate, Text } from '@/design-system';
import { loadPatientPages } from '@/patient/load-pages';
import { errorMessage } from '@/patient/presentation';
import { splitTasks } from '@/patient/tasks';
import { Card, Feedback, PatientPage } from '@/patient/ui';
import type { PatientTask } from '@/api';
import { usePatientData } from '@/patient/use-patient-data';

async function loadTasks() {
  const [tasks, bonds] = await Promise.all([loadPatientPages(patientApi.tasks), loadPatientPages(patientApi.bonds)]);
  return { tasks: splitTasks(tasks), bonds };
}

export default function Tasks() {
  const { data, loading, error, reload } = usePatientData(loadTasks);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  async function complete(id: number) {
    setWorkingId(id); setActionError(null);
    try { await patientApi.completeTask(id); await reload(); }
    catch (e) { setActionError(errorMessage(e)); } finally { setWorkingId(null); }
  }
  function renderTask(task: PatientTask) {
    const active = data?.bonds.some((b) => b.id === task.bond_id && b.status === 'active');
    return <Card key={task.id}>
      <Text variant="h5">{task.title}</Text>
      {task.description ? <Text>{task.description}</Text> : null}
      <Text color="textSecondary">Prazo: {task.due_date ? formatDate(task.due_date) : 'Sem prazo'}</Text>
      <Text>{task.status === 'completed' ? 'Concluída' : 'Pendente'}</Text>
      {!active ? <Text variant="small" color="textSecondary">Vínculo encerrado. Somente leitura.</Text> : null}
      {active && task.status === 'pending' ? <Button tone="patient" label={workingId === task.id ? 'Concluindo...' : 'Marcar como concluída'}
        accessibilityLabel={`Marcar como concluída: ${task.title}`} disabled={workingId !== null || loading} onPress={() => void complete(task.id)} /> : null}
    </Card>;
  }
  return <PatientPage title="Minhas tarefas">
    <Text color="textSecondary">Atividades combinadas com seu psicólogo.</Text>
    <Feedback loading={loading} error={error} retry={() => void reload()} />
    {actionError ? <Text accessibilityRole="alert" color="error">{actionError}</Text> : null}
    {data && !data.tasks.pending.length && !data.tasks.completed.length && !loading && !error ? <Text>Nenhuma tarefa por enquanto.</Text> : null}
    {!error && data && (data.tasks.pending.length || data.tasks.completed.length) ? <>
      <Text variant="h5" accessibilityRole="header">Pendentes ({data.tasks.pending.length})</Text>
      {data.tasks.pending.length ? data.tasks.pending.map(renderTask) : <Text color="textSecondary">Nenhuma tarefa pendente.</Text>}
      <Text variant="h5" accessibilityRole="header">Concluídas ({data.tasks.completed.length})</Text>
      {data.tasks.completed.length ? data.tasks.completed.map(renderTask) : <Text color="textSecondary">Nenhuma tarefa concluída ainda.</Text>}
    </> : null}
    <Button tone="patient" variant="secondary" label="Atualizar tarefas" disabled={loading || workingId !== null} onPress={() => void reload()} />
  </PatientPage>;
}
