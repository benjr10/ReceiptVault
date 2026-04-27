"use client";

import { AlertTriangle } from "lucide-react";

interface OfflineBannerProps {
  isOffline: boolean;
}

export default function OfflineBanner({ isOffline }: OfflineBannerProps) {
  if (!isOffline) return null;

  return (
    <div 
      className="mx-4 mt-3 mb-2 rounded-lg flex items-center gap-2 py-2 px-3"
      style={{ 
        backgroundColor: '#fef3c7',
        border: '1px solid #fcd34d'
      }}
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#b45309' }} />
      <span className="text-xs font-medium" style={{ color: '#b45309' }}>
        You are offline. Expenses will sync when connected.
      </span>
    </div>
  );
}