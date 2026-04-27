import { supabase, TOTAL_STORAGE_BYTES, getStorageUsage } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { formatCurrency } from "@/lib/currency";

const NOTIFICATIONS_KEY = "receiptvault_notifications";
const STORAGE_WARNING_KEY = "receiptvault_storage_warning_shown";
const STORAGE_BLOCK_KEY = "receiptvault_storage_blocked";

export interface AppNotification {
  id: string;
  type: "expense_recorded" | "expense_deleted" | "expense_edited" | "category_added" | "storage_warning";
  message: string;
  created_at: string;
  read: boolean;
}

export function getStoredNotifications(): AppNotification[] {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveNotifications(notifications: AppNotification[]): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

export function addNotification(notification: Omit<AppNotification, "id" | "created_at" | "read">): void {
  const notifications = getStoredNotifications();
  const newNotification: AppNotification = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(newNotification);
  saveNotifications(notifications);
  
  window.dispatchEvent(new CustomEvent("notification-added"));
}

export function markNotificationRead(id: string): void {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
  saveNotifications(updated);
  window.dispatchEvent(new CustomEvent("notifications-updated"));
}

export function markAllNotificationsRead(): void {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
  window.dispatchEvent(new CustomEvent("notifications-updated"));
}

export function getUnreadCount(): number {
  return getStoredNotifications().filter(n => !n.read).length;
}

export function createExpenseRecordedNotification(amount: number, currency: string): void {
  const formatted = formatCurrency(amount, currency);
  addNotification({
    type: "expense_recorded",
    message: `Your expense of ${formatted} was saved successfully.`,
  });
}

export function createExpenseDeletedNotification(amount: number, currency: string): void {
  const formatted = formatCurrency(amount, currency);
  addNotification({
    type: "expense_deleted",
    message: `An expense of ${formatted} was deleted.`,
  });
}

export function createExpenseEditedNotification(amount: number, currency: string): void {
  const formatted = formatCurrency(amount, currency);
  addNotification({
    type: "expense_edited",
    message: `An expense of ${formatted} was updated.`,
  });
}

export function createCategoryAddedNotification(categoryName: string): void {
  addNotification({
    type: "category_added",
    message: `New category '${categoryName}' was added.`,
  });
}

export async function checkStorageAndCreateWarning(userId: string): Promise<{ warning: boolean; blocked: boolean }> {
  const storageBytes = await getStorageUsage(userId);
  const storagePercent = (storageBytes / TOTAL_STORAGE_BYTES) * 100;
  
  let warningCreated = false;
  let blocked = false;
  
  if (storagePercent >= 100) {
    blocked = true;
    localStorage.setItem(STORAGE_BLOCK_KEY, "true");
    addNotification({
      type: "storage_warning",
      message: "Delete an expense or upgrade your storage limit.",
    });
    warningCreated = true;
  } else if (storagePercent >= 80) {
    const alreadyShown = localStorage.getItem(STORAGE_WARNING_KEY);
    if (!alreadyShown) {
      addNotification({
        type: "storage_warning",
        message: `You have used ${storagePercent.toFixed(0)}% of your storage.`,
      });
      localStorage.setItem(STORAGE_WARNING_KEY, "true");
      warningCreated = true;
    }
  }
  
  return { warning: warningCreated, blocked };
}

export function isStorageBlocked(): boolean {
  return localStorage.getItem(STORAGE_BLOCK_KEY) === "true";
}

export function clearStorageWarningFlag(): void {
  localStorage.removeItem(STORAGE_WARNING_KEY);
  localStorage.removeItem(STORAGE_BLOCK_KEY);
}

export async function canUploadReceipt(userId: string): Promise<{ allowed: boolean; message?: string }> {
  if (isStorageBlocked()) {
    return { allowed: false, message: "Delete an expense or upgrade your storage limit." };
  }
  
  const storageBytes = await getStorageUsage(userId);
  const storagePercent = (storageBytes / TOTAL_STORAGE_BYTES) * 100;
  
  if (storagePercent >= 100) {
    localStorage.setItem(STORAGE_BLOCK_KEY, "true");
    return { allowed: false, message: "Delete an expense or upgrade your storage limit." };
  }
  
  return { allowed: true };
}