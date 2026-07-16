/**
 * Offline Database Service - IndexedDB operations for full offline capability
 * Stores receipts, sync queue, and user preferences locally
 */

import { openDB, IDBPDatabase } from 'idb';

export interface OfflineReceipt {
  id: string;
  vendor_name: string;
  total_amount: number;
  transaction_date: string;
  category: string;
  gst_amount?: number;
  pst_amount?: number;
  notes?: string;
  image_url?: string;
  is_synced: boolean;
  last_modified: number;
  sync_attempts: number;
}

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  table: string;
  payload: Record<string, unknown>;
  timestamp: number;
  attempts: number;
  last_error?: string;
}

export interface OfflinePreferences {
  last_sync: number;
  pending_count: number;
  offline_mode: boolean;
  sync_strategy: 'auto' | 'manual';
}

let db: IDBPDatabase | null = null;

const DB_NAME = 'leduc-receipt-db';
const DB_VERSION = 2;

/**
 * Initialize the offline database
 */
export async function initOfflineDB(): Promise<IDBPDatabase> {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Receipts store
      if (!database.objectStoreNames.contains('receipts')) {
        const receiptStore = database.createObjectStore('receipts', { keyPath: 'id' });
        receiptStore.createIndex('by-date', 'transaction_date');
        receiptStore.createIndex('by-category', 'category');
        receiptStore.createIndex('by-synced', 'is_synced');
      }

      // Sync queue store
      if (!database.objectStoreNames.contains('sync_queue')) {
        const queueStore = database.createObjectStore('sync_queue', { keyPath: 'id' });
        queueStore.createIndex('by-timestamp', 'timestamp');
        queueStore.createIndex('by-attempts', 'attempts');
      }

      // Preferences store
      if (!database.objectStoreNames.contains('preferences')) {
        database.createObjectStore('preferences', { keyPath: 'key' });
      }
    },
  });

  return db;
}

/**
 * Get all unsynced receipts
 */
export async function getPendingReceipts(): Promise<OfflineReceipt[]> {
  const database = await initOfflineDB();
  return database.getAllFromIndex('receipts', 'by-synced', IDBKeyRange.only(false));
}

/**
 * Save a receipt locally (offline or online)
 */
export async function saveOfflineReceipt(receipt: OfflineReceipt): Promise<void> {
  const database = await initOfflineDB();
  receipt.is_synced = false;
  receipt.last_modified = Date.now();
  await database.put('receipts', receipt);
}

/**
 * Queue a receipt for sync
 */
export async function queueForSync(item: SyncQueueItem): Promise<void> {
  const database = await initOfflineDB();
  await database.put('sync_queue', item);
}

/**
 * Get sync queue size
 */
export async function getSyncQueueSize(): Promise<number> {
  const database = await initOfflineDB();
  return (await database.count('sync_queue')) || 0;
}

/**
 * Process sync queue
 */
export async function processSyncQueue(
  apiCall: (item: SyncQueueItem) => Promise<void>
): Promise<{ processed: number; failed: number }> {
  const database = await initOfflineDB();
  const items = await database.getAll('sync_queue');
  let processed = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await apiCall(item);
      await database.delete('sync_queue', item.id);

      // Mark receipt as synced
      if (item.table === 'receipts' && item.action !== 'delete') {
        const receipt = await database.get('receipts', item.id);
        if (receipt) {
          receipt.is_synced = true;
          await database.put('receipts', receipt);
        }
      }
      processed++;
    } catch (error) {
      item.attempts += 1;
      item.last_error = error instanceof Error ? error.message : 'Unknown error';
      await database.put('sync_queue', item);
      failed++;
    }
  }

  return { processed, failed };
}

/**
 * Get preferences
 */
export async function getPreferences(): Promise<OfflinePreferences> {
  const database = await initOfflineDB();
  const prefs = await database.get('preferences', 'main');
  return (
    prefs ?? {
      last_sync: 0,
      pending_count: 0,
      offline_mode: false,
      sync_strategy: 'auto',
    }
  );
}

/**
 * Save preferences
 */
export async function savePreferences(prefs: Partial<OfflinePreferences>): Promise<void> {
  const database = await initOfflineDB();
  const current = await getPreferences();
  await database.put('preferences', { ...current, ...prefs, key: 'main' });
}

/**
 * Clear all offline data
 */
export async function clearOfflineData(): Promise<void> {
  const database = await initOfflineDB();
  await database.clear('receipts');
  await database.clear('sync_queue');
  await database.clear('preferences');
}