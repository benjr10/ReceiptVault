"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { 
  getUserOfflineQueue, 
  processQueue, 
  mergeExpenses, 
  getCachedExpenses, 
  saveCachedExpenses 
} from "@/lib/offlineQueue";

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date?: string;
  created_at: string;
  project_client?: string | null;
  note?: string | null;
  receipt_url?: string | null;
  isOffline?: boolean;
  tempId?: string;
}

interface ExpensesContextType {
  expenses: Expense[];
  loading: boolean;
  refresh: () => Promise<void>;
  addExpenseLocally: (expense: Expense) => void;
  updateExpenseLocally: (tempId: string, realId: string) => void;
}

const ExpensesContext = createContext<ExpensesContextType>({
  expenses: [],
  loading: true,
  refresh: async () => {},
  addExpenseLocally: () => {},
  updateExpenseLocally: () => {},
});

export const useExpenses = () => useContext(ExpensesContext);

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  const loadCachedData = useCallback(() => {
    if (!user) return;
    
    const offlineExpenses = getUserOfflineQueue(user.id);
    const cachedExpenses = getCachedExpenses();
    
    const combined: any[] = [];
    
    for (const exp of offlineExpenses) {
      combined.push({
        ...exp,
        id: exp.tempId,
        isOffline: true,
      });
    }
    
    for (const exp of cachedExpenses) {
      combined.push({
        ...exp,
      });
    }
    
    combined.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    if (combined.length > 0) {
      setExpenses(combined);
    }
  }, [user]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (fetchInProgressRef.current && !forceRefresh) return;
    
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    fetchInProgressRef.current = true;
    
    // Only load from cache if we don't have any expenses yet to prevent flickering/overwriting optimistic updates
    if (expenses.length === 0) {
      loadCachedData();
    }

    if (!navigator.onLine) {
      setLoading(false);
      fetchInProgressRef.current = false;
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching expenses:", error);
      } else if (data && isMountedRef.current) {
        saveCachedExpenses(data);
        
        const offlineItems = getUserOfflineQueue(user.id);
        const merged = mergeExpenses(data, offlineItems);
        
        const sorted = merged.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setExpenses(sorted as Expense[]);
        console.log("Context updated from server. Count:", sorted.length);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      fetchInProgressRef.current = false;
    }
  }, [user, loadCachedData, expenses.length]);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const addExpenseLocally = useCallback((expense: Expense) => {
    console.log("Adding expense locally:", expense);
    setExpenses(prev => {
      if (prev.some(e => e.id === expense.id || (e.tempId && e.tempId === expense.tempId))) {
        console.log("Expense already exists in state, skipping local add");
        return prev;
      }
      const newState = [expense, ...prev].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      console.log("After add:", newState.length);
      console.log("Latest expense in state:", newState[0]);
      return newState;
    });
  }, []);

  const updateExpenseLocally = useCallback((tempId: string, realId: string) => {
    setExpenses(prev => prev.map(exp => {
      if (exp.tempId === tempId) {
        return { ...exp, id: realId, isOffline: false };
      }
      return exp;
    }));
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (user) {
      fetchData();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [user, fetchData]);

  useEffect(() => {
    const handleSync = async () => {
      if (user?.id && navigator.onLine) {
        await processQueue(user.id);
        await fetchData(true);
      }
    };

    const handleAdded = (e: any) => {
      if (e.detail) {
        addExpenseLocally(e.detail);
      }
    };

    const handleSynced = (e: any) => {
      if (e.detail) {
        const { tempId, realId } = e.detail;
        updateExpenseLocally(tempId, realId);
      }
    };

    window.addEventListener("online", handleSync);
    window.addEventListener("refresh-dashboard", refresh);
    window.addEventListener("expense-added", handleAdded);
    window.addEventListener("expense-synced", handleSynced);
    
    return () => {
      window.removeEventListener("online", handleSync);
      window.removeEventListener("refresh-dashboard", refresh);
      window.removeEventListener("expense-added", handleAdded);
      window.removeEventListener("expense-synced", handleSynced);
    };
  }, [user, fetchData, refresh, addExpenseLocally, updateExpenseLocally]);

  return (
    <ExpensesContext.Provider value={{ expenses, loading, refresh, addExpenseLocally, updateExpenseLocally }}>
      {children}
    </ExpensesContext.Provider>
  );
}
