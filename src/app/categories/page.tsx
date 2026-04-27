"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2, AlertTriangle, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";

const FALLBACK_CATEGORY = "Uncategorized";

const defaultCategories = [
  { name: "Transport" },
  { name: "Food & Meals" },
  { name: "Office" },
  { name: "Software" },
  { name: "Rent" },
  { name: "Marketing" },
  { name: "Miscellaneous" },
];

const isDefaultCategory = (name: string): boolean => {
  if (!name) return false;
  return defaultCategories.some(c => c.name.toLowerCase() === name.toLowerCase()) ||
    name.toLowerCase() === "uncategorized";
};

interface CategoryItem {
  name: string;
  isDefault: boolean;
}

export default function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryItem[]>(
    defaultCategories.map(c => ({ ...c, isDefault: true }))
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; category: string | null; loading: boolean }>({
    show: false,
    category: null,
    loading: false,
  });

  const fetchCustomCategories = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('category')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching categories:', error);
        setLoading(false);
        return;
      }

      const uniqueCategories = new Set<string>();
      
      if (data) {
        data.forEach(expense => {
          if (expense.category && typeof expense.category === 'string' && expense.category.trim()) {
            uniqueCategories.add(expense.category.trim());
          }
        });
      }

      const customCategories: CategoryItem[] = [];
      uniqueCategories.forEach(name => {
        if (!isDefaultCategory(name)) {
          customCategories.push({ name, isDefault: false });
        }
      });

      customCategories.sort((a, b) => a.name.localeCompare(b.name));

      setCategories([
        ...defaultCategories.map(c => ({ ...c, isDefault: true })),
        ...customCategories
      ]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCustomCategories();
  }, [fetchCustomCategories]);

  useEffect(() => {
    const handleExpenseAdded = () => fetchCustomCategories();
    const handleExpenseEdited = () => fetchCustomCategories();
    
    window.addEventListener("expense-added", handleExpenseAdded);
    window.addEventListener("expense-edited", handleExpenseEdited);
    
    return () => {
      window.removeEventListener("expense-added", handleExpenseAdded);
      window.removeEventListener("expense-edited", handleExpenseEdited);
    };
  }, [fetchCustomCategories]);

  const handleAdd = () => {
    if (newCategory.trim() && !isDefaultCategory(newCategory.trim())) {
      setCategories(prev => {
        const alreadyExists = prev.some(c => c.name.toLowerCase() === newCategory.trim().toLowerCase());
        if (alreadyExists) return prev;
        
        return [...prev, { name: newCategory.trim(), isDefault: false }];
      });
      setNewCategory("");
      setShowAddForm(false);
    }
  };

  const handleDelete = (name: string) => {
    setDeleteConfirm({ show: true, category: name, loading: false });
  };

  const confirmDelete = async () => {
    if (!user || !deleteConfirm.category) return;

    setDeleteConfirm(prev => ({ ...prev, loading: true }));

    try {
      await supabase
        .from('expenses')
        .update({ category: FALLBACK_CATEGORY })
        .eq('user_id', user.id)
        .ilike('category', deleteConfirm.category);

      await fetchCustomCategories();
      window.dispatchEvent(new CustomEvent("category-deleted"));
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setDeleteConfirm({ show: false, category: null, loading: false });
    }
  };

  const defaultList = categories.filter(c => c.isDefault);
  const customList = categories.filter(c => !c.isDefault);

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white px-4 pt-12 pb-4">
        <Link href="/profile" className="flex items-center gap-2 mb-3">
          <ChevronLeft className="w-5 h-5 text-surface-600" />
          <span className="text-surface-600 text-sm">Back</span>
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-surface-800">Categories</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 text-primary font-medium p-2"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {showAddForm && (
        <div className="px-4 py-3 bg-white border-b border-surface-100">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category name"
              className="input-field flex-1"
              autoFocus
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2.5 bg-primary text-white font-medium rounded-xl"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewCategory("");
              }}
              className="px-4 py-2.5 text-surface-600 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="px-4 py-8 text-center text-surface-500">
          Loading categories...
        </div>
      ) : (
        <>
          <div className="px-4">
            <p className="text-xs text-surface-500 mb-2 px-1">Default</p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {defaultList.map((category, index) => (
                <div
                  key={category.name}
                  className={`flex items-center justify-between p-4 ${
                    index !== defaultList.length - 1 ? "border-b border-surface-100" : ""
                  }`}
                >
                  <span className="font-medium text-surface-800">{category.name}</span>
                </div>
              ))}
            </div>
          </div>

          {customList.length > 0 && (
            <div className="px-4 mt-4">
              <p className="text-xs text-surface-500 mb-2 px-1">Custom</p>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {customList.map((category, index) => (
                  <div
                    key={category.name}
                    className={`flex items-center justify-between p-4 ${
                      index !== customList.length - 1 ? "border-b border-surface-100" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-surface-800">{category.name}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(category.name)}
                      className="text-error p-1"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {customList.length === 0 && (
            <p className="px-4 py-4 text-xs text-surface-400 text-center">
              No custom categories yet. Add an expense with a custom category to see it here.
            </p>
          )}
        </>
      )}

      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <button
                onClick={() => setDeleteConfirm({ show: false, category: null, loading: false })}
                className="ml-auto p-1"
              >
                <X className="w-5 h-5 text-surface-400" />
              </button>
            </div>
            <h2 className="text-lg font-semibold text-surface-800 mb-2">Delete Category</h2>
            <p className="text-surface-600 text-sm mb-6">
              Are you sure you want to delete &quot;{deleteConfirm.category}&quot;? 
              All expenses with this category will be moved to &quot;{FALLBACK_CATEGORY}&quot;.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, category: null, loading: false })}
                className="flex-1 px-4 py-2.5 border border-surface-200 text-surface-700 font-medium rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteConfirm.loading}
                className="flex-1 px-4 py-2.5 bg-error text-white font-medium rounded-xl disabled:opacity-50"
              >
                {deleteConfirm.loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="px-4 py-4 text-xs text-surface-400 text-center">
        Custom categories are derived from your expenses.
      </p>
    </div>
  );
}