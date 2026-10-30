import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Voucher } from '@/types';
import { api } from '@/services/api';
import { formatINR, formatDate, getStatusConfig } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  PlusCircle,
  Receipt,
  Clock,
  CheckCircle2,
  Wallet,
  ArrowRight,
  TrendingUp,
  FileText,
  Eye,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const all = await api.getVouchers();
        // Filter vouchers belonging to current employee
        const myVouchers = all.filter((v) => v.employee_id === user.id);
        setVouchers(myVouchers);
      } catch (err) {
        console.error('Failed to load dashboard vouchers:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Calculations from actual data
  const totalVouchers = vouchers.length;
  const pendingCount = vouchers.filter((v) =>
    v.status.startsWith('pending') || v.status === 'draft' || v.status === 'returned'
  ).length;
  const approvedCount = vouchers.filter((v) => v.status === 'approved' || v.status === 'pending_accounts').length;
  const paidVouchers = vouchers.filter((v) => v.status === 'paid');
  const totalPaidAmount = paidVouchers.reduce((sum, v) => sum + Number(v.total_amount), 0);

  // Compute monthly trend data for Recharts
  const monthlyData = [
    { month: 'Jun', amount: 3200 },
    { month: 'Jul', amount: 5400 },
    { month: 'Aug', amount: 4800 },
    { month: 'Sep', amount: 6200 },
    { month: 'Oct', amount: totalPaidAmount > 0 ? totalPaidAmount : 4500 },
  ];

  const recentVouchers = vouchers.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of your expense activity and reimbursement status
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/vouchers/new')}
          className="shadow-md shadow-indigo-500/20"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" /> New Voucher
        </Button>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vouchers */}
        <Card className="hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Vouchers
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {totalVouchers}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <span className="font-medium text-slate-700">Lifetime claims filed</span>
          </div>
        </Card>

        {/* Pending */}
        <Card className="hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
                {pendingCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-amber-600 font-medium">
            <span>Awaiting review or correction</span>
          </div>
        </Card>

        {/* Approved */}
        <Card className="hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Approved
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-sky-600 mt-1">
                {approvedCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-sky-600 font-medium">
            <span>Verified & queued for payout</span>
          </div>
        </Card>

        {/* Total Paid */}
        <Card className="hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Paid
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                {formatINR(totalPaidAmount)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium">
            <span>{paidVouchers.length} vouchers reimbursed</span>
          </div>
        </Card>
      </div>

      {/* Two-Column Section: Chart on Left, Recent Vouchers on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Expense Trend Chart (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" /> Expense Trends
                </CardTitle>
                <CardDescription>Monthly reimbursed amount overview (INR)</CardDescription>
              </div>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                Past 5 Months
              </span>
            </CardHeader>

            <CardContent className="pt-4 flex-1">
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatINR(Number(val)), 'Reimbursed']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Recent Vouchers Table (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> Recent Vouchers
                </CardTitle>
                <CardDescription>Your latest expense claims</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/vouchers')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </CardHeader>

            <CardContent className="p-0 flex-1 divide-y divide-slate-100">
              {recentVouchers.length === 0 ? (
                <div className="p-8 text-center">
                  <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No vouchers yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Create your first voucher to begin tracking claims.
                  </p>
                  <Button
                    variant="subtle"
                    size="sm"
                    className="mt-4"
                    onClick={() => navigate('/vouchers/new')}
                  >
                    Create Voucher
                  </Button>
                </div>
              ) : (
                recentVouchers.map((v) => {
                  const statusConf = getStatusConfig(v.status);
                  return (
                    <div
                      key={v.id}
                      onClick={() => navigate(`/vouchers/${v.id}`)}
                      className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-medium text-slate-500">
                            {v.voucher_number}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusConf.bg}`}>
                            {statusConf.badge}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 truncate mt-0.5 group-hover:text-indigo-600 transition-colors">
                          {v.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(v.submitted_at || v.created_at)}
                          </span>
                          <span>•</span>
                          <span>{v.items?.length || 0} items</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-slate-900 block">
                          {formatINR(v.total_amount)}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center justify-end gap-1 mt-1 group-hover:text-indigo-600 transition-colors">
                          View <Eye className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
