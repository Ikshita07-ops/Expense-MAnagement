import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Voucher } from '@/types';
import { api } from '@/services/api';
import { formatINR, formatDate, getStatusConfig } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  CheckSquare,
  Clock,
  XCircle,
  TrendingUp,
  Receipt,
  User,
  ArrowRight,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const all = await api.getVouchers();
        setVouchers(all);
      } catch (err) {
        console.error('Failed to load manager vouchers:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Filter vouchers assigned to manager or team
  const pendingApprovals = vouchers.filter(
    (v) =>
      v.status === 'pending_manager' ||
      v.status === 'pending_dept_head' ||
      v.status === 'pending_finance'
  );

  const approvedThisMonth = vouchers.filter(
    (v) => v.status === 'approved' || v.status === 'pending_accounts' || v.status === 'paid'
  ).length;

  const rejectedThisMonth = vouchers.filter((v) => v.status === 'rejected').length;

  const totalTeamExpenses = vouchers.reduce((sum, v) => sum + Number(v.total_amount), 0);

  // Spending data for BarChart
  const spendingData = [
    { category: 'Travel', amount: 35000 },
    { category: 'Accom.', amount: 24000 },
    { category: 'Meals', amount: 12000 },
    { category: 'Supplies', amount: 9500 },
    { category: 'Internet', amount: 4500 },
    { category: 'Client', amount: 18400 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manager Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review team reimbursement claims, audit proofs, and manage approval queues
          </p>
        </div>
        <Button
          variant="outline"
          size="md"
          onClick={() => navigate('/manager/approvals')}
          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
          <CheckSquare className="w-4 h-4 mr-1.5" /> Pending Queue ({pendingApprovals.length})
        </Button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending Approvals
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
                {pendingApprovals.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-amber-600 font-medium">Claims requiring your review</p>
        </Card>

        <Card className="hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Approved This Month
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                {approvedThisMonth}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-emerald-600 font-medium">Forwarded to Accounts</p>
        </Card>

        <Card className="hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Rejected This Month
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">
                {rejectedThisMonth}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-rose-600 font-medium">Returned or policy violations</p>
        </Card>

        <Card className="hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Team Expenses
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-indigo-700 mt-1">
                {formatINR(totalTeamExpenses)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500 font-medium">Cumulative across all claims</p>
        </Card>
      </div>

      {/* Pending Approval Queue Table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600" /> Pending Approval Queue
            </CardTitle>
            <CardDescription>Claims awaiting manager authorization</CardDescription>
          </div>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            {pendingApprovals.length} Pending
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Voucher Number</th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Voucher Title</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Submitted Date</th>
                <th className="py-3.5 px-4">Current Status</th>
                <th className="py-3.5 px-6 text-right">View Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingApprovals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">All caught up!</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      No vouchers currently awaiting your approval.
                    </p>
                  </td>
                </tr>
              ) : (
                pendingApprovals.map((v) => {
                  const statusConf = getStatusConfig(v.status);
                  return (
                    <tr
                      key={v.id}
                      onClick={() => navigate(`/vouchers/${v.id}`)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6 font-mono font-semibold text-indigo-700 whitespace-nowrap">
                        {v.voucher_number}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap font-medium text-slate-900">
                        {v.employee_name}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-600">
                        {v.department_name}
                      </td>
                      <td className="py-4 px-4 max-w-xs truncate font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {v.title}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900">
                        {formatINR(v.total_amount)}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                        {formatDate(v.submitted_at || v.created_at)}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConf.bg}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <Button
                          variant="subtle"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/vouchers/${v.id}`);
                          }}
                        >
                          Review <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Team Spending Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" /> Team Spending by Category
          </CardTitle>
          <CardDescription>Aggregate expenditures broken down by expense category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), 'Spending']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
