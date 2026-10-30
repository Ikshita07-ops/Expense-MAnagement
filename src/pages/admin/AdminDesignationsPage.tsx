import React, { useState, useEffect } from 'react';
import { Designation, Department } from '@/types';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNotifications } from '@/contexts/NotificationContext';
import { Briefcase, Plus, Edit2 } from 'lucide-react';

export const AdminDesignationsPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isOpen, setIsOpen] = useState(false);
  const [editingDes, setEditingDes] = useState<Designation | null>(null);
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [level, setLevel] = useState(1);

  const loadData = async () => {
    try {
      const [des, dep] = await Promise.all([api.getDesignations(), api.getDepartments()]);
      setDesignations(des);
      setDepartments(dep);
    } catch (err) {
      console.error('Failed to load designations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingDes(null);
    setTitle('');
    setDepartmentId(departments[0]?.id || '');
    setLevel(1);
    setIsOpen(true);
  };

  const openEdit = (d: Designation) => {
    setEditingDes(d);
    setTitle(d.title);
    setDepartmentId(d.department_id || '');
    setLevel(d.level);
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      showToast('Validation', 'Title is required.', 'warning');
      return;
    }

    const dept = departments.find((d) => d.id === departmentId);

    try {
      await api.saveDesignation({
        id: editingDes?.id,
        title,
        department_id: departmentId,
        department_name: dept?.name,
        level: Number(level),
      });

      showToast('Saved', `Designation ${title} saved successfully.`, 'success');
      setIsOpen(false);
      await loadData();
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to save designation', 'error');
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
            Designations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Job titles, departmental associations, and organizational seniority levels
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Designation
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Designation Title</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Level</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {designations.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70">
                  <td className="py-4 px-6 font-semibold text-slate-900">{d.title}</td>
                  <td className="py-4 px-4 text-xs text-slate-600">{d.department_name || 'Cross-functional'}</td>
                  <td className="py-4 px-4 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                      Level {d.level}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(d)}>
                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingDes ? 'Edit Designation' : 'Add Designation'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department
            </label>
            <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Seniority Level (1 to 10)
            </label>
            <Input
              type="number"
              min="1"
              max="10"
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
