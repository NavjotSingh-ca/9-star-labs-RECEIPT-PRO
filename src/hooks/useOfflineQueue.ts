import { useState, useEffect, useCallback, useRef } from 'react';
import { openDB, type IDBPDatabase } from 'idb';

export interface QueueItem {
  id: string;
  payload: Record<string, unknown>;
  integrityHash: string;
  userId: string;
  timestamp: number;
  retryCount?: number;
  lastRetry?: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Conflict resolution strategy for sync conflicts:
 * - 'server-wins': Server data takes precedence (default)
 * - 'client-wins': Client data takes precedence
 * - 'merge': Attempt to merge fields where possible
 * - 'prompt': Return conflict for user resolution (via callback)
 */
export type ConflictResolution = 'server-wins' | 'client-wins' | 'merge' | 'prompt';

/**
 * Conflict information for user-facing resolution.
 */
export interface SyncConflict {
  id: string;
  type: 'duplicate-key' | 'version-mismatch' | 'constraint-violation';
  localData: QueueItem;
  serverData?: Record<string, unknown>;
  timestamp: number;
}

/**
 * IndexedDB-backed offline queue for pending scan operations.
 * Items are persisted across page reloads and processed when connectivity returns.
 *
 * @param dbName - Name of the IndexedDB database (default: `'9sl-offline'`).
 * @param storeName - Name of the object store (default: `'pending_scans'`).
 */
export function useOfflineQueue(dbName = '9sl-offline', storeName = 'pending_scans') {
  const [db, setDb] = useState<IDBPDatabase | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const processingRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);

  const updateQueueCount = useCallback(
    async (database?: IDBPDatabase) => {
      const target = database ?? db;
      if (!target) return;
      const count = await target.count(storeName);
      if (mountedRef.current) {
        setQueueCount(count);
      }
    },
    [db, storeName],
  );

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    async function initDB() {
      const database = await openDB(dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        },
      });
      if (!active) {
        database.close();
        return;
      }
      setDb(database);
      await updateQueueCount(database);
    }

    initDB().catch(() => {
      // IndexedDB init failure is non-fatal — app degrades gracefully
    });

    return () => {
      active = false;
      mountedRef.current = false;
    };
  }, [dbName, storeName, updateQueueCount]);

  const enqueue = useCallback(
    async (item: Omit<QueueItem, 'id' | 'timestamp' | 'retryCount' | 'lastRetry'>): Promise<string | undefined> => {
      if (!db) return undefined;
      const id =
        typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await db.put(storeName, {
        ...item,
        id,
        timestamp: Date.now(),
        retryCount: 0,
        lastRetry: 0,
      });
      await updateQueueCount();
      return id;
    },
    [db, storeName, updateQueueCount],
  );

  const dequeue = useCallback(
    async (id: string) => {
      if (!db) return;
      if (processingRef.current.has(id)) return;
      processingRef.current.add(id);
      try {
        await db.delete(storeName, id);
        await updateQueueCount();
      } finally {
        processingRef.current.delete(id);
      }
    },
    [db, storeName, updateQueueCount],
  );

  const tryAcquireLock = useCallback((id: string): boolean => {
    if (processingRef.current.has(id)) return false;
    processingRef.current.add(id);
    return true;
  }, []);

  const releaseLock = useCallback((id: string) => {
    processingRef.current.delete(id);
  }, []);

  const getQueue = useCallback(async (): Promise<QueueItem[]> => {
    if (!db) return [];
    return db.getAll(storeName);
  }, [db, storeName]);

  const clearProcessed = useCallback(
    async (ids: string[]) => {
      if (!db) return;
      const tx = db.transaction(storeName, 'readwrite');
      await Promise.all(ids.map((id) => tx.store.delete(id)));
      await tx.done;
      await updateQueueCount();
    },
    [db, storeName, updateQueueCount],
  );

  /**
   * Calculate delay with exponential backoff and jitter
   */
  const calculateBackoffDelay = useCallback(
    (retryCount: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number => {
      const delay = Math.min(
        config.baseDelayMs * Math.pow(config.backoffMultiplier, retryCount),
        config.maxDelayMs
      );
      // Add jitter (±25%) to prevent thundering herd
      const jitter = delay * 0.25 * (Math.random() * 2 - 1);
      return Math.floor(delay + jitter);
    },
    []
  );

  /**
   * Process queue with exponential backoff retry logic
   */
  const processQueue = useCallback(
    async (
      processItem: (item: QueueItem) => Promise<void>,
      config: RetryConfig = DEFAULT_RETRY_CONFIG,
      maxConcurrent = 3
    ): Promise<void> => {
      if (!db) return;
      
      const items = await db.getAll(storeName);
      if (items.length === 0) return;

      // Sort by timestamp (oldest first) and retry count (fewest retries first)
      items.sort((a, b) => {
        const retryDiff = (a.retryCount ?? 0) - (b.retryCount ?? 0);
        if (retryDiff !== 0) return retryDiff;
        return (a.timestamp ?? 0) - (b.timestamp ?? 0);
      });

      let processing = 0;
      let index = 0;

      const processNext = async (): Promise<void> => {
        if (index >= items.length) return;
        if (processing >= maxConcurrent) return;

        const item = items[index++];
        processing++;

        try {
          if (!tryAcquireLock(item.id)) {
            processing--;
            await processNext();
            return;
          }

          // Check if we should retry this item
          const retryCount = item.retryCount ?? 0;
          if (retryCount >= config.maxRetries) {
            // Max retries exceeded - could move to dead letter queue
            console.warn(`Item ${item.id} exceeded max retries, skipping`);
            releaseLock(item.id);
            await dequeue(item.id);
            processing--;
            await processNext();
            return;
          }

          // Calculate delay since last retry
          const lastRetry = item.lastRetry ?? 0;
          const now = Date.now();
          const minDelay = calculateBackoffDelay(retryCount, config);
          if (lastRetry > 0 && now - lastRetry < minDelay) {
            // Not enough time has passed since last retry
            releaseLock(item.id);
            processing--;
            // Schedule retry
            setTimeout(() => processNext(), minDelay - (now - lastRetry));
            return;
          }

          // Update retry count and timestamp
          await db.put(storeName, {
            ...item,
            retryCount: retryCount + 1,
            lastRetry: now,
          });

          // Process the item
          await processItem(item);

          // Success - remove from queue
          await dequeue(item.id);
        } catch (error) {
          console.error(`Failed to process queue item ${item.id}:`, error);
          // Keep in queue for retry - the retry count was already incremented
        } finally {
          releaseLock(item.id);
          processing--;
          await processNext();
        }
      };

      // Start initial concurrent workers
      const workers = Array.from({ length: Math.min(maxConcurrent, items.length) }, () => processNext());
      await Promise.all(workers);
    },
    [db, storeName, dequeue, tryAcquireLock, releaseLock, calculateBackoffDelay]
  );

  const processChunked = useCallback(
    async (callback: (chunk: QueueItem[]) => Promise<void>, chunkSize = 5) => {
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
    },
    [db, storeName],
  );

  const conflictsRef = useRef<SyncConflict[]>([]);

  /**
   * Check for potential conflicts before processing (e.g., duplicate detection).
   */
  const checkConflicts = useCallback(async (item: QueueItem): Promise<SyncConflict | null> => {
    // Check for duplicate_hash or other constraint violations
    if (item.payload.duplicate_hash) {
      // This would typically check against the server to detect duplicates
      // For now, we return null and let server-side validation handle it
    }
    return null;
  }, []);

  /**
   * Resolve conflicts using the specified strategy.
   */
  const resolveConflict = useCallback(
    (conflict: SyncConflict, strategy: ConflictResolution, onPrompt?: (conflict: SyncConflict) => Promise<'server-wins' | 'client-wins'>): Record<string, unknown> | null => {
      if (strategy === 'prompt') {
        onPrompt?.(conflict);
        return null; // Will be resolved by user
      }

      if (strategy === 'server-wins' && conflict.serverData) {
        return { ...conflict.serverData };
      }

      if (strategy === 'client-wins') {
        return { ...conflict.localData.payload };
      }

      if (strategy === 'merge') {
        // Merge strategy: prefer server timestamps but keep client values
        const merged = { ...conflict.localData.payload };
        if (conflict.serverData) {
          // Keep server's integrity_hash and audit fields
          merged.integrity_hash = conflict.serverData.integrity_hash;
          merged.updated_at = conflict.serverData.updated_at;
        }
        return merged;
      }

      return { ...conflict.localData.payload };
    },
    []
  );

  /**
   * Process with conflict resolution support.
   */
  const processWithConflictResolution = useCallback(
    async (
      processItem: (item: QueueItem) => Promise<void>,
      config: RetryConfig = DEFAULT_RETRY_CONFIG,
      conflictStrategy: ConflictResolution = 'server-wins',
      onConflictPrompt?: (conflict: SyncConflict) => Promise<'server-wins' | 'client-wins'>
    ): Promise<{ processed: number; conflicts: SyncConflict[] }> => {
      if (!db) return { processed: 0, conflicts: [] };

      const items = await db.getAll(storeName);
      const conflicts: SyncConflict[] = [];

      // Process items and detect conflicts
      for (const item of items) {
        const conflict = await checkConflicts(item);
        if (conflict) {
          conflicts.push(conflict);
          const resolved = resolveConflict(conflict, conflictStrategy, onConflictPrompt);
          if (resolved) {
            // Update item with resolved data and retry
            item.payload = resolved;
            await db.put(storeName, { ...item, retryCount: 0 });
          } else {
            // Conflict not resolved, skip this item
            await db.delete(storeName, item.id);
          }
        }
      }

      // Store conflicts in ref for UI access
      conflictsRef.current = conflicts;

      // Continue with normal processing
      await processQueue(processItem, config);

      return { processed: items.length - conflicts.length, conflicts };
    },
    [db, storeName, checkConflicts, resolveConflict, processQueue]
  );

  /**
   * Get all unresolved conflicts.
   */
  const getConflicts = useCallback(() => conflictsRef.current, []);

  /**
   * Clear resolved conflicts from the list.
   */
  const clearConflicts = useCallback(() => {
    conflictsRef.current = [];
  }, []);

  return {
    queueCount,
    enqueue,
    dequeue,
    getQueue,
    tryAcquireLock,
    releaseLock,
    clearProcessed,
    processChunked,
    processQueue,
    processWithConflictResolution,
    getConflicts,
    clearConflicts,
  };
}
