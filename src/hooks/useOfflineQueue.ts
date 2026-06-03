import { useState, useEffect, useCallback, useRef } from 'react';
import { openDB, type IDBPDatabase } from 'idb';

export interface QueueItem {
  id: string;
  payload: Record<string, unknown>;
  integrityHash: string;
  userId: string;
  timestamp: number;
}

export function useOfflineQueue(dbName = '9sl-offline', storeName = 'pending_scans') {
  const [db, setDb] = useState<IDBPDatabase | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const processingRef = useRef<Set<string>>(new Set());

  const updateQueueCount = useCallback(async (database: IDBPDatabase = db!) => {
    if (!database) return;
    const count = await database.count(storeName);
    setQueueCount(count);
  }, [db, storeName]);

  useEffect(() => {
    async function initDB() {
      const database = await openDB(dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        },
      });
      setDb(database);
      updateQueueCount(database);
    }
    initDB();
  }, [dbName, storeName, updateQueueCount]);

  async function enqueue(item: Omit<QueueItem, 'id' | 'timestamp'>) {
    if (!db) return;
    const id = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await db.put(storeName, {
      ...item,
      id,
      timestamp: Date.now(),
    });
    await updateQueueCount();
    return id;
  }

  async function dequeue(id: string) {
    if (!db) return;
    if (processingRef.current.has(id)) return;
    processingRef.current.add(id);
    try {
      await db.delete(storeName, id);
      await updateQueueCount();
    } finally {
      processingRef.current.delete(id);
    }
  }

  async function tryAcquireLock(id: string): Promise<boolean> {
    if (processingRef.current.has(id)) return false;
    processingRef.current.add(id);
    return true;
  }

  function releaseLock(id: string) {
    processingRef.current.delete(id);
  }

  async function getQueue(): Promise<QueueItem[]> {
    if (!db) return [];
    return db.getAll(storeName);
  }

  async function clearProcessed(ids: string[]) {
    if (!db) return;
    const tx = db.transaction(storeName, 'readwrite');
    await Promise.all(ids.map(id => tx.store.delete(id)));
    await tx.done;
    await updateQueueCount();
  }

  async function processChunked(callback: (chunk: QueueItem[]) => Promise<void>, chunkSize = 5) {
    if (!db) return;
    const tx = db.transaction(storeName, 'readonly');
    let cursor = await tx.store.openCursor();
    let chunk: QueueItem[] = [];
    while (cursor) {
      chunk.push(cursor.value);
      if (chunk.length >= chunkSize) {
        await callback(chunk);
        chunk = [];
      }
      cursor = await cursor.continue();
    }
    if (chunk.length > 0) {
      await callback(chunk);
    }
  }

  return {
    queueCount,
    enqueue,
    dequeue,
    getQueue,
    tryAcquireLock,
    releaseLock,
    clearProcessed,
    processChunked,
  };
}
