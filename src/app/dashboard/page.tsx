"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { Bell, TrendingUp, WifiOff, ChevronDown } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import OfflineBanner from "@/components/OfflineBanner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { getCategoryIcon, getCategoryColor, getCategoryLabel } from "@/lib/categories";
import { formatCurrency } from "@/lib/currency";
import {
  getUserOfflineQueue,
  processQueue,
  mergeExpenses,
  getCachedExpenses,
  saveCachedExpenses,
  CachedExpense,
} from "@/lib/offlineQueue";

export const dynamic = 'force-dynamic';

type PeriodOption = '7' | '30' | '90' | 'month';

const PERIOD_OPTIONS: { value: PeriodOption; label: string; days: number }[] = [
  { value: '7', label: 'Last 7 days', days: 7 },
  { value: '30', label: 'Last 30 days', days: 30 },
  { value: '90', label: 'Last 90 days', days: 90 },
  { value: 'month', label: 'This Month', days: 0 },
];

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  created_at: string;
}

interface Category {
  name: string;
  total: number;
  color: string;
}

export default function DashboardPage() {
  const { user, loading, currency } = useAuth();
  const [isOffline, setIsOffline] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('30');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  const getInitials = (name: string, email: string): string => {
    if (!name && !email) return '?';
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name: string): string => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  console.log("DASHBOARD - USER FROM CONTEXT:", user);
  console.log("DASHBOARD - USER METADATA:", user?.user_metadata);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

const handleOnline = async () => {
    setIsOffline(false);
    if (user?.id) {
      await processQueue(user.id);
    }
    await fetchData();
  };

  const handleOffline = () => setIsOffline(true);

  const handleRefresh = () => {
    if (!fetchInProgressRef.current) {
      setDataLoading(true);
      fetchData();
    }
  };

  const handleExpenseSynced = (e: CustomEvent) => {
    if (!isMountedRef.current || !e.detail) return;
    const { tempId, realId } = e.detail;
    setExpenses(prev => prev.map(exp => {
      if ((exp as any).tempId === tempId) {
        return { ...exp, id: realId, isOffline: false };
      }
      return exp;
    }));
  };

  const handleExpenseAdded = (e: CustomEvent) => {
    if (!isMountedRef.current || !e.detail) return;
    const newExpense = e.detail;
    if (!newExpense.id) return;
    setExpenses(prev => {
      if (prev.some(exp => exp.id === newExpense.id)) return prev;
      return [newExpense, ...prev];
    });
  };

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("refresh-dashboard", handleRefresh);
    window.addEventListener("expense-added", handleExpenseAdded as any);
    window.addEventListener("expense-synced", handleExpenseSynced as any);

    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("refresh-dashboard", handleRefresh);
      window.removeEventListener("expense-added", handleExpenseAdded as any);
      window.removeEventListener("expense-synced", handleExpenseSynced as any);
    };
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const expDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (expDate.getTime() === today.getTime()) return 'Today';
    if (expDate.getTime() === yesterday.getTime()) return 'Yesterday';
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  };

  const loadCachedDataImmediately = useCallback(() => {
    if (!user) return;
    
    const offlineExpenses = getUserOfflineQueue(user.id);
    const cachedExpenses = getCachedExpenses();
    
    const combined: any[] = [];
    
    for (const exp of offlineExpenses) {
      combined.push({
        ...exp,
        id: exp.tempId,
        isOffline: true,
        date: formatDate(exp.created_at),
      });
    }
    
    for (const exp of cachedExpenses) {
      combined.push({
        ...exp,
        date: formatDate(exp.created_at),
      });
    }
    
    combined.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    if (combined.length > 0) {
      setExpenses(combined);
    }
    setDataLoading(false);
  }, [user]);



  const fetchData = useCallback(async () => {
    if (fetchInProgressRef.current) return;
    
    if (!navigator.onLine) {
      setDataLoading(false);
      fetchInProgressRef.current = false;
      return;
    }
    
    // Even if already has data, refresh from server to sync any pending
    loadCachedDataImmediately();
    
    fetchInProgressRef.current = true;

    if (!user) {
      if (isMountedRef.current) {
        setExpenses([]);
        setDataLoading(false);
      }
      fetchInProgressRef.current = false;
      return;
    }

    try {
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!isMountedRef.current) {
        fetchInProgressRef.current = false;
        return;
      }

      if (expenseError) {
        console.error("DASHBOARD - FETCH ERROR:", expenseError);
      } else if (expenseData) {
        saveCachedExpenses(expenseData);
        
        const offlineItems = getUserOfflineQueue(user.id);
        const merged = mergeExpenses(expenseData, offlineItems);
        
        const withDates = merged.map((exp: any) => ({
          ...exp,
          date: formatDate(exp.created_at),
        })).sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setExpenses(withDates);
      }
    } catch (error) {
      console.error("DASHBOARD - ERROR:", error);
    } finally {
      if (isMountedRef.current) {
        setDataLoading(false);
      }
      fetchInProgressRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (user && !fetchInProgressRef.current) {
      console.log("DASHBOARD - USER AVAILABLE, FETCHING DATA");
      fetchData();
    }
  }, [user, fetchData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  const email = user?.email || "";
  const initials = getInitials(fullName, email);
  const avatarColor = getAvatarColor(fullName || email);

  const getDateRange = (period: PeriodOption): { start: Date; end: Date } => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    
    if (period === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else {
      const days = parseInt(period);
      start.setDate(end.getDate() - days + 1);
      start.setHours(0, 0, 0, 0);
    }
    
    return { start, end };
  };

  const filteredExpenses = useMemo(() => {
    const { start, end } = getDateRange(selectedPeriod);
    return expenses.filter(e => {
      if (!e.created_at) return false;
      const expDate = new Date(e.created_at);
      return expDate >= start && expDate <= end;
    });
  }, [expenses, selectedPeriod]);

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const getPreviousPeriodRange = (period: PeriodOption): { start: Date; end: Date } => {
    const { start: currentStart, end: currentEnd } = getDateRange(period);
    const duration = currentEnd.getTime() - currentStart.getTime();
    const previousEnd = new Date(currentStart.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);
    return { start: previousStart, end: previousEnd };
  };

  const previousPeriodExpenses = useMemo(() => {
    const { start, end } = getPreviousPeriodRange(selectedPeriod);
    return expenses.filter(e => {
      if (!e.created_at) return false;
      const expDate = new Date(e.created_at);
      return expDate >= start && expDate <= end;
    });
  }, [expenses, selectedPeriod]);

  const previousPeriodTotal = previousPeriodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  
  let percentChange = 0;
  if (previousPeriodTotal > 0) {
    percentChange = Math.round(((totalExpenses - previousPeriodTotal) / previousPeriodTotal) * 100);
  } else if (totalExpenses > 0) {
    percentChange = 100;
  } else {
    percentChange = 0;
  }
  const isIncrease = percentChange > 0;

  const categoryTotals = filteredExpenses.reduce((acc: Record<string, number>, e) => {
    const cat = e.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0);
    return acc;
  }, {});

  const categories: Category[] = Object.entries(categoryTotals).map(([name, total]) => ({
    name, total, color: getCategoryColor(name) || getCategoryColor(null),
  })).sort((a, b) => b.total - a.total);

  const topCategory = categories.length > 0 ? categories[0] : { name: 'N/A', total: 0, color: '#64748b' };
  const maxCategoryAmount = Math.max(...categories.map(c => c.total), 1);
  
  const periodInfo = PERIOD_OPTIONS.find(p => p.value === selectedPeriod);
  const avgDays = periodInfo?.value === 'month' 
    ? (() => {
        const now = new Date();
        return now.getDate();
      })()
    : (periodInfo?.days || 30);
  const avgPerDay = totalExpenses > 0 && filteredExpenses.length > 0 ? totalExpenses / avgDays : 0;

  const { start: periodStart } = getDateRange(selectedPeriod);
  const uniqueDaysInPeriod = new Set(
    filteredExpenses
      .filter(e => e.created_at)
      .map(e => e.created_at!.split('T')[0])
  ).size;
  const avgPerDayActual = totalExpenses > 0 && uniqueDaysInPeriod > 0 ? totalExpenses / uniqueDaysInPeriod : 0;

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const now = new Date();
  const { start: filterStart, end: filterEnd } = getDateRange(selectedPeriod);
  
  const dailyTotals = weekDays.map(day => ({ day, amount: 0 }));

  filteredExpenses.forEach(exp => {
    if (!exp.created_at) return;
    const expDate = new Date(exp.created_at);
    const localExpDate = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
    const localFilterStart = new Date(filterStart.getFullYear(), filterStart.getMonth(), filterStart.getDate());
    
    if (localExpDate >= localFilterStart) {
      const dayIndex = expDate.getDay();
      dailyTotals[dayIndex].amount += Number(exp.amount) || 0;
    }
  });

  console.log("DAILY SPENDING - expenses count:", filteredExpenses.length);
  console.log("DAILY SPENDING - dailyTotals:", dailyTotals);

  const maxDailyAmount = Math.max(...dailyTotals.map(d => d.amount), 1);

  const recentExpenses = filteredExpenses.slice(0, 5).map((expense) => ({
    id: expense.id,
    title: expense.title,
    category: expense.category,
    amount: Number(expense.amount) || 0,
    date: formatDate(expense.created_at),
    icon: getCategoryIcon(expense.category),
    expense,
  }));

  const handleExpenseClick = (expense: any) => {
    window.dispatchEvent(new CustomEvent("open-edit-expense", { detail: expense.expense }));
  };

  const hasExpenses = filteredExpenses.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-surface-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-20">
      <OfflineBanner isOffline={isOffline} />

      <header className="bg-white px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ backgroundColor: '#CCF4FF' }}
            >
              <span style={{ color: 'var(--color-primary)' }}>{initials}</span>
            </div>
            <div>
              <p className="font-body-bodymedium text-neutral">{getGreeting()}</p>
              <h1 className="text-primary font-semibold text-base">
                {fullName}
              </h1>
            </div>
          </div>
          <Link href="/notifications" className="relative p-2">
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#CCF4FF' }}
            >
              <Bell className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            </div>
          </Link>
        </div>
      </header>

      <div className="px-4 mb-8">
        <div className="relative">
          <button
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            className="flex items-center justify-between w-full px-4 py-4 rounded-xl"
            style={{ backgroundColor: '#E1E5EA' }}
          >
            <span className="text-sm text-surface-600">Rolling period</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-surface-800">
                {PERIOD_OPTIONS.find(p => p.value === selectedPeriod)?.label}
              </span>
              <ChevronDown className={`w-4 h-4 text-surface-500 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {showPeriodDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-200 rounded-xl shadow-lg z-10 overflow-hidden">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedPeriod(option.value);
                    setShowPeriodDropdown(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-surface-50 ${
                    selectedPeriod === option.value ? 'bg-primary/10 text-primary font-medium' : 'text-surface-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-primary rounded-2xl p-5 shadow-sm">
          <div className="mb-2">
            <p className="text-white/80 text-sm">Total Expenses</p>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(totalExpenses, currency)}
            </p>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
            <div className="flex items-center gap-1 text-white text-xs font-medium">
              {hasExpenses && (
                <>
                  {percentChange > 0 ? '↗' : percentChange < 0 ? '↙' : ''} {Math.abs(percentChange)}% vs last month
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">Avg/day</p>
              <p className="text-sm font-medium text-white">{formatCurrency(avgPerDayActual, currency)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-surface-500 mb-3">Top Spending</p>
          {hasExpenses ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: topCategory.color + '20' }}>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: topCategory.color }} />
                </div>
                <div>
                  <p className="font-semibold text-surface-800">{getCategoryLabel(topCategory.name)}</p>
                  <p className="text-sm text-surface-500">{formatCurrency(topCategory.total, currency)}</p>
                </div>
              </div>
              <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(topCategory.total / maxCategoryAmount) * 100}%`, backgroundColor: topCategory.color }} />
              </div>
            </>
          ) : (
            <p className="text-sm text-surface-400">No expenses yet</p>
          )}
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-surface-500 mb-4">Spending by Category</p>
          {hasExpenses && categories.length > 0 ? (
            <>
              <div className="flex justify-center">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {categories.map((cat, i) => {
                      const startAngle = categories.slice(0, i).reduce((acc, c) => acc + (c.total / totalExpenses) * 360, 0);
                      const endAngle = startAngle + (cat.total / totalExpenses) * 360;
                      const largeArc = (cat.total / totalExpenses) * 180 > 90 ? 1 : 0;
                      const start = polarToCartesian(50, 50, 45, startAngle - 90);
                      const end = polarToCartesian(50, 50, 45, endAngle - 90);
                      return <path key={cat.name} d={`M 50 50 L ${start.x} ${start.y} A 45 45 0 ${largeArc} 1 ${end.x} ${end.y} Z`} fill={cat.color} />;
                    })}
                  </svg>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                {categories.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs text-surface-600">{getCategoryLabel(cat.name)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-surface-400 text-center">No expenses yet</p>
          )}
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-surface-500 mb-4">Daily Spending</p>
          <div className="flex items-end gap-2 h-24">
            {dailyTotals.map((data, i) => {
              const heightPercent = maxDailyAmount > 0 ? (data.amount / maxDailyAmount) * 100 : 0;
              const minHeight = Math.max(heightPercent, data.amount > 0 ? 10 : 4);
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div className="w-full bg-primary rounded-t" style={{ height: `${minHeight}%` }} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 px-1">
            {dailyTotals.map((data, i) => (
              <span key={i} className="text-xs text-surface-400">{data.day}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-base font-semibold text-surface-800">Recent Expenses</p>
          <Link href="/expenses" className="text-sm text-primary font-medium">See all</Link>
        </div>
        {hasExpenses ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {recentExpenses.map((expense, index) => (
              <div key={expense.id} onClick={() => handleExpenseClick(expense)} className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-50 ${index !== recentExpenses.length - 1 ? 'border-b border-surface-100' : ''}`}>
                <span className="text-2xl">{expense.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-surface-800">
                    {expense.title}
                    {(expense as any).isOffline && (
                      <span className="ml-1 text-xs font-normal" style={{ color: 'var(--color-warning)' }}>(offline)</span>
                    )}
                  </p>
                  <p className="text-xs text-surface-500">{getCategoryLabel(expense.category) || 'Uncategorized'} • {expense.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  {((expense as any).receipt_url || (expense as any).receiptUrl) && (
                    <span className="text-sm" title="Has receipt">📎</span>
                  )}
                  <p className="font-semibold text-surface-800">{formatCurrency(expense.amount, currency)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : !loading ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-surface-400">No expenses recorded yet</p>
            <p className="text-sm text-surface-500 mt-1">Add your first expense to get started</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-surface-400">Loading...</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}