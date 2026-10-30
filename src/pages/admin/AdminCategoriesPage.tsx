import React, { useState, useEffect } from 'react';
import { ExpenseCategory } from '@/types';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNotifications } from '@/contexts/NotificationContext';
import { Tags, Plus, Edit2, CheckCircle2, XCircle } from 'lucide-react';

export const AdminCategoriesPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isOpen, setIsOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ExpenseCategory[] | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const loadData = async () => {
    try {
      const c = await api.getCategories();
      setCategories(c);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setName('');
    setDescription('');
    setIsOpen(true);
  };

  const toggleActive = async (c: ExpenseCategory) => {
    try {
      await api.saveCategory({ id: c.id, is_active: !c.is_active });
      showToast('Updated', `Category ${c.name} ${!c.is_active ? 'enabled' : 'disabled'}.`, 'info');
      await loadData();
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to update category', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      await api.saveCategory({
        name,
        description,
        is_active: true,
      });
      showToast('Created', `Category ${name} added.`, 'success');
      setIsOpen(false);
      await loadData();
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to save', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Expense Categories
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure permitted claim categories, expenditure guidelines, and active flags
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <Card key={c.id} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-bold text-slate-900">{c.name}</span>
                <button
                  onClick={() => toggleActive(c)}
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    c.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {c.is_active ? 'Active' : 'Disabled'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">{c.description}</p>
            </div>
          </Card>
        ))}
      </div>

      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Expense Category">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Guidelines
            </label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Category
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
