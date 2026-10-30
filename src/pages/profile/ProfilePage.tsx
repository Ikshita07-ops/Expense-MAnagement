import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { User, Mail, Shield, Building, Briefcase, Phone, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateCurrentUser } = useAuth();
  const { showToast } = useNotifications();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCurrentUser({ full_name: fullName, phone });
      showToast('Profile Updated', 'Your profile details have been saved.', 'success');
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your enterprise profile details and contact information
        </p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          <img
            src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={user.full_name}
            className="w-20 h-20 rounded-3xl object-cover ring-4 ring-indigo-500/20 shadow-md"
          />
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-slate-900">{user.full_name}</h2>
            <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {user.email}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="text-xs px-3 py-1 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize">
                {user.role} Role
              </span>
              <span className="text-xs px-3 py-1 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {user.department_name || 'Engineering'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 00000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email (Read-Only)
              </label>
              <Input disabled value={user.email} className="bg-slate-100" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reporting Manager
              </label>
              <Input
                disabled
                value={user.manager_name || 'Executive Level / None'}
                className="bg-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
