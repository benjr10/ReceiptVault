"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, Search, SlidersHorizontal, WifiOff, X, Check } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import OfflineBanner from "@/components/OfflineBanner";
import { supabase } from "@/lib/supabase";
import EditExpenseModal from "@/components/EditExpenseModal";
import { getCategoryIcon, getCategoryLabel, getCategoryColor } from "@/lib/categories";
import { useAuth } from "@/components/AuthContext";
import { formatCurrency } from "@/lib/currency";
import {
  getUserOfflineQueue,
  processQueue,
  mergeExpenses,
  getCachedExpenses,
  saveCachedExpenses,
} from "@/lib/offlineQueue";

export const dynamic = 'force-dynamic';

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  project_client: string | null;
  note: string | null;
  created_at: string;
  receipt_url?: string;
  isOffline?: boolean;
  tempId?: string;
}

interface ExpenseGroup {
  title: string;
  data: Expense[];
}

type DateFilter = 'all' | 'today' | '7days' | '30days';

const DEFAULT_CATEGORIES = [
  'Transport', 'Food & Meals', 'Office', 'Software', 'Rent', 'Marketing', 'Miscellaneous'
];

export default function ExpensesPage() {
  const { user, currency } = useAuth();
  const [isOffline, setIsOffline] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [hydrated, setHydrated] = useState(false);
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    expenses.forEach(exp => {
      if (exp.category) cats.add(exp.category);
    });
    return Array.from(cats).sort();
  }, [expenses]);

  const hasActiveFilters = selectedCategories.length > 0 || dateFilter !== 'all';

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleOnline = async () => {
    setIsOffline(false);
    if (user) {
      await processQueue(user.id);
      fetchExpenses();
    }
  };

  const handleOffline = () => setIsOffline(true);

  const handleRefresh = () => {
    if (!fetchInProgressRef.current) {
      hydrateAndFetch();
    }
  };

  const handleExpenseSynced = useCallback((e: CustomEvent) => {
    const { tempId, realId } = e.detail;
    setExpenses(prev => prev.map(exp => {
      if (exp.tempId === tempId) {
        return { ...exp, id: realId, isOffline: false, tempId: undefined };
      }
      return exp;
    }));
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("refresh-dashboard", handleRefresh);
    window.addEventListener("expense-synced", handleExpenseSynced as EventListener);
    setIsOffline(!navigator.onLine);
    
    // Initial load is now handled by a separate useEffect that depends on `user`

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("refresh-dashboard", handleRefresh);
      window.removeEventListener("expense-synced", handleExpenseSynced as EventListener);
    };
  }, []);


  const hydrateAndFetch = useCallback(async () => {
    if (!user) return;

    const offlineExpenses = getUserOfflineQueue(user.id);
    const cachedExpenses = getCachedExpenses();
    
    const hasLocalData = offlineExpenses.length > 0 || cachedExpenses.length > 0;
    let initialState: Expense[] = [];
    
    if (offlineExpenses.length > 0) {
      initialState = offlineExpenses.map(exp => ({
        id: exp.tempId,
        title: exp.title,
        amount: exp.amount,
        category: exp.category || '',
        project_client: exp.project_client || null,
        note: exp.note || null,
        created_at: exp.created_at,
        receipt_url: exp.receipt_url,
        isOffline: true,
        tempId: exp.tempId,
      }));
    }
    
    if (cachedExpenses.length > 0) {
      const cachedAsExpenses: Expense[] = cachedExpenses.map(exp => ({
        ...exp,
        category: exp.category || '',
        project_client: exp.project_client || null,
        note: exp.note || null,
      }));
      initialState = [...initialState, ...cachedAsExpenses];
    }

    if (initialState.length > 0) {
      setExpenses(initialState);
      setHydrated(true);
      setLoading(false);
    }

    if (!navigator.onLine) {
      setLoading(false);
      return;
    }

    fetchExpenses(true);
  }, [user]);

  const fetchExpenses = useCallback(async (mergeWithLocal = false) => {
    if (fetchInProgressRef.current) return;
    
    if (!navigator.onLine) {
      setLoading(false);
      fetchInProgressRef.current = false;
      return;
    }
    
    fetchInProgressRef.current = true;

    if (!user) {
      if (isMountedRef.current) {
        if (!mergeWithLocal) {
          setExpenses([]);
        }
        setLoading(false);
      }
      fetchInProgressRef.current = false;
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!isMountedRef.current) {
        fetchInProgressRef.current = false;
        return;
      }

      if (error) {
        console.error("EXPENSES - FETCH ERROR:", error);
      } else if (data) {
        saveCachedExpenses(data);
        const offlineItems = getUserOfflineQueue(user.id);
        const merged = mergeExpenses(data, offlineItems);
        setExpenses(merged as Expense[]);
      }
    } catch (error) {
      console.error("EXPENSES - FETCH ERROR:", error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      fetchInProgressRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (user && !initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      hydrateAndFetch();
    }
  }, [user, hydrateAndFetch]);

  const handleViewDetails = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowEdit(true);
  };

  const handleEditSuccess = () => {
    fetchExpenses();
    window.dispatchEvent(new CustomEvent("expense-added"));
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setDateFilter('all');
  };

  const applyFilters = () => {
    setShowFilterPanel(false);
  };

  const filteredExpenses = useMemo(() => {
    let result = expenses;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(expense => {
        const noteMatch = expense.note?.toLowerCase().includes(query);
        const projectMatch = expense.project_client?.toLowerCase().includes(query);
        const categoryMatch = expense.category?.toLowerCase().includes(query);
        const titleMatch = expense.title?.toLowerCase().includes(query);
        return noteMatch || projectMatch || categoryMatch || titleMatch;
      });
    }
    
    if (selectedCategories.length > 0) {
      result = result.filter(expense => 
        expense.category && selectedCategories.includes(expense.category)
      );
    }
    
    if (dateFilter !== 'all') {
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      result = result.filter(expense => {
        if (!expense.created_at) return false;
        const expDate = new Date(expense.created_at);
        
        switch (dateFilter) {
          case 'today':
            return expDate >= today;
          case '7days': {
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            return expDate >= sevenDaysAgo;
          }
          case '30days': {
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
            return expDate >= thirtyDaysAgo;
          }
          default:
            return true;
        }
      });
    }
    
    return result;
  }, [expenses, searchQuery, selectedCategories, dateFilter]);

  const groupedExpenses = useMemo((): ExpenseGroup[] => {
    const groups: ExpenseGroup[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayExpenses: Expense[] = [];
    const yesterdayExpenses: Expense[] = [];
    const olderExpenses: Expense[] = [];
    
    filteredExpenses.forEach(expense => {
      if (!expense.created_at) return;
      
      const expDate = new Date(expense.created_at);
      expDate.setHours(0, 0, 0, 0);
      
      if (expDate.getTime() === today.getTime()) {
        todayExpenses.push(expense);
      } else if (expDate.getTime() === yesterday.getTime()) {
        yesterdayExpenses.push(expense);
      } else {
        olderExpenses.push(expense);
      }
    });
    
    if (todayExpenses.length > 0) {
      groups.push({ title: "Today", data: todayExpenses });
    }
    if (yesterdayExpenses.length > 0) {
      groups.push({ title: "Yesterday", data: yesterdayExpenses });
    }
    if (olderExpenses.length > 0) {
      const olderGroups: Record<string, Expense[]> = {};
      olderExpenses.forEach(expense => {
        if (!expense.created_at) return;
        const date = new Date(expense.created_at);
        const key = date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
        if (!olderGroups[key]) olderGroups[key] = [];
        olderGroups[key].push(expense);
      });
      
      Object.entries(olderGroups).forEach(([title, data]) => {
        groups.push({ title, data });
      });
    }
    
    return groups;
  }, [filteredExpenses]);

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const hasExpenses = filteredExpenses.length > 0;
  const hasOriginalExpenses = expenses.length > 0;

  return (
    <div className="min-h-screen bg-white pb-20">
      <OfflineBanner isOffline={isOffline} />

      <header className="bg-white px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-primary" />
          </Link>
          <h1 className="text-xl font-semibold text-surface-800">Expenses</h1>
          <button 
            onClick={() => setShowFilterPanel(true)}
            className={`p-2 -mr-2 ${hasActiveFilters ? 'text-primary' : 'text-surface-600'}`}
          >
            <SlidersHorizontal className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, projects, or categories..."
            className="w-full pl-10 pr-4 py-3 bg-surface-100 rounded-2xl text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="px-4">
        {hasExpenses && (
          <div className="mb-4">
            <p className="text-sm text-surface-500">
              {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} • {formatCurrency(totalAmount, currency)}
            </p>
          </div>
        )}
      </div>

      <div className="px-4">
        {!loading && hasOriginalExpenses && !hasExpenses && searchQuery && (
          <div className="bg-white rounded-2xl p-8 text-center border border-surface-100">
            <p className="text-surface-800 font-medium mb-1">No results found</p>
            <p className="text-surface-500 text-sm">Try a different search term</p>
          </div>
        )}

        {!loading && !hasOriginalExpenses && !hasExpenses && !searchQuery && (
          <div className="bg-white rounded-2xl p-8 text-center border border-surface-100">
            <p className="text-surface-800 font-medium mb-1">No expenses yet</p>
            <p className="text-surface-500 text-sm">Tap the + button to add your first expense</p>
          </div>
        )}

        {!loading && hasExpenses && (
          groupedExpenses.map((group) => (
            <div key={group.title} className="mb-6">
              <p className="text-sm font-medium text-surface-500 mb-2 px-1">{group.title}</p>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-surface-100">
                {group.data.map((expense, index) => {
                  const iconColor = getCategoryColor(expense.category) || '#64748b';
                  const subtitle = expense.note || expense.project_client || getCategoryLabel(expense.category);
                  
                  return (
                    <div 
                      key={expense.id} 
                      onClick={() => handleViewDetails(expense)} 
                      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-50 ${index !== group.data.length - 1 ? "border-b border-surface-100" : ""}`}
                    >
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: iconColor + '20' }}
                      >
                        <span className="text-xl">{getCategoryIcon(expense.category)}</span>
                      </div>
<div className="flex-1 min-w-0">
                          <p className="font-semibold text-surface-800 truncate">
                            {getCategoryLabel(expense.category)}
                            {(expense as any).isOffline && (
                              <span className="ml-1 text-xs font-normal" style={{ color: '#b45309' }}>(offline)</span>
                            )}
                          </p>
                          <p className="text-sm text-surface-500 truncate">{subtitle}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {(expense as any).receipt_url && (
                            <span className="text-xs text-primary" title="Has receipt">📎</span>
                          )}
                          <p className="font-semibold text-surface-800 whitespace-nowrap">{formatCurrency(Number(expense.amount) || 0, currency)}</p>
                        </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />

      {showEdit && selectedExpense && (
        <EditExpenseModal
          expense={selectedExpense}
          onClose={() => { setShowEdit(false); setSelectedExpense(null); }}
          onSuccess={handleEditSuccess}
        />
      )}

      {showFilterPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div 
            className="bg-white w-full rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-surface-100">
              <h2 className="text-lg font-semibold text-surface-800">Filters</h2>
              <button onClick={() => setShowFilterPanel(false)} className="p-2">
                <X className="w-5 h-5 text-surface-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-6">
                <p className="text-sm font-medium text-surface-700 mb-3">Date Range</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'all', label: 'All time' },
                    { value: 'today', label: 'Today' },
                    { value: '7days', label: 'Last 7 days' },
                    { value: '30days', label: 'Last 30 days' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDateFilter(option.value as DateFilter)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium text-left transition-all ${
                        dateFilter === option.value
                          ? 'bg-primary text-white'
                          : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-surface-700 mb-3">Category</p>
                {availableCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map((category) => {
                      const isSelected = selectedCategories.includes(category);
                      return (
                        <button
                          key={category}
                          onClick={() => toggleCategory(category)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'bg-primary text-white'
                              : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4" />}
                          {getCategoryLabel(category)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-surface-400">No categories available</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-surface-100">
              <button
                onClick={clearFilters}
                className="flex-1 px-4 py-3 border border-surface-200 text-surface-700 font-medium rounded-xl hover:bg-surface-50"
              >
                Clear
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 px-4 py-3 bg-primary text-white font-medium rounded-xl"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}