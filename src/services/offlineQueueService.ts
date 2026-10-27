/**
 * offlineQueueService.ts
 * Gestisce la coda di salvataggio offline per le segnalazioni e proposte dei cittadini.
 * Rileva il ritorno online (navigator.onLine + evento 'online') e ritenta la sincronizzazione.
 */

export interface QueuedSubmission {
  id: string;
  type: 'segnalazione' | 'proposta';
  timestamp: number;
  payload: any;
  status: 'pending' | 'syncing' | 'failed';
  attempts: number;
  error?: string;
}

const QUEUE_KEY = 'vp_offline_queue_v1';

export function getOfflineQueue(): QueuedSubmission[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: QueuedSubmission[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Impossibile salvare la coda offline:', e);
  }
}

export function enqueueSubmission(
  type: 'segnalazione' | 'proposta',
  payload: any
): QueuedSubmission {
  const queue = getOfflineQueue();
  const item: QueuedSubmission = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    timestamp: Date.now(),
    payload,
    status: 'pending',
    attempts: 0,
  };
  queue.push(item);
  saveOfflineQueue(queue);
  return item;
}

export function removeQueueItem(id: string): void {
  const queue = getOfflineQueue().filter((q) => q.id !== id);
  saveOfflineQueue(queue);
}

export function getPendingQueueCount(): number {
  return getOfflineQueue().filter((q) => q.status === 'pending' || q.status === 'failed').length;
}

/**
 * Tenta di svuotare la coda sincronizzando gli elementi col server WordPress
 */
export async function flushOfflineQueue(
  sendFn: (item: QueuedSubmission) => Promise<boolean>
): Promise<{ processed: number; succeeded: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { processed: 0, succeeded: 0 };

  let succeeded = 0;
  const remaining: QueuedSubmission[] = [];

  for (const item of queue) {
    try {
      item.status = 'syncing';
      item.attempts += 1;
      const ok = await sendFn(item);
      if (ok) {
        succeeded += 1;
      } else {
        item.status = 'failed';
        remaining.push(item);
      }
    } catch (e: any) {
      item.status = 'failed';
      item.error = e?.message || 'Errore di rete';
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);
  return { processed: queue.length, succeeded };
}
