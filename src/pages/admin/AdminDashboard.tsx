import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Voucher } from '@/types';
import { api } from '@/services/api';
import { formatINR, formatDate, getStatusConfig } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Users,
  Receipt,
  Clock,
  TrendingUp,
  Wallet,
  XCircle,
  ShieldCheck,
  Building,
  Briefcase,
  Sliders,
  Tags,
  ArrowRight,
  Eye,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, v] = await Promise.all([api.getProfiles(), api.getVouchers()]);
        setProfiles(p);
        setVouchers(v);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Compute live KPI figures from database
  const totalEmployees = profiles.length;
  const totalVouchers = vouchers.length;
  const pendingApprovals = vouchers.filter((v) =>
    v.status.startsWith('pending') || v.status === 'returned'
  ).length;
  const totalExpenses = vouchers.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
  const paidVouchers = vouchers.filter((v) => v.status === 'paid');
  const totalPaid = paidVouchers.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
  const rejectedCount = vouchers.filter((v) => v.status === 'rejected').length;

  // Department-wise spending chart data
  const deptSpendingMap: Record<string, number> = {};
  vouchers.forEach((v) => {
    const dept = v.department_name || 'Engineering';
    deptSpendingMap[dept] = (deptSpendingMap[dept] || 0) + Number(v.total_amount);
  });
  const deptData = Object.entries(deptSpendingMap).map(([name, amount]) => ({
    name,
    amount,
  }));

  // Category breakdown for Donut Chart
  const categoryMap: Record<string, number> = {};
  vouchers.forEach((v) => {
    v.items?.forEach((it) => {
      categoryMap[it.category_name] = (categoryMap[it.category_name] || 0) + Number(it.amount);
    });
  });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrator Console
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            System overview, organizational hierarchy, monetary approval rules, and audit compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/admin/audit-logs')}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <ShieldCheck className="w-4 h-4 mr-1.5" /> Audit Logs
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/admin/employees')}
            className="shadow-sm shadow-indigo-500/20"
          >
            <Users className="w-4 h-4 mr-1.5" /> Manage Employees
          </Button>
        </div>
      </div>

      {/* 6 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="p-4 hover:-translate-y-1 transition-all">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Staff</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalEmployees}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Active profiles</p>
        </Card>

        <Card className="p-4 hover:-translate-y-1 transition-all">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Claims</p>
          <h3 className="text-2xl font-extrabold text-indigo-700 mt-1">{totalVouchers}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Submitted vouchers</p>
        </Card>

        <Card className="p-4 hover:-translate-y-1 transition-all">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In-Review</p>
          <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{pendingApprovals}</h3>
          <p className="text-[11px] text-amber-600 mt-1">Pending approval</p>
        </Card>

        <Card className="p-4 hover:-translate-y-1 transition-all">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Expenses</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{formatINR(totalExpenses)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Cumulative claims</p>
        </Card>

        <Card className="p-4 hover:-translate-y-1 transition-all">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Disbursed</p>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{formatINR(totalPaid)}</h3>
          <p className="text-[11px] text-emerald-600 mt-1">{paidVouchers.length} claims paid</p>
        </Card>

        <Card className="p-4 hover:-translate-y-1 transition-all">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Rejected</p>
          <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{rejectedCount}</h3>
          <p className="text-[11px] text-rose-600 mt-1">Policy violations</p>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Spending Chart */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" /> Department-wise Spending (INR)
              </CardTitle>
              <CardDescription>Cumulative approved and pending expenditures per business unit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val / 1000}k`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatINR(Number(val)), 'Spent']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <Bar dataKey="amount" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expense Category Breakdown Donut */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tags className="w-4 h-4 text-indigo-600" /> Category Breakdown
              </CardTitle>
              <CardDescription>Share of claims across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [formatINR(Number(val)), 'Amount']} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs text-slate-700">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Navigation to Admin Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/admin/employees')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
            Employee Directory
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Manage employee roles, assigned managers, and activation status
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/approval-limits')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Sliders className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
            Approval Limits & Rules
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Configure dynamic multi-tier monetary thresholds (₹0 - ₹10k, ₹50k+)
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/hierarchy')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Building className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
            Employee Hierarchy
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Visual reporting tree and manager assignment controls
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/audit-logs')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
            Security & Audit Logs
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Full compliance record of system actions, actors, and IP logs
          </p>
        </div>
      </div>
    </div>
  );
};
