import { useState } from 'react';

import { patientApi } from '@/api/patient';
import { Button, EmptyState, ExpandableCard, taskDeadlineTag, Text } from '@/design-system';
import { loadPatientPages } from '@/patient/load-pages';
import { errorMessage } from '@/patient/presentation';
import { splitTasks } from '@/patient/tasks';
import { Feedback, PatientPage } from '@/patient/ui';
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
  // Um cartão aberto por vez. Antes de qualquer toque, abre a primeira pendente; tocar no aberto
  // fecha todos (`null`).
  const [openId, setOpenId] = useState<number | null | undefined>(undefined);
  const expandedId = openId === undefined ? data?.tasks.pending[0]?.id : openId;
  async function complete(id: number) {
    setWorkingId(id); setActionError(null);
    try { await patientApi.completeTask(id); await reload(); }
    catch (e) { setActionError(errorMessage(e)); } finally { setWorkingId(null); }
  }
  function renderTask(task: PatientTask) {
    const active = data?.bonds.some((b) => b.id === task.bond_id && b.status === 'active');
    const expanded = task.id === expandedId;
    const body = [
      task.description ? <Text key="description" color="textSecondary">{task.description}</Text> : null,
      !active ? <Text key="readonly" variant="small" color="textSecondary">Vínculo encerrado. Somente leitura.</Text> : null,
      active && task.status === 'pending' ? <Button key="complete" tone="patient" variant="secondary" label={workingId === task.id ? 'Concluindo...' : 'Marcar como concluída'}
        accessibilityLabel={`Marcar como concluída: ${task.title}`} disabled={workingId !== null || loading} onPress={() => void complete(task.id)} /> : null,
    ].filter(Boolean);
    // A seção ("Pendentes", "Concluídas") diz o estado; a etiqueta diz o prazo ou o dia em que foi feita.
    return <ExpandableCard key={task.id} title={task.title} tag={taskDeadlineTag(task)} muted={task.status === 'completed'}
      expanded={expanded} onToggle={() => setOpenId(expanded ? null : task.id)}>
      {body.length ? body : null}
    </ExpandableCard>;
  }
  return <PatientPage onRefresh={reload}>
    <Feedback loading={loading} error={error} retry={() => void reload()} initial={data === null} />
    {actionError ? <Text accessibilityRole="alert" color="error">{actionError}</Text> : null}
    {/* Sem `!loading`: o vazio fica na tela enquanto a aba recarrega, como a lista fica, e a
        ilustração não refaz a entrada a cada visita. */}
    {data && !data.tasks.pending.length && !data.tasks.completed.length && !error ? <EmptyState illustration="tarefas" title="Nenhuma tarefa por enquanto" /> : null}
    {!error && data && (data.tasks.pending.length || data.tasks.completed.length) ? <>
      <Text variant="h5" accessibilityRole="header">Pendentes</Text>
      {data.tasks.pending.length ? data.tasks.pending.map(renderTask) : <Text color="textSecondary">Nenhuma tarefa pendente.</Text>}
      <Text variant="h5" accessibilityRole="header">Concluídas</Text>
      {data.tasks.completed.length ? data.tasks.completed.map(renderTask) : <Text color="textSecondary">Nenhuma tarefa concluída ainda.</Text>}
    </> : null}
  </PatientPage>;
}
