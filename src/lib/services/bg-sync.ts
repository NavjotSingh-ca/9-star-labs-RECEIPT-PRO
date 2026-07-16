/**
 * Background Sync Service - Schedules offline receipts for retry when connectivity returns
 * Uses Background Sync API when available, falls back to polling
 */

export interface BackgroundSyncTask {
  id: string;
  url: string;
  options?: RequestInit;
  timestamp: number;
  retries: number;
}

const SYNC_QUEUE_KEY = 'bg-sync-queue';
const MAX_RETRIES = 5;

/**
 * Check if Background Sync API is supported
 */
export function supportsBackgroundSync(): boolean {
  return 'serviceWorker' in navigator && 'SyncManager' in window;
}

/**
 * Queue a task for background sync
 */
export async function queueForBackgroundSync(task: BackgroundSyncTask): Promise<boolean> {
  if (!supportsBackgroundSync()) {
    // Fallback: store in IndexedDB for polling-based retry
    return storeForPollingRetry(task);
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const syncRegistration = registration as unknown as { sync: { register: (tag: string) => Promise<void> } };
    await syncRegistration.sync.register(`receipt-sync-${task.id}`);

    // Store the payload in IndexedDB for the service worker to access
    const db = await openSyncDB();
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(task);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    return true;
  } catch {
    return storeForPollingRetry(task);
  }
}

/**
 * Fallback storage for browsers without Background Sync
 */
async function storeForPollingRetry(task: BackgroundSyncTask): Promise<boolean> {
  try {
    const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    queue.push(task);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch {
    return false;
  }
}

/**
 * Process queued tasks (called by service worker or polling interval)
 */
export async function processQueuedTasks(
  processFn: (task: BackgroundSyncTask) => Promise<void>
): Promise<{ processed: number; failed: number }> {
  if (!supportsBackgroundSync()) {
    return processPollingQueue(processFn);
  }

  // Service worker handles this via sync events
  return { processed: 0, failed: 0 };
}

/**
 * Process polling-based queue
 */
async function processPollingQueue(
  processFn: (task: BackgroundSyncTask) => Promise<void>
): Promise<{ processed: number; failed: number }> {
  const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
  let processed = 0;
  let failed = 0;

  for (const task of queue) {
    try {
      await processFn(task);
      processed++;
    } catch {
      if (task.retries < MAX_RETRIES) {
        task.retries++;
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify([...queue, task]));
      }
      failed++;
    }
  }

  localStorage.setItem(SYNC_QUEUE_KEY, '[]');
  return { processed, failed };
}

/**
 * Open IndexedDB for sync tasks
 */
async function openSyncDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('leduc-sync', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Register periodic sync for automatic retries (Chrome only)
 */
export async function registerPeriodicSync(): Promise<boolean> {
  if ('periodicSync' in (window as unknown as { periodicSync?: unknown })) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as unknown as { periodicSync: { register: (tag: string) => Promise<void> } }).periodicSync.register('receipt-sync-periodic');
      return true;
    } catch {
      return false;
    }
  }
  return false;
}