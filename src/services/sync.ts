import { db } from "@/src/database/schema";
import AsyncStorage from "@react-native-async-storage/async-storage";

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export type SyncAction = 'create' | 'update' | 'delete';
export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface SyncQueueItem {
  id: string;
  action: SyncAction;
  entity: string;
  record_id: string;
  payload: string;
  attempts: number;
  status: SyncStatus;
  created_at: number;
  updated_at: number;
}

export async function addToQueue(
  action: SyncAction,
  entity: string,
  recordId: string,
  payload: any
) {
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  await db.runAsync(
    `INSERT INTO sync_queue (id, action, entity, record_id, payload, attempts, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id(),
    action,
    entity,
    recordId,
    payloadStr,
    0,
    'pending',
    Date.now(),
    Date.now()
  );
  console.log(`[Sync] Added to queue: ${action} ${entity} ${recordId}`);
}

export async function getPendingQueue() {
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC`
  );
  return rows.map((r: any) => ({
    id: r.id,
    action: r.action,
    entity: r.entity,
    record_id: r.record_id,
    payload: r.payload,
    attempts: r.attempts,
    status: r.status,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

export async function markSynced(id: string) {
  await db.runAsync(
    `UPDATE sync_queue SET status = 'synced', updated_at = ? WHERE id = ?`,
    Date.now(),
    id
  );
  console.log(`[Sync] Marked as synced: ${id}`);
}

export async function markFailed(id: string) {
  await db.runAsync(
    `UPDATE sync_queue SET status = 'failed', attempts = attempts + 1, updated_at = ? WHERE id = ?`,
    Date.now(),
    id
  );
  console.log(`[Sync] Marked as failed: ${id}`);
}

export async function clearSynced() {
  await db.runAsync(`DELETE FROM sync_queue WHERE status = 'synced'`);
  console.log('[Sync] Cleared synced items.');
}

export async function getSyncCount() {
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'`
  );
  return result?.count || 0;
}

// ========== ACTUAL SYNC FUNCTION (Simulated Backend) ==========
export async function syncWithBackend() {
  const pending = await getPendingQueue();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      // Simulate backend API call
      // In production, this would be: await fetch('https://api.praxis.com/sync', { ... })
      console.log(`[Sync] Syncing ${item.action} ${item.entity} ${item.record_id}`);
      console.log(`[Sync] Payload: ${item.payload.substring(0, 100)}...`);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Simulate success (95% success rate for demo)
      if (Math.random() > 0.05) {
        await markSynced(item.id);
        synced++;
      } else {
        throw new Error('Simulated sync failure');
      }
    } catch (e) {
      console.error(`[Sync] Failed to sync ${item.id}:`, e);
      await markFailed(item.id);
      failed++;
    }
  }

  return { synced, failed };
}

// ========== AUTO-SYNC ON APP START ==========
let syncInProgress = false;

export async function autoSync() {
  if (syncInProgress) return;
  syncInProgress = true;
  try {
    const count = await getSyncCount();
    if (count > 0) {
      console.log(`[Sync] Auto-sync starting... ${count} items pending`);
      const result = await syncWithBackend();
      console.log(`[Sync] Auto-sync complete: ${result.synced} synced, ${result.failed} failed`);
    }
  } catch (e) {
    console.error('[Sync] Auto-sync error:', e);
  } finally {
    syncInProgress = false;
  }
}
