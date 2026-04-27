import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

const PENDING_EXPENSES_KEY = 'receiptvault_pending_expenses';

export interface PendingExpense {
  tempId: string;
  user_id: string;
  title: string;
  amount: number;
  category?: string;
  note?: string;
  project_client?: string;
  created_at: string;
}

export function useOfflineExpenses(userId: string | undefined) {
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(PENDING_EXPENSES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PendingExpense[];
        setPendingExpenses(parsed.filter(e => e.user_id === userId));
      } catch (e) {
        console.error('Error loading pending expenses:', e);
      }
    }
  }, [userId]);

  const savePendingExpense = useCallback(async (expense: Omit<PendingExpense, 'tempId'>) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newExpense: PendingExpense = { ...expense, tempId };
    
    const updated = [...pendingExpenses, newExpense];
    setPendingExpenses(updated);
    localStorage.setItem(PENDING_EXPENSES_KEY, JSON.stringify(updated));
    
    return tempId;
  }, [pendingExpenses]);

  const syncPendingExpenses = useCallback(async () => {
    if (!userId || pendingExpenses.length === 0) return;
    
    const remaining: PendingExpense[] = [];
    
    for (const expense of pendingExpenses) {
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
        
        if (error) {
          console.error('Error syncing expense:', error);
          remaining.push(expense);
        }
      } catch (e) {
        console.error('Error syncing expense:', e);
        remaining.push(expense);
      }
    }
    
    setPendingExpenses(remaining);
    localStorage.setItem(PENDING_EXPENSES_KEY, JSON.stringify(remaining));
    
    if (remaining.length < pendingExpenses.length) {
      window.dispatchEvent(new CustomEvent('expense-added'));
    }
  }, [pendingExpenses, userId]);

  const removePendingExpense = useCallback((tempId: string) => {
    const updated = pendingExpenses.filter(e => e.tempId !== tempId);
    setPendingExpenses(updated);
    localStorage.setItem(PENDING_EXPENSES_KEY, JSON.stringify(updated));
  }, [pendingExpenses]);

  return {
    pendingExpenses,
    savePendingExpense,
    syncPendingExpenses,
    removePendingExpense,
    hasPendingExpenses: pendingExpenses.length > 0,
  };
}