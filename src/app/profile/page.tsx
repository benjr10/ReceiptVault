"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Bell, Settings, Tag, FileText, Shield, LogOut, ExternalLink, Pencil, X, Check, HardDrive, DollarSign, Info, RefreshCw } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { supabase, getStorageUsage, formatBytes } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";

export const dynamic = 'force-dynamic';

const TOTAL_STORAGE_GB = 1;
const TOTAL_STORAGE_BYTES = TOTAL_STORAGE_GB * 1024 * 1024 * 1024;

const preferencesItems = [
  { icon: RefreshCw, label: "Recurring Expense", href: "/settings?tab=recurring" },
  { icon: DollarSign, label: "Default Currency", href: "/settings?tab=currency" },
];

const managementItems = [
  { icon: Tag, label: "Categories", href: "/categories" },
];

const securityItems = [
  { icon: Shield, label: "Change Password", href: "/change-password" },
];

const aboutItems = [
  { icon: FileText, label: "Terms & Privacy", href: "/terms" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, setUser } = useAuth();
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLoading, setStorageLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  const email = user?.email || "";

  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const fetchStorageUsage = useCallback(async () => {
    if (!user) return;
    try {
      const bytes = await getStorageUsage(user.id);
      setStorageUsed(bytes);
    } catch (error) {
      console.error('Error fetching storage:', error);
    } finally {
      setStorageLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStorageUsage();
  }, [fetchStorageUsage]);

  const startEditing = () => {
    setEditedName(fullName);
    setIsEditingName(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const cancelEditing = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  const saveName = async () => {
    const trimmedName = editedName.trim();
    if (!trimmedName) {
      alert("Name cannot be empty");
      return;
    }

    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: trimmedName }
      });

      if (error) {
        console.error('Error updating name:', error);
        alert("Failed to update name. Please try again.");
      } else {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          setUser(data.user);
        }
        setIsEditingName(false);
        setEditedName("");
      }
    } catch (error) {
      console.error('Error updating name:', error);
      alert("Failed to update name. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear sensitive local storage data before logout
      const keysToRemove = [
        'receiptvault_offline_queue',
        'receiptvault_cached_expenses',
        'receiptvault_last_sync',
        'receiptvault_notifications',
        'receiptvault_storage_warning_shown',
        'receiptvault_storage_blocked',
        'receiptvault_custom_categories'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));

      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      router.push("/login");
    }
  };

  const storagePercent = TOTAL_STORAGE_BYTES > 0 ? (storageUsed / TOTAL_STORAGE_BYTES) * 100 : 0;

  const renderSection = (title: string, items: { icon: any; label: string; href?: string; onClick?: () => void }[], isLastSection = false) => (
    <div className={`px-4 ${isLastSection ? 'mb-4' : ''}`}>
      <p className="text-xs font-medium mb-2 pl-1" style={{ color: 'var(--color-neutral)' }}>{title}</p>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-surface-100">
        {items.map((item, index) => {
          const Icon = item.icon;
          const content = (
            <>
              <Icon className="w-5 h-5 text-surface-500" />
              <span className="flex-1 font-medium">{item.label}</span>
              <ExternalLink className="w-4 h-4 text-surface-400" />
            </>
          );

          return (
            <div
              key={item.label}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-50 transition-colors ${
                index !== items.length - 1 ? "border-b border-surface-100" : ""
              }`}
            >
              {item.href ? (
                <Link href={item.href} className="flex items-center gap-3 flex-1">
                  {content}
                </Link>
              ) : (
                <button onClick={item.onClick} className="flex items-center gap-3 flex-1 w-full text-left">
                  {content}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-surface-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="bg-white px-4 pt-12 pb-4">
        <div className="flex items-center justify-center relative">
          <Link href="/dashboard" className="absolute left-0 p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-primary" />
          </Link>
          <h1 className="text-xl font-semibold text-surface-800">Profile</h1>
          <Link href="/notifications" className="absolute right-0 p-2 -mr-2">
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#CCF4FF' }}
            >
              <Bell className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            </div>
          </Link>
        </div>
      </header>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-surface-100">
          <div className="flex flex-col items-center relative">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: '#CCF4FF' }}
            >
              <span className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {initials || '?'}
              </span>
            </div>
            <button
              onClick={startEditing}
              className="absolute top-14 right-1/2 translate-x-8 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-surface-200 hover:bg-surface-50 transition-colors"
              title="Edit name"
            >
              <Pencil className="w-4 h-4 text-surface-600" />
            </button>
            
            {isEditingName ? (
              <div className="w-full max-w-xs">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveName();
                      if (e.key === 'Escape') cancelEditing();
                    }}
                    className="flex-1 px-3 py-2 border border-surface-200 rounded-lg text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter your name"
                  />
                  <button
                    onClick={saveName}
                    disabled={isSaving}
                    className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <span className="w-4 h-4 block border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="p-2 bg-surface-100 text-surface-600 rounded-lg hover:bg-surface-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-surface-800">
                  {fullName || 'Your Name'}
                </h2>
                <p className="text-sm text-surface-500">
                  {email}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {renderSection('Preferences', preferencesItems)}
        
        {renderSection('Managements', managementItems)}
        
        <div className="px-4">
          <p className="text-xs font-medium mb-2 pl-1" style={{ color: 'var(--color-neutral)' }}>Storage</p>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-surface-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-surface-500" />
                <span className="text-sm text-surface-600">Storage Used</span>
              </div>
              <span className="text-sm font-medium text-surface-700">
                {storageLoading ? '...' : formatBytes(storageUsed)} / {TOTAL_STORAGE_GB} GB
              </span>
            </div>
            <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full"
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </div>
            {storagePercent > 80 && (
              <p className="text-xs text-warning mt-2">
                Warning: You&apos;ve used {storagePercent.toFixed(0)}% of your storage
              </p>
            )}
          </div>
        </div>

        {renderSection('Security', securityItems)}
        
        <div className="px-4">
          <p className="text-xs font-medium mb-2 pl-1" style={{ color: 'var(--color-neutral)' }}>About</p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-surface-100">
            {aboutItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href || ''}
                  className={`flex items-center gap-3 p-4 border-b border-surface-100 last:border-b-0 text-surface-700 hover:bg-surface-50 transition-colors ${
                    index !== aboutItems.length - 1 ? "border-b border-surface-100" : ""
                  }`}
                >
                  <Icon className="w-5 h-5 text-surface-500" />
                  <span className="flex-1 font-medium">{item.label}</span>
                  <ExternalLink className="w-4 h-4 text-surface-400" />
                </Link>
              );
            })}
            <div className="flex items-center gap-3 p-4 text-surface-400">
              <Info className="w-5 h-5" />
              <span className="flex-1 font-medium">App Version</span>
              <span className="text-sm">1.0</span>
            </div>
          </div>
        </div>

        <div className="px-4 mt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm text-error hover:bg-red-50 transition-colors border border-surface-100"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}