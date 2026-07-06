import type { ClientStatus } from './client';

export function statusClass(status: ClientStatus) {
  if (status === 'Terminado') return 'done';
  if (status === 'En proceso') return 'progress';
  return 'pending';
}
