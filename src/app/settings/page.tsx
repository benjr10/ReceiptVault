"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { currencyCodes } from "@/lib/currency";

const recurringOptions = ["None", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "Yearly"];

function SettingsContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'recurring';
  
  const { user, setUser, currency: authCurrency } = useAuth();
  const [recurring, setRecurring] = useState("None");
  const [currency, setCurrency] = useState(authCurrency || "NGN");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const savedCurrency = user.user_metadata?.currency || "NGN";
    const savedRecurring = user.user_metadata?.recurring_expense || "None";

    setCurrency(savedCurrency);
    setRecurring(savedRecurring);
    setLoading(false);
  };

  const updateUserMetadata = async (updates: Record<string, any>) => {
    if (!user) return;

    const newMetadata = { ...user.user_metadata, ...updates };

    const { data, error } = await supabase.auth.updateUser({
      data: newMetadata
    });

    if (!error && data.user) {
      setUser(data.user);
    }

    console.log("SETTINGS - UPDATED METADATA:", newMetadata);
  };

  const handleRecurringChange = async (value: string) => {
    setRecurring(value);
    await updateUserMetadata({ recurring_expense: value });
  };

  const handleCurrencyChange = async (value: string) => {
    setCurrency(value);
    await updateUserMetadata({ currency: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-surface-500">Loading...</p>
      </div>
    );
  }

  const showRecurring = tab === 'recurring';
  const showCurrency = tab === 'currency';

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white px-4 pt-12 pb-4">
        <Link href="/profile" className="flex items-center gap-2 mb-3">
          <ChevronLeft className="w-5 h-5 text-surface-600" />
          <span className="text-surface-600 text-sm">Back</span>
        </Link>
        <h1 className="text-xl font-semibold text-surface-800">
          {showRecurring ? "Recurring Expense" : "Default Currency"}
        </h1>
      </header>

      <div className="px-4 pb-8">
        {showRecurring && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-surface-100">
            <div className="flex flex-wrap gap-2">
              {recurringOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleRecurringChange(option)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    recurring === option
                      ? "bg-primary text-white"
                      : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="text-xs text-surface-400 mt-4">
              Changes are saved automatically when you select an option.
            </p>
          </div>
        )}

        {showCurrency && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-surface-100">
            <div className="flex flex-wrap gap-2">
              {currencyCodes.map((code) => (
                <button
                  key={code}
                  onClick={() => handleCurrencyChange(code)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    currency === code
                      ? "bg-primary text-white"
                      : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
            <p className="text-xs text-surface-400 mt-4">
              Changing currency only updates the symbol. Existing amounts won&apos;t be converted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><p className="text-surface-500">Loading...</p></div>}>
      <SettingsContent />
    </Suspense>
  );
}