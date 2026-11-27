import type { IconName } from '@/design-system';

// O desenho vem da família do tipo ("task.assigned" é tarefa); tipo desconhecido fica com o sino.
export function notificationIcon(type: string): IconName {
  const family = type.split('.')[0];
  if (family === 'message') return 'chat';
  if (family === 'task') return 'list-checks';
  if (family === 'appointment') return 'calendar';
  if (family === 'bond') return 'user-plus';
  return 'bell';
}
