"use client";

import Link from "next/link";
import Logo from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Logo size={64} />
      </div>
      {children}
      <p className="mt-8 text-center text-surface-500 text-sm">
        Snap. Tag. Report. Done.
      </p>
    </div>
  );
}
