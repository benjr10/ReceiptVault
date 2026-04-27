"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Camera, Check } from "lucide-react";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { getCurrencySymbol } from "@/lib/currency";
import { saveToOfflineQueue } from "@/lib/offlineQueue";
import { createExpenseRecordedNotification, canUploadReceipt } from "@/lib/notifications";

const defaultCategories = [
  { name: "Transport", icon: "🚗" },
  { name: "Food & Meals", icon: "🍔" },
  { name: "Office", icon: "🏢" },
  { name: "Software", icon: "💻" },
  { name: "Rent", icon: "🏠" },
  { name: "Marketing", icon: "📢" },
  { name: "Miscellaneous", icon: "📦" },
];

const isDefaultCategory = (name: string): boolean => {
  return defaultCategories.some(c => c.name.toLowerCase() === name.toLowerCase()) ||
    name.toLowerCase() === "uncategorized";
};

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  created_at: string;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (expense: Expense) => void;
}

export default function AddExpenseModal({ isOpen, onClose, onSuccess }: AddExpenseModalProps) {
  const { user, currency } = useAuth();
  const symbol = getCurrencySymbol(currency);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [projectClient, setProjectClient] = useState("");
  const [note, setNote] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [errors, setErrors] = useState<{ title?: string; amount?: string; category?: string }>({});
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allCategories = [...defaultCategories.map(c => c.name), ...customCategories];

  const fetchCustomCategories = useCallback(async () => {
    if (!user) return;
    
    if (!navigator.onLine) {
      const cached = localStorage.getItem('receiptvault_custom_categories');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setCustomCategories(parsed);
        } catch (e) {}
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('category')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      const uniqueCategories = new Set<string>();

      if (data) {
        data.forEach(expense => {
          if (expense.category && typeof expense.category === 'string' && expense.category.trim()) {
            const trimmed = expense.category.trim();
            if (!isDefaultCategory(trimmed)) {
              uniqueCategories.add(trimmed);
            }
          }
        });
      }

      setCustomCategories(Array.from(uniqueCategories).sort());
      localStorage.setItem('receiptvault_custom_categories', JSON.stringify(Array.from(uniqueCategories).sort()));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchCustomCategories();
      setTitle("");
      setAmount("");
      setCategory("");
      setProjectClient("");
      setNote("");
      setErrors({});
      setShowCustomInput(false);
      setNewCategoryName("");
      setReceiptPreview(null);
    }
  }, [isOpen, fetchCustomCategories]);

  useEffect(() => {
    if (!isOpen) return;

    const handleExpensesChanged = () => fetchCustomCategories();
    window.addEventListener("expense-added", handleExpensesChanged);
    window.addEventListener("expense-edited", handleExpensesChanged);
    window.addEventListener("category-deleted", handleExpensesChanged);

    return () => {
      window.removeEventListener("expense-added", handleExpensesChanged);
      window.removeEventListener("expense-edited", handleExpensesChanged);
      window.removeEventListener("category-deleted", handleExpensesChanged);
    };
  }, [isOpen, fetchCustomCategories]);

  const handleAddCustomCategory = () => {
    if (!newCategoryName.trim()) return;

    const formattedName = newCategoryName.trim();
    if (!customCategories.some(c => c.toLowerCase() === formattedName.toLowerCase())) {
      setCustomCategories(prev => [...prev, formattedName].sort());
    }

    setNewCategoryName("");
    setShowCustomInput(false);
    setCategory(formattedName);
  };

  const maxNoteLength = 200;
  const maxTitleLength = 100;
  const maxProjectLength = 100;

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; amount?: string; category?: string } = {};
  
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    if (!category) {
      newErrors.category = "Please select a category";
    }
  
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const isOnline = navigator.onLine;

    let currentUser = user;
    if (isOnline) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        console.error("User not authenticated");
        return;
      }
      currentUser = authUser;
    } else if (!currentUser) {
      console.error("User not authenticated and offline");
      return;
    }

    try {
      const now = new Date().toISOString();
      
      const expenseData: Record<string, unknown> = {
        user_id: currentUser!.id,
        title: title.trim(),
        amount: parseFloat(amount),
        created_at: now,
      };
      
      if (note.trim()) {
        expenseData.note = note.trim();
      }
      
      if (projectClient.trim()) {
        expenseData.project_client = projectClient.trim();
      }

      if (category) {
        expenseData.category = category;
      }

      if (!isOnline) {
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        saveToOfflineQueue({
          tempId,
          user_id: currentUser!.id,
          title: title.trim(),
          amount: parseFloat(amount),
          category: category,
          note: note.trim() || undefined,
          project_client: projectClient.trim() || undefined,
          created_at: now,
          receipt_url: receiptPreview || undefined,
        });
        
        if (onSuccess) {
          onSuccess({ 
            id: tempId, 
            title: title.trim(), 
            amount: parseFloat(amount), 
            category: category, 
            created_at: now,
            receipt_url: receiptPreview || undefined,
            isOffline: true,
          } as Expense);
          createExpenseRecordedNotification(parseFloat(amount), currency);
        }
        onClose();
        clearReceipt();
        return;
      }

      let uploadedReceiptUrl = '';
      if (receiptFile && user) {
        const storageCheck = await canUploadReceipt(user.id);
        if (!storageCheck.allowed) {
          alert(storageCheck.message || "Storage limit reached. Cannot upload receipt.");
          return;
        }
        
        const fileExt = receiptFile.name.split('.').pop() || 'jpg';
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        const fileName = `${user.id}/${timestamp}_${randomId}.${fileExt}`;
        
        console.log('=== RECEIPT UPLOAD ===');
        console.log('userId:', user.id);
        console.log('fileName:', fileName);
        console.log('file type:', receiptFile.type);
        console.log('file size:', receiptFile.size);
        
        if (!receiptFile.type || !receiptFile.type.startsWith('image/')) {
          console.error('Invalid file type:', receiptFile.type);
        }
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, receiptFile, {
            contentType: receiptFile.type,
            cacheControl: '3600',
            upsert: false
          });
        
        console.log('Upload success:', !uploadError);
        console.log('Upload data:', uploadData);
        console.log('Upload error:', uploadError);
        
        if (uploadError) {
          console.error('Error uploading receipt:', uploadError.message);
        } else {
          // Successfully uploaded to private storage
          // We now store just the fileName (path) instead of a public URL
          expenseData.receipt_url = fileName;
          console.log('Stored receipt path:', fileName);
        }
      }

      const { data, error } = await supabase.from('expenses').insert(expenseData).select().single();

      if (error) {
        console.error('Error saving expense:', error);
        alert('Failed to save expense. Please try again.');
        return;
      }

      if (onSuccess) {
        onSuccess(data as Expense);
        createExpenseRecordedNotification(data.amount, currency);
      }
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleCategoryClick = (catName: string) => {
    if (catName === "Custom") {
      setShowCustomInput(true);
    } else {
      setCategory(catName);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowed.includes(file.type)) {
        alert('Please upload an image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearReceipt = () => {
    setReceiptPreview(null);
    setReceiptFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl w-full max-w-md animate-slide-up pb-8 max-h-[90vh] overflow-y-auto">
        <div className="p-4 flex items-center justify-between border-b border-surface-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-surface-800">Add Expense</h2>
          <button onClick={onClose} className="p-1">
            <X className="w-6 h-6 text-surface-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label htmlFor="expense-title" className="label-medium text-primary mb-2 block">
              Title *
            </label>
            <input
              type="text"
              id="expense-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-4 border border-surface-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white placeholder:text-[#B1B1B1] placeholder:font-[14px] placeholder:font-medium placeholder:leading-[16px] placeholder:tracking-[-0.14px] ${errors.title ? "border-red-500" : ""}`}
              placeholder="What did you buy?"
              maxLength={maxTitleLength}
            />
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-surface-400">{title.length}/{maxTitleLength}</span>
            </div>
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="expense-amount" className="label-medium text-primary mb-2 block">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 font-medium">
                {symbol}
              </span>
              <input
                type="number"
                id="expense-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-10 pr-4 py-4 border border-surface-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white placeholder:text-[#B1B1B1] placeholder:font-[14px] placeholder:font-medium placeholder:leading-[16px] placeholder:tracking-[-0.14px] ${errors.amount ? "border-red-500" : ""}`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="label-medium text-primary mb-2 block">Select Category *</label>
            {errors.category && <p className="text-sm text-red-500 mb-2">{errors.category}</p>}
            {showCustomInput && (
              <div className="mb-3 p-3 bg-surface-50 rounded-xl flex items-center gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter category name"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  disabled={!newCategoryName.trim()}
                  className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white disabled:opacity-50"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="grid grid-cols-4 gap-2">
              {defaultCategories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                    category === cat.name
                      ? "border-primary bg-primary"
                      : "border-surface-200 hover:border-surface-300 bg-white"
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className={`text-xs label-medium ${category === cat.name ? "text-white" : "text-surface-600"}`}>
                    {cat.name}
                  </span>
                </button>
              ))}
              {customCategories.map((catName) => (
                <button
                  key={catName}
                  type="button"
                  onClick={() => setCategory(catName)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                    category === catName
                      ? "border-primary bg-primary"
                      : "border-surface-200 hover:border-surface-300 bg-white"
                  }`}
                >
                  <span className="text-xl">📝</span>
                  <span className={`text-xs label-medium ${category === catName ? "text-white" : "text-surface-600"}`}>
                    {catName}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border border-dashed border-surface-300 hover:border-primary bg-surface-50 transition-all"
              >
                <span className="text-xl">➕</span>
                <span className="text-xs label-medium text-surface-500">Custom</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="expense-project" className="label-medium text-surface-600 mb-2 block">
              Project / Client <span className="text-surface-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              id="expense-project"
              value={projectClient}
              onChange={(e) => setProjectClient(e.target.value)}
              className="w-full px-4 py-4 border border-surface-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white placeholder:text-[#B1B1B1] placeholder:font-[14px] placeholder:font-medium placeholder:leading-[16px] placeholder:tracking-[-0.14px]"
              placeholder="e.g., Project Alpha or Client Name"
              maxLength={maxProjectLength}
            />
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-surface-400">{projectClient.length}/{maxProjectLength}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="expense-note" className="label-medium text-surface-600 mb-0">
                Note <span className="text-surface-400 font-normal">(optional)</span>
              </label>
              <span className="text-xs text-surface-400">
                {note.length}/{maxNoteLength}
              </span>
            </div>
            <textarea
              id="expense-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, maxNoteLength))}
              className="w-full px-4 py-4 border border-surface-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white min-h-[80px] resize-none placeholder:text-[#B1B1B1] placeholder:font-[14px] placeholder:font-medium placeholder:leading-[16px] placeholder:tracking-[-0.14px]"
              placeholder="Add a note..."
            />
          </div>

          <div>
            <label className="label-medium text-surface-600 mb-2 block">Receipt</label>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-surface-200 rounded-xl p-4 flex flex-col items-center text-center cursor-pointer hover:border-surface-300 transition-colors min-h-[120px]"
            >
              {receiptPreview ? (
                <div className="relative w-full">
                  <img 
                    src={receiptPreview} 
                    alt="Receipt preview" 
                    className="max-h-24 mx-auto rounded-lg object-contain"
                  />
                  <button 
                    type="button"
                    onClick={clearReceipt}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <p className="text-xs text-surface-500 mt-2">Tap to change</p>
                </div>
              ) : (
                <>
                  <Camera className="w-8 h-8 text-surface-400 mb-2" />
                  <p className="text-sm text-surface-600 font-medium">Snap or Upload Receipt</p>
                  <p className="text-xs text-surface-400 mt-1">JPG, PNG, up to 10MB</p>
                </>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full bg-primary text-white font-semibold py-4 rounded-xl transition-all hover:bg-primary-600">
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}