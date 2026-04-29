import { supabase } from './supabase';

const OFFLINE_QUEUE_KEY = 'receiptvault_offline_queue';
const CACHED_EXPENSES_KEY = 'receiptvault_cached_expenses';
const LAST_SYNC_KEY = 'receiptvault_last_sync';

export interface OfflineExpense {
  tempId: string;
  user_id: string;
  title: string;
  amount: number;
  category?: string;
  note?: string;
  project_client?: string;
  created_at: string;
  receipt_url?: string;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  realId?: string;
  isOffline: true;
  createdAt: number;
  retryCount: number;
  lastAttempt?: number;
}

export interface CachedExpense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category?: string;
  note?: string;
  project_client?: string;
  created_at: string;
  receipt_url?: string;
}

export function getOfflineQueue(): OfflineExpense[] {
  const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveToOfflineQueue(expense: Omit<OfflineExpense, 'status' | 'isOffline' | 'createdAt' | 'retryCount'>): void {
  const queue = getOfflineQueue();
  const newExpense: OfflineExpense = {
    ...expense,
    status: 'pending',
    isOffline: true,
    createdAt: Date.now(),
    retryCount: 0,
  };
  queue.push(newExpense);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function updateQueueItem(tempId: string, updates: Partial<OfflineExpense>): void {
  const queue = getOfflineQueue();
  const index = queue.findIndex(e => e.tempId === tempId);
  if (index !== -1) {
    queue[index] = { ...queue[index], ...updates };
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }
}

export function removeFromOfflineQueue(tempId: string): void {
  const queue = getOfflineQueue();
  const updated = queue.filter(e => e.tempId !== tempId);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
}

export function getUserOfflineQueue(userId: string): OfflineExpense[] {
  const queue = getOfflineQueue();
  return queue.filter(e => e.user_id === userId);
}

export function clearUserOfflineQueue(userId: string): void {
  const queue = getOfflineQueue();
  const updated = queue.filter(e => e.user_id !== userId);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
}

export function getPendingCount(userId: string): number {
  return getUserOfflineQueue(userId).filter(e => e.status === 'pending' || e.status === 'failed').length;
}

export async function syncExpense(expense: OfflineExpense): Promise<{ success: boolean; realId?: string; error?: string }> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: expense.user_id,
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      note: expense.note,
      project_client: expense.project_client,
      created_at: expense.created_at,
      receipt_url: expense.receipt_url,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (data) {
    return { success: true, realId: data.id };
  }

  return { success: false, error: 'Unknown error' };
}

export async function processQueue(userId: string): Promise<{ synced: number; failed: number }> {
  const queue = getUserOfflineQueue(userId);
  let synced = 0;
  let failed = 0;

  for (const expense of queue) {
    if (expense.status === 'pending' || expense.status === 'failed') {
      updateQueueItem(expense.tempId, { status: 'syncing', lastAttempt: Date.now() });

      const result = await syncExpense(expense);

      if (result.success) {
        updateQueueItem(expense.tempId, { 
          status: 'synced', 
          realId: result.realId 
        });
        
        // Add immediately to cache to prevent disappearing
        const cached = getCachedExpenses();
        const newCached = cached.filter(e => e.id !== result.realId);
        newCached.unshift({
          id: result.realId!,
          user_id: expense.user_id,
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
          note: expense.note,
          project_client: expense.project_client,
          created_at: expense.created_at,
          receipt_url: expense.receipt_url,
        });
        saveCachedExpenses(newCached);

        synced++;
        
        window.dispatchEvent(new CustomEvent('expense-synced', {
          detail: { tempId: expense.tempId, realId: result.realId }
        }));
      } else {
        updateQueueItem(expense.tempId, {
          status: 'failed',
          retryCount: expense.retryCount + 1,
        });
        failed++;
      }
    }
  }

  if (synced > 0) {
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    window.dispatchEvent(new CustomEvent('expense-added'));
  }

  return { synced, failed };
}

export function getCachedExpenses(): CachedExpense[] {
  const stored = localStorage.getItem(CACHED_EXPENSES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveCachedExpenses(expenses: CachedExpense[]): void {
  localStorage.setItem(CACHED_EXPENSES_KEY, JSON.stringify(expenses));
}

export function getLastSyncTime(): number | null {
  const stored = localStorage.getItem(LAST_SYNC_KEY);
  if (!stored) return null;
  const time = parseInt(stored, 10);
  return isNaN(time) ? null : time;
}

export function mergeExpenses(remote: CachedExpense[], offline: OfflineExpense[]): (CachedExpense & { isOffline?: boolean; tempId?: string })[] {
  const merged = new Map<string, CachedExpense & { isOffline?: boolean; tempId?: string }>();
  const syncedToPrune: string[] = [];

  // 1. Add all remote expenses to the map
  for (const exp of remote) {
    merged.set(exp.id, { ...exp });
  }
  
  // 2. Process offline expenses and reconcile
  for (const exp of offline) {
    let isMatched = false;

    // Reconciliation strategy 1: Direct realId match
    if (exp.status === 'synced' && exp.realId && merged.has(exp.realId)) {
      isMatched = true;
      syncedToPrune.push(exp.tempId);
    } 
    
    // Reconciliation strategy 2: Composite key fallback (createdAt + amount + title + category)
    if (!isMatched) {
      const expKey = `${exp.created_at}_${exp.amount}_${exp.title}_${exp.category || ''}`;
      
      for (const remoteExp of remote) {
        const remoteKey = `${remoteExp.created_at}_${remoteExp.amount}_${remoteExp.title}_${remoteExp.category || ''}`;
        if (expKey === remoteKey) {
          isMatched = true;
          if (exp.status === 'synced') {
            syncedToPrune.push(exp.tempId);
          }
          break;
        }
      }
    }

    // If not found in remote, include it in the merged list
    if (!isMatched) {
      merged.set(exp.tempId, {
        ...exp,
        id: exp.realId || exp.tempId,
        isOffline: exp.status !== 'synced',
      });
    }
  }
  
  // 3. Silent pruning of confirmed items
  if (syncedToPrune.length > 0) {
    setTimeout(() => {
      syncedToPrune.forEach(tempId => removeFromOfflineQueue(tempId));
    }, 100);
  }
  
  return Array.from(merged.values());
}