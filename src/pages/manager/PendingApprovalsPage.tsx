import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Voucher } from '@/types';
import { api } from '@/services/api';
import { formatINR, formatDate, getStatusConfig } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  CheckSquare,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const PendingApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const all = await api.getVouchers();
        const pending = all.filter(
          (v) =>
            v.status === 'pending_manager' ||
            v.status === 'pending_dept_head' ||
            v.status === 'pending_finance'
        );
        setVouchers(pending);
      } catch (err) {
        console.error('Failed to load pending queue:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filtered = vouchers.filter((v) => {
    if (search) {
      const q = search.toLowerCase();
      const matchNum = v.voucher_number.toLowerCase().includes(q);
      const matchName = v.employee_name?.toLowerCase().includes(q);
      const matchTitle = v.title.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchTitle) return false;
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Pending Approvals
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review, verify receipts, and approve or return team expense vouchers
        </p>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by voucher #, employee name, or title..."
              icon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Voucher Number</th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Title</th>
                <th className="py-3.5 px-4">Submitted Date</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Approval Step</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No pending approvals found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => navigate(`/vouchers/${v.id}`)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 font-mono font-semibold text-indigo-700">
                      {v.voucher_number}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-900">{v.employee_name}</td>
                    <td className="py-4 px-4 max-w-xs truncate font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {v.title}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500">{formatDate(v.submitted_at)}</td>
                    <td className="py-4 px-4 font-bold text-slate-900">{formatINR(v.total_amount)}</td>
                    <td className="py-4 px-4 text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                        {v.current_step}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button variant="primary" size="sm">
                        Review <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
