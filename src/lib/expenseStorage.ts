import { supabase } from './supabase';

const PENDING_EXPENSES_KEY = 'receiptvault_pending_expenses';
const CACHED_EXPENSES_KEY = 'receiptvault_cached_expenses';

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

export function savePendingExpense(expense: CachedExpense & { tempId: string }) {
  const stored = localStorage.getItem(PENDING_EXPENSES_KEY);
  const pending = stored ? JSON.parse(stored) : [];
  pending.push(expense);
  localStorage.setItem(PENDING_EXPENSES_KEY, JSON.stringify(pending));
}

export function getPendingExpenses(userId: string): CachedExpense[] {
  const stored = localStorage.getItem(PENDING_EXPENSES_KEY);
  if (!stored) return [];
  try {
    const pending = JSON.parse(stored) as CachedExpense[];
    return pending.filter(e => e.user_id === userId);
  } catch {
    return [];
  }
}

export function removePendingExpense(tempId: string) {
  const stored = localStorage.getItem(PENDING_EXPENSES_KEY);
  if (!stored) return;
  const pending = JSON.parse(stored);
  const updated = pending.filter((e: any) => e.tempId !== tempId);
  localStorage.setItem(PENDING_EXPENSES_KEY, JSON.stringify(updated));
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

export function saveCachedExpenses(expenses: CachedExpense[]) {
  localStorage.setItem(CACHED_EXPENSES_KEY, JSON.stringify(expenses));
}

export async function syncPendingExpenses(userId: string): Promise<void> {
  const pending = getPendingExpenses(userId);
  if (pending.length === 0) return;

  for (const expense of pending) {
    try {
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
        })
        .select()
        .single();

      if (!error && data) {
        removePendingExpense((expense as any).tempId);
      }
    } catch (e) {
      console.error('Error syncing expense:', e);
    }
  }
}