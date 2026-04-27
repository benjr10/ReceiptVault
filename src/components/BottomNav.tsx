"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Receipt, 
  BarChart3, 
  User, 
  Plus,
  LucideIcon
} from "lucide-react";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  isFloating?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/expenses", icon: Receipt, label: "Expenses" },
  { href: "#add", icon: Plus, label: "", isFloating: true },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const event = new CustomEvent("open-add-expense");
    window.dispatchEvent(event);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-200 px-4 py-2 pb-safe z-50">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isFloating) {
            return (
              <button
                key={item.href}
                onClick={handleAddClick}
                className="flex items-center justify-center w-14 h-14 -mt-8 bg-primary rounded-full shadow-lg shadow-primary/30"
              >
                <Icon className="w-6 h-6 text-white" />
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
                isActive ? "text-primary" : "text-surface-400 hover:text-surface-600"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}