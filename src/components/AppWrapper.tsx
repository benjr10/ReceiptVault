"use client";

import { useState, useEffect, ReactNode } from "react";
import AddExpenseModal from "./AddExpenseModal";
import EditExpenseModal from "./EditExpenseModal";
import { AuthProvider } from "./AuthContext";
import { ExpensesProvider } from "./ExpensesContext";

interface AppWrapperProps {
  children: ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{ text: string; visible: boolean } | null>(null);

  const handleAddSuccess = (expense: any) => {
    window.dispatchEvent(new CustomEvent("expense-added", { detail: expense }));
    setSuccessMessage({ text: "Added", visible: true });
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  useEffect(() => {
    setMounted(true);

    const handleOpenAddExpense = () => setShowAddExpense(true);
    window.addEventListener("open-add-expense", handleOpenAddExpense);

    const handleOpenEditExpense = (e: CustomEvent) => {
      setEditingExpense(e.detail);
      setShowEditExpense(true);
    };
    window.addEventListener("open-edit-expense", handleOpenEditExpense as any);

    const handleExpenseAdded = (e: CustomEvent) => {
      setSuccessMessage({ text: "Added", visible: true });
      setTimeout(() => setSuccessMessage(null), 3000);
    };
    window.addEventListener("expense-added", handleExpenseAdded as any);

    const handleExpenseEdited = () => {
      setSuccessMessage({ text: "Edited", visible: true });
      setTimeout(() => setSuccessMessage(null), 3000);
    };
    window.addEventListener("expense-edited", handleExpenseEdited);

    const handleExpenseDeleted = () => {
      setSuccessMessage({ text: "Expense Deleted", visible: true });
      setTimeout(() => setSuccessMessage(null), 3000);
    };
    window.addEventListener("expense-deleted", handleExpenseDeleted);

    return () => {
      window.removeEventListener("open-add-expense", handleOpenAddExpense);
      window.removeEventListener("open-edit-expense", handleOpenEditExpense as any);
      window.removeEventListener("expense-added", handleExpenseAdded as any);
      window.removeEventListener("expense-edited", handleExpenseEdited);
      window.removeEventListener("expense-deleted", handleExpenseDeleted);
    };
  }, []);

  const handleCloseAdd = () => {
    setShowAddExpense(false);
  };

  const handleCloseEdit = () => {
    setShowEditExpense(false);
    setEditingExpense(null);
  };

  const handleEditSuccess = () => {
    window.dispatchEvent(new CustomEvent("expense-edited"));
    window.dispatchEvent(new CustomEvent("refresh-dashboard"));
  };

  if (!mounted) return null;

  return (
    <AuthProvider>
      <ExpensesProvider>
        <>
          {children}
          <AddExpenseModal 
            isOpen={showAddExpense} 
            onClose={handleCloseAdd}
            onSuccess={handleAddSuccess}
          />
          {showEditExpense && editingExpense && (
            <EditExpenseModal
              expense={editingExpense}
              onClose={handleCloseEdit}
              onSuccess={handleEditSuccess}
            />
          )}
          {successMessage?.visible && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-secondary text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="label-medium">{successMessage.text}</span>
            </div>
          )}
        </>
      </ExpensesProvider>
    </AuthProvider>
  );
}