import React, { useState, useEffect } from 'react';
import { UserProfile, Role, Department, Designation } from '@/types';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNotifications } from '@/contexts/NotificationContext';
import { Users, Plus, Edit2, CheckCircle, XCircle, Search, Mail, Shield, Building } from 'lucide-react';

export const AdminEmployeesPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('employee');
  const [departmentId, setDepartmentId] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [phone, setPhone] = useState('');

  const loadData = async () => {
    try {
      const [p, d, des] = await Promise.all([
        api.getProfiles(),
        api.getDepartments(),
        api.getDesignations(),
      ]);
      setProfiles(p);
      setDepartments(d);
      setDesignations(des);
    } catch (err) {
      console.error('Failed to load employee data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingProfile(null);
    setFullName('');
    setEmail('');
    setRole('employee');
    setDepartmentId(departments[0]?.id || '');
    setDesignationId(designations[0]?.id || '');
    setManagerId('');
    setPhone('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: UserProfile) => {
    setEditingProfile(p);
    setFullName(p.full_name);
    setEmail(p.email);
    setRole(p.role);
    setDepartmentId(p.department_id || '');
    setDesignationId(p.designation_id || '');
    setManagerId(p.manager_id || '');
    setPhone(p.phone || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      showToast('Validation', 'Name and email are required.', 'warning');
      return;
    }

    const dept = departments.find((d) => d.id === departmentId);
    const des = designations.find((d) => d.id === designationId);
    const mgr = profiles.find((p) => p.id === managerId);

    try {
      if (editingProfile) {
        await api.updateProfile(editingProfile.id, {
          full_name: fullName,
          email,
          role,
          department_id: departmentId,
          department_name: dept?.name,
          designation_id: designationId,
          designation_title: des?.title,
          manager_id: managerId || undefined,
          manager_name: mgr?.full_name,
          phone,
        });
        showToast('Updated', `Employee ${fullName} updated successfully.`, 'success');
      } else {
        await api.createProfile({
          full_name: fullName,
          email,
          role,
          department_id: departmentId,
          department_name: dept?.name,
          designation_id: designationId,
          designation_title: des?.title,
          manager_id: managerId || undefined,
          manager_name: mgr?.full_name,
          phone,
          is_active: true,
          avatar_url: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150`,
        });
        showToast('Created', `Added ${fullName} to employee directory.`, 'success');
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to save employee.', 'error');
    }
  };

  const toggleActiveStatus = async (p: UserProfile) => {
    try {
      await api.updateProfile(p.id, { is_active: !p.is_active });
      showToast(
        p.is_active ? 'Deactivated' : 'Activated',
        `${p.full_name} is now ${p.is_active ? 'deactivated' : 'active'}.`,
        'info'
      );
      await loadData();
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to update status.', 'error');
    }
  };

  const filtered = profiles.filter((p) => {
    if (roleFilter !== 'all' && p.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = p.full_name.toLowerCase().includes(q);
      const matchEmail = p.email.toLowerCase().includes(q);
      const matchDept = p.department_name?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchDept) return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Employee Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage enterprise staff, assign departments, designations, and reporting hierarchies
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Employee
        </Button>
      </div>

      {/* Filter and Search */}
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
          <div className="lg:col-span-8">
            <Input
              placeholder="Search by employee name, email, department..."
              icon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="lg:col-span-4">
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="accounts">Accounts Officer</option>
              <option value="admin">Administrator</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Employee Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Department & Designation</th>
                <th className="py-3.5 px-4">Reporting Manager</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const roleColors: Record<Role, string> = {
                  admin: 'bg-purple-100 text-purple-700 border-purple-200',
                  manager: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                  accounts: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                  employee: 'bg-blue-100 text-blue-700 border-blue-200',
                };

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={p.full_name}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{p.full_name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" /> {p.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border capitalize ${roleColors[p.role]}`}>
                        {p.role}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <p className="font-medium text-slate-800 text-xs">{p.designation_title || 'Software Engineer'}</p>
                      <p className="text-[11px] text-slate-400">{p.department_name || 'Engineering'}</p>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-600">
                      {p.manager_name ? (
                        <span className="font-medium">{p.manager_name}</span>
                      ) : (
                        <span className="text-slate-400">— (Executive / None)</span>
                      )}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActiveStatus(p)}
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 transition-colors ${
                          p.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {p.is_active ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactive
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(p)}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Employee Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProfile ? 'Edit Employee Profile' : 'Add New Employee'}
        description="Configure employee role, organizational unit, and manager reporting line."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Email <span className="text-rose-500">*</span>
            </label>
            <Input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                System Role <span className="text-rose-500">*</span>
              </label>
              <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="accounts">Accounts Officer</option>
                <option value="admin">Administrator</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department
              </label>
              <Select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Designation
              </label>
              <Select
                value={designationId}
                onChange={(e) => setDesignationId(e.target.value)}
              >
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reporting Manager
              </label>
              <Select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
              >
                <option value="">None (Reports to CEO / VP)</option>
                {profiles
                  .filter((p) => p.role === 'manager' || p.role === 'admin')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.designation_title || m.role})
                    </option>
                  ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Phone
            </label>
            <Input
              placeholder="+91 98200 00000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingProfile ? 'Save Changes' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
