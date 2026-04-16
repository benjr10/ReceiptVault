import Link from "next/link";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      <nav className="bg-white shadow-sm border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="ReceiptVault" className="w-10 h-10 rounded-lg" />
              <span className="text-xl font-bold text-primary">ReceiptVault</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/expenses"
                className="text-surface-600 hover:text-primary font-medium"
              >
                Expenses
              </Link>
              <button className="text-surface-600 hover:text-primary font-medium">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-surface-800 mb-2">Dashboard</h1>
        <p className="text-surface-500 mb-8">Track your expenses and insights</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-surface-100">
            <p className="text-sm text-surface-500 mb-1">Total Expenses</p>
            <p className="text-3xl font-bold text-surface-800">₦0.00</p>
            <p className="text-sm text-surface-400 mt-1">Last 30 days</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-surface-100">
            <p className="text-sm text-surface-500 mb-1">This Month</p>
            <p className="text-3xl font-bold text-surface-800">₦0.00</p>
            <p className="text-sm text-surface-400 mt-1">0 transactions</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-surface-100">
            <p className="text-sm text-surface-500 mb-1">Categories</p>
            <p className="text-3xl font-bold text-surface-800">0</p>
            <p className="text-sm text-surface-400 mt-1">Active categories</p>
          </div>
        </div>

        <Link
          href="/expense"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </Link>
      </main>
    </div>
  );
}
