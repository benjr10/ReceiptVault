"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, WifiOff, Download } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import OfflineBanner from "@/components/OfflineBanner";
import { supabase } from "@/lib/supabase";
import { getCategoryColor, getCategoryLabel } from "@/lib/categories";
import { exportCSV, exportPDF } from "@/lib/export";
import { useAuth } from "@/components/AuthContext";
import { useExpenses, Expense } from "@/components/ExpensesContext";
import { formatCurrency } from "@/lib/currency";
import { getISODateString } from "@/lib/dateUtils";

export const dynamic = 'force-dynamic';

const timeFilters = ["7 Days", "30 Days", "90 Days"];



export default function ReportsPage() {
  const { user, currency } = useAuth();
  const { expenses, loading, refresh } = useExpenses();
  const [isOffline, setIsOffline] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("30 Days");


  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getFilteredExpenses = () => {
    const now = new Date();
    const endISO = getISODateString(now);
    let startISO: string;
    
    if (selectedPeriod === "7 Days") {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      d.setUTCDate(d.getUTCDate() - 6);
      startISO = getISODateString(d);
    } else if (selectedPeriod === "30 Days") {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      d.setUTCDate(d.getUTCDate() - 29);
      startISO = getISODateString(d);
    } else {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      d.setUTCDate(d.getUTCDate() - 89);
      startISO = getISODateString(d);
    }

    return expenses.filter(e => {
      const rawDate = e.created_at || e.date;
      if (!rawDate) return false;
      
      const expenseISO = getISODateString(rawDate);
      return expenseISO >= startISO && expenseISO <= endISO;
    });
  };

  const filteredExpenses = getFilteredExpenses();
  const totalSpending = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const uniqueDays = new Set(filteredExpenses.map(e => {
    const rawDate = e.created_at || e.date;
    return rawDate ? getISODateString(rawDate) : '';
  }).filter(d => d !== '')).size;
  const avgPerDay = uniqueDays > 0 ? totalSpending / uniqueDays : 0;

  const categoryTotals = filteredExpenses.reduce((acc: Record<string, number>, e) => {
    const cat = e.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0);
    return acc;
  }, {});

  const categoryData = Object.entries(categoryTotals).map(([name, amount]) => ({
    name,
    amount,
    color: getCategoryColor(name) || getCategoryColor(null),
  })).sort((a, b) => b.amount - a.amount);

  const maxAmount = Math.max(...categoryData.map(c => c.amount), 1);

  const hasExpenses = expenses.length > 0;
  const hasFilteredExpenses = filteredExpenses.length > 0;

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      alert("No expenses to export in the selected period.");
      return;
    }
    const dateRange = selectedPeriod.replace(" ", "-").toLowerCase();
    exportCSV(filteredExpenses, `receiptvault-expenses-${dateRange}.csv`);
  };

  const handleExportPDF = () => {
    if (filteredExpenses.length === 0) {
      alert("No expenses to export in the selected period.");
      return;
    }
    const dateRange = selectedPeriod.replace(" ", "-").toLowerCase();
    exportPDF(filteredExpenses, `receiptvault-report-${dateRange}.pdf`);
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-20">
      <OfflineBanner isOffline={isOffline} />

      <header className="bg-white px-4 pt-12 pb-4">
        <div className="flex items-center justify-center relative">
          <Link href="/dashboard" className="absolute left-0 p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-primary" />
          </Link>
          <h1 className="text-xl font-semibold text-surface-800">Reports</h1>
        </div>
      </header>

      <div className="px-4 py-3">
        <div className="flex gap-2 bg-surface-100 p-1 rounded-xl">
          {timeFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedPeriod(filter)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                selectedPeriod === filter
                  ? "bg-primary text-white"
                  : "text-surface-600"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-surface-200 text-surface-700 py-3 rounded-xl font-medium text-sm hover:bg-surface-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-colors"
            style={{ backgroundColor: '#f4a261', color: 'var(--color-primary)' }}
          >
            <Download className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="bg-primary rounded-2xl p-5 shadow-sm">
          <p className="text-white/80 text-sm mb-4">Summary</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-white/60 mb-1">Total Spending</p>
              <p className="text-xl font-bold text-white">
                {formatCurrency(totalSpending, currency)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-white/60 mb-1">Avg/day</p>
              <p className="text-sm font-medium text-white">{formatCurrency(avgPerDay, currency)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60 mb-1">Expenses</p>
              <p className="text-sm font-medium text-white">{filteredExpenses.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="font-body-bodylarge font-medium mb-4" style={{ color: 'var(--color-neutral)' }}>Spending Categories</p>
          {hasFilteredExpenses && categoryData.length > 0 ? (
            categoryData.map((cat) => (
              <div key={cat.name} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm text-surface-700">{getCategoryLabel(cat.name)}</span>
                  </div>
                  <span className="text-sm font-medium text-surface-800">
                    {formatCurrency(cat.amount, currency)}
                  </span>
                </div>
                <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(cat.amount / maxAmount) * 100}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-surface-400 text-center py-4">No expenses in this period</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}