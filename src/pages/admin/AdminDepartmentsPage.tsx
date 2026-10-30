import React, { useState, useEffect } from 'react';
import { Department, UserProfile } from '@/types';
import { api } from '@/services/api';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNotifications } from '@/contexts/NotificationContext';
import { Building, Plus, Edit2 } from 'lucide-react';

export const AdminDepartmentsPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isOpen, setIsOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [headId, setHeadId] = useState('');
  const [budget, setBudget] = useState(1000000);

  const loadData = async () => {
    try {
      const [d, p] = await Promise.all([api.getDepartments(), api.getProfiles()]);
      setDepartments(d);
      setProfiles(p);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingDept(null);
    setName('');
    setCode('');
    setDescription('');
    setHeadId('');
    setBudget(1000000);
    setIsOpen(true);
  };

  const openEdit = (d: Department) => {
    setEditingDept(d);
    setName(d.name);
    setCode(d.code);
    setDescription(d.description || '');
    setHeadId(d.head_id || '');
    setBudget(d.budget);
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      showToast('Validation', 'Department name and code are required.', 'warning');
      return;
    }

    const head = profiles.find((p) => p.id === headId);

    try {
      await api.saveDepartment({
        id: editingDept?.id,
        name,
        code,
        description,
        head_id: headId || undefined,
        head_name: head?.full_name,
        budget: Number(budget),
        is_active: true,
      });

      showToast('Saved', `Department ${name} saved successfully.`, 'success');
      setIsOpen(false);
      await loadData();
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to save department', 'error');
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
            Departments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage cost centers, department heads, and expense budgets
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((d) => (
          <Card key={d.id} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                  {d.code}
                </span>
                <Button variant="ghost" size="sm" onClick={() => openEdit(d)}>
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                </Button>
              </div>
              <h3 className="text-base font-bold text-slate-900">{d.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{d.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Department Head:</span>
                <span className="font-semibold text-slate-800">{d.head_name || 'Unassigned'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Budget:</span>
                <span className="font-extrabold text-indigo-700">{formatINR(d.budget)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingDept ? 'Edit Department' : 'Create Department'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department Name <span className="text-rose-500">*</span>
            </label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Code (e.g. ENG, FIN) <span className="text-rose-500">*</span>
            </label>
            <Input required value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department Head
            </label>
            <Select value={headId} onChange={(e) => setHeadId(e.target.value)}>
              <option value="">Unassigned</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.role})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Annual Budget (INR)
            </label>
            <Input
              type="number"
              min="0"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Department
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
