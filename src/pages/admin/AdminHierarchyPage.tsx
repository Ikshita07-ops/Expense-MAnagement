import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';
import { useNotifications } from '@/contexts/NotificationContext';
import { GitFork, Users, ChevronDown, User, ShieldCheck } from 'lucide-react';

export const AdminHierarchyPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const p = await api.getProfiles();
      setProfiles(p);
    } catch (err) {
      console.error('Failed to load hierarchy data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChangeManager = async (employeeId: string, newManagerId: string) => {
    // Prevent circular: cannot assign oneself as manager
    if (employeeId === newManagerId) {
      showToast('Circular Warning', 'An employee cannot report to themselves.', 'warning');
      return;
    }

    try {
      const mgr = profiles.find((p) => p.id === newManagerId);
      await api.updateProfile(employeeId, {
        manager_id: newManagerId || undefined,
        manager_name: mgr?.full_name,
      });
      showToast('Hierarchy Updated', 'Reporting manager updated successfully.', 'success');
      await loadData();
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to update hierarchy', 'error');
    }
  };

  // Group direct reports by manager
  const managers = profiles.filter(
    (p) => p.role === 'manager' || p.role === 'admin' || !p.manager_id
  );

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
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Organizational Reporting Hierarchy
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Visual tree of managers and direct reports with circular-reference protection
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {managers.map((mgr) => {
          const directReports = profiles.filter((p) => p.manager_id === mgr.id);

          return (
            <Card key={mgr.id} className="p-6">
              {/* Manager Header Box */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                <div className="flex items-center gap-3.5">
                  <img
                    src={mgr.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={mgr.full_name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      {mgr.full_name}
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800 capitalize">
                        {mgr.role}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {mgr.designation_title || 'Lead'} • {mgr.department_name || 'Engineering'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-700 bg-white px-3 py-1.5 rounded-xl border border-indigo-200">
                    {directReports.length} {directReports.length === 1 ? 'Direct Report' : 'Direct Reports'}
                  </span>
                </div>
              </div>

              {/* Direct Reports List */}
              <div className="mt-4 pl-4 sm:pl-8 border-l-2 border-indigo-200 space-y-3">
                {directReports.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No direct reports currently assigned to this manager.
                  </p>
                ) : (
                  directReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={report.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={report.full_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{report.full_name}</p>
                          <p className="text-[11px] text-slate-500">{report.designation_title} • {report.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">Reassign Manager:</span>
                        <select
                          value={report.manager_id || ''}
                          onChange={(e) => handleChangeManager(report.id, e.target.value)}
                          className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {managers
                            .filter((m) => m.id !== report.id)
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.full_name} ({m.designation_title || m.role})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
