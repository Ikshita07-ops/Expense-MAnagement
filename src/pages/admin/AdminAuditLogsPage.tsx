import React, { useState, useEffect } from 'react';
import { AuditLogItem } from '@/types';
import { api } from '@/services/api';
import { formatDateTime } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ShieldCheck, Search, FileText } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const l = await api.getAuditLogs();
        setLogs(l);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filtered = logs.filter((l) => {
    if (search) {
      const q = search.toLowerCase();
      const matchActor = l.actor_name.toLowerCase().includes(q);
      const matchAction = l.action.toLowerCase().includes(q);
      const matchType = l.entity_type.toLowerCase().includes(q);
      if (!matchActor && !matchAction && !matchType) return false;
    }
    return true;
  });

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
          System Audit Logs
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Immutable compliance record of approvals, config modifications, and financial payouts
        </p>
      </div>

      <Card className="p-4">
        <Input
          placeholder="Filter audit logs by actor, action, or entity..."
          icon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-6">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-6 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {formatDateTime(l.created_at)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    {l.actor_name}
                    {l.actor_email && (
                      <span className="block text-[11px] font-normal text-slate-400">{l.actor_email}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-bold">
                      {l.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-600 uppercase whitespace-nowrap">
                    {l.entity_type}
                  </td>
                  <td className="py-3.5 px-6 text-xs text-slate-600 max-w-md">
                    {l.details ? (
                      <code className="text-[11px] bg-slate-100/80 px-2 py-1 rounded border border-slate-200">
                        {JSON.stringify(l.details)}
                      </code>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
