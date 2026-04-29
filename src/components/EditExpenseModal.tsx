"use client";

import { useState, useEffect } from "react";
import { X, Edit2, Trash2, Camera, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getReceiptSignedUrl } from "@/lib/storage";
import { getCategoryIcon, getCategoryLabel } from "@/lib/categories";
import { useAuth } from "@/components/AuthContext";
import { formatCurrency } from "@/lib/currency";
import { createExpenseDeletedNotification, createExpenseEditedNotification } from "@/lib/notifications";

const defaultCategories = [
  { name: "Transport", icon: "🚗" },
  { name: "Food & Meals", icon: "🍔" },
  { name: "Office", icon: "🏢" },
  { name: "Software", icon: "💻" },
  { name: "Rent", icon: "🏠" },
  { name: "Marketing", icon: "📢" },
  { name: "Miscellaneous", icon: "📦" },
];

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  project_client: string | null;
  note: string | null;
  created_at: string;
  receipt_url?: string;
}

interface EditExpenseModalProps {
  expense: Expense;
  onClose: () => void;
  onSuccess: () => void;
}

function DetailView({ expense, onEdit, onDelete, onClose }: { expense: Expense; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const { currency } = useAuth();
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState(false);
  const [resolvedReceiptUrl, setResolvedReceiptUrl] = useState<string | null>(null);
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const rawReceiptUrl = (expense as any).receipt_url;
  
  useEffect(() => {
    if (showReceipt && rawReceiptUrl && !resolvedReceiptUrl) {
      const resolveUrl = async () => {
        setIsResolvingUrl(true);
        const signedUrl = await getReceiptSignedUrl(rawReceiptUrl);
        setResolvedReceiptUrl(signedUrl);
        setIsResolvingUrl(false);
      };
      resolveUrl();
    }
  }, [showReceipt, rawReceiptUrl, resolvedReceiptUrl]);

  const receiptUrl = resolvedReceiptUrl || (rawReceiptUrl?.startsWith('data:') ? rawReceiptUrl : null);

  const handleReceiptError = () => {
    console.log('Receipt image failed to load');
    setReceiptError(true);
  };

  const isValidImage = (src: any): src is string => 
    typeof src === "string" && src.length > 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl w-full max-w-sm p-5 max-h-[80vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 p-1">
            <X className="w-5 h-5 text-surface-400" />
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-surface-100 rounded-full flex items-center justify-center text-3xl">
              {getCategoryIcon(expense.category)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-800">{expense.title}</h2>
              <p className="text-sm text-surface-500">{getCategoryLabel(expense.category) || 'Uncategorized'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-surface-100">
              <span className="text-surface-500">Amount</span>
              <span className="font-semibold text-surface-800">{formatCurrency(Number(expense.amount) || 0, currency)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-surface-100">
              <span className="text-surface-500">Date</span>
              <span className="text-surface-800">{formatDate(expense.created_at)}</span>
            </div>
            {rawReceiptUrl && (
              <div className="py-3 border-b border-surface-100">
                <span className="text-surface-500 block mb-2">Receipt</span>
                <button
                  onClick={() => { setReceiptError(false); setShowReceipt(true); }}
                  className="flex items-center gap-2 text-primary font-medium hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Receipt
                </button>
              </div>
            )}
          {expense.project_client && (
            <div className="flex justify-between py-3 border-b border-surface-100">
              <span className="text-surface-500">Project/Client</span>
              <span className="text-surface-800">{expense.project_client}</span>
            </div>
          )}
          {expense.note && (
            <div className="py-3 border-b border-surface-100">
              <span className="text-surface-500 block mb-1">Note</span>
              <p className="text-surface-800">{expense.note}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl hover:bg-primary-600">
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-2 py-3 bg-error text-white rounded-xl hover:bg-red-600">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
      </div>

      {/* Receipt Preview Modal */}
      {showReceipt && rawReceiptUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowReceipt(false)} />
          <div className="relative bg-white rounded-xl max-w-full max-h-[90vh] overflow-hidden min-w-[200px] min-h-[200px] flex items-center justify-center">
            <button 
              onClick={() => setShowReceipt(false)} 
              className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-lg"
            >
              <X className="w-5 h-5 text-surface-600" />
            </button>
            
            {isResolvingUrl ? (
              <div className="flex flex-col items-center gap-2 p-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-surface-500 font-medium">Securing access...</p>
              </div>
            ) : isValidImage(receiptUrl) && !receiptError ? (
              <img 
                src={receiptUrl} 
                alt="Receipt" 
                className="max-w-full max-h-[90vh] object-contain"
                onError={handleReceiptError}
              />
            ) : receiptError ? (
              <div className="p-8 text-center">
                <p className="text-red-500 font-medium">Failed to load receipt</p>
                <p className="text-sm text-surface-500 mt-2">The image could not be retrieved securely</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

    </>
  );
}

function DeleteConfirmModal({ expense, onClose, onConfirm }: { expense: Expense; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-5">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-error" />
          </div>
          <h2 className="text-lg font-semibold text-surface-800">Delete Expense?</h2>
          <p className="text-surface-500 text-sm mt-2">Are you sure you want to delete this expense? This action cannot be undone.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-surface-100 text-surface-700 rounded-xl font-medium hover:bg-surface-200">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-error text-white rounded-xl font-medium hover:bg-red-600">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditExpenseModal({ expense, onClose, onSuccess }: EditExpenseModalProps) {
  const { currency } = useAuth();
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view');
  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState(String(expense.amount));
  const [category, setCategory] = useState(expense.category || '');
  const [projectClient, setProjectClient] = useState(expense.project_client || '');
  const [note, setNote] = useState(expense.note || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; amount?: string }>({});
  
  const maxTitleLength = 100;
  const maxProjectLength = 100;
  const maxNoteLength = 200;

  useEffect(() => {
    if (mode === 'edit') {
      setTitle(expense.title);
      setAmount(String(expense.amount));
      setCategory(expense.category || '');
      setProjectClient(expense.project_client || '');
      setNote(expense.note || '');
      setErrors({});
    }
  }, [mode, expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; amount?: string } = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!amount) {
      newErrors.amount = "Amount is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const updateData: Record<string, unknown> = {
        title: title.trim(),
        amount: parseFloat(amount),
      };

      if (projectClient.trim()) {
        updateData.project_client = projectClient.trim();
      }

      if (note.trim()) {
        updateData.note = note.trim();
      }

      if (category) {
        updateData.category = category;
      }

      if ((expense as any).isOffline) {
        // Update offline queue
        import('@/lib/offlineQueue').then(({ updateQueueItem, getCachedExpenses, saveCachedExpenses }) => {
          updateQueueItem(expense.id, updateData);
          
          // Update cache
          const cached = getCachedExpenses();
          const updatedCache = cached.map(e => e.id === expense.id ? { ...e, ...updateData } : e);
          saveCachedExpenses(updatedCache);
          
          createExpenseEditedNotification(Number(updateData.amount || expense.amount), currency);
          window.dispatchEvent(new CustomEvent("refresh-dashboard"));
          onSuccess();
          onClose();
        });
      } else {
        const { error } = await supabase.from('expenses').update(updateData).eq('id', expense.id);

        if (error) throw error;
        createExpenseEditedNotification(Number(updateData.amount || expense.amount), currency);
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Error updating expense:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      if ((expense as any).isOffline) {
        import('@/lib/offlineQueue').then(({ removeFromOfflineQueue, getCachedExpenses, saveCachedExpenses }) => {
          removeFromOfflineQueue(expense.id);
          
          // Update cache
          const cached = getCachedExpenses();
          saveCachedExpenses(cached.filter(e => e.id !== expense.id));
          
          createExpenseDeletedNotification(expense.amount, currency);
          window.dispatchEvent(new CustomEvent("expense-deleted", { detail: { id: expense.id, isOffline: true } }));
          window.dispatchEvent(new CustomEvent("refresh-dashboard"));
          onClose();
        });
      } else {
        const { error } = await supabase.from('expenses').delete().eq('id', expense.id);
        if (error) throw error;
        
        // Update cache for online deletes to prevent ghosting
        import('@/lib/offlineQueue').then(({ getCachedExpenses, saveCachedExpenses }) => {
          const cached = getCachedExpenses();
          saveCachedExpenses(cached.filter(e => e.id !== expense.id));
        });

        createExpenseDeletedNotification(expense.amount, currency);
        window.dispatchEvent(new CustomEvent("expense-deleted", { detail: { id: expense.id, isOffline: false } }));
        window.dispatchEvent(new CustomEvent("refresh-dashboard"));
        onClose();
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  if (mode === 'view') {
    return (
      <DetailView
        expense={expense}
        onEdit={() => setMode('edit')}
        onDelete={() => setMode('delete')}
        onClose={onClose}
      />
    );
  }

  if (mode === 'delete') {
    return (
      <DeleteConfirmModal
        expense={expense}
        onClose={() => setMode('view')}
        onConfirm={handleDelete}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl w-full max-w-md animate-slide-up pb-8 max-h-[90vh] overflow-y-auto">
        <div className="p-4 flex items-center justify-between border-b border-surface-100">
          <h2 className="text-lg font-semibold text-surface-800">Edit Expense</h2>
          <button onClick={onClose} className="p-1">
            <X className="w-6 h-6 text-surface-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="label-medium text-primary mb-2 block">
              Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors({ ...errors, title: undefined }); }}
              className={`w-full px-4 py-4 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.title ? "border-error" : ""}`}
              placeholder="What did you buy?"
              maxLength={maxTitleLength}
            />
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-surface-400">{title.length}/{maxTitleLength}</span>
            </div>
            {errors.title && <p className="text-sm text-error mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="label-medium text-primary mb-2 block">
              Amount <span className="text-error">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setErrors({ ...errors, amount: undefined }); }}
              className={`w-full px-4 py-4 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.amount ? "border-error" : ""}`}
              placeholder="0.00"
            />
            {errors.amount && <p className="text-sm text-error mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="label-medium text-primary mb-2 block">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {defaultCategories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                    category === cat.name ? "border-primary bg-primary" : "border-surface-200 bg-white"
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className={`text-xs ${category === cat.name ? "text-white" : "text-surface-600"}`}>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-medium text-surface-600 mb-2 block">
              Project / Client <span className="text-surface-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={projectClient}
              onChange={(e) => setProjectClient(e.target.value)}
              className="w-full px-4 py-4 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="e.g., Project Alpha or Client Name"
              maxLength={maxProjectLength}
            />
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-surface-400">{projectClient.length}/{maxProjectLength}</span>
            </div>
          </div>

          <div>
            <label className="label-medium text-surface-600 mb-2 block">
              Note <span className="text-surface-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-4 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[80px] resize-none"
              placeholder="Add a note..."
              maxLength={maxNoteLength}
            />
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-surface-400">{note.length}/{maxNoteLength}</span>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary text-white font-semibold py-4 rounded-xl hover:bg-primary-600 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}