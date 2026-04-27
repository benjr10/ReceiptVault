"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, CheckCheck, Bell, FileText, Tag, HardDrive } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import {
  getStoredNotifications,
  markAllNotificationsRead,
  AppNotification,
} from "@/lib/notifications";

const getIcon = (type: string) => {
  switch (type) {
    case "expense_recorded":
      return FileText;
    case "expense_deleted":
      return FileText;
    case "expense_edited":
      return FileText;
    case "category_added":
      return Tag;
    case "storage_warning":
      return HardDrive;
    default:
      return FileText;
  }
};

const getTitle = (type: string): string => {
  switch (type) {
    case "expense_recorded":
      return "Expense Recorded";
    case "expense_deleted":
      return "Expense Deleted";
    case "expense_edited":
      return "Expense Edited";
    case "category_added":
      return "Category Added";
    case "storage_warning":
      return "Storage Warning";
    default:
      return "Notification";
  }
};

const formatNotificationDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Unknown';
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (notifDate.getTime() === today.getTime()) {
    return `Today, ${date.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })}`;
  } else if (notifDate.getTime() === yesterday.getTime()) {
    return `Yesterday, ${date.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  }
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const loadNotifications = useCallback(() => {
    const stored = getStoredNotifications();
    
    if (isMountedRef.current) {
      setNotifications(stored);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadNotifications();

    const handleNotificationUpdate = () => {
      loadNotifications();
    };

    window.addEventListener("notification-added", handleNotificationUpdate);
    window.addEventListener("notifications-updated", handleNotificationUpdate);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("notification-added", handleNotificationUpdate);
      window.removeEventListener("notifications-updated", handleNotificationUpdate);
    };
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white px-4 pt-12 pb-4">
        <Link href="/dashboard" className="flex items-center gap-2 mb-3">
          <ChevronLeft className="w-5 h-5 text-surface-600" />
          <span className="text-surface-600 text-sm">Back</span>
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-surface-800">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-sm text-primary font-medium"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      </header>

      <div className="px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-surface-100">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-surface-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-800 font-medium mb-1">No notifications yet</p>
              <p className="text-surface-500 text-sm">Your notifications will appear here</p>
            </div>
          ) : (
            notifications.map((notification, index) => {
              const Icon = getIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 ${
                    index !== notifications.length - 1 ? "border-b border-surface-100" : ""
                  } ${notification.read ? "" : "bg-primary/5"}`}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ 
                      backgroundColor: notification.type === 'storage_warning' ? '#fef3c7' : '#CCF4FF',
                      color: notification.type === 'storage_warning' ? '#d97706' : 'var(--color-primary)'
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-surface-800">{getTitle(notification.type)}</p>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-surface-600 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-surface-400 mt-1">{formatNotificationDate(notification.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}