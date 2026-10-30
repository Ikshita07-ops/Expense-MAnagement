import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import {
  Sparkles,
  CheckCircle2,
  Activity,
  FileSpreadsheet,
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Shield,
  Briefcase,
  Wallet,
  UserCheck,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const demoAccounts = [
    {
      role: 'admin' as Role,
      title: 'Administrator',
      email: 'admin@smartexpense.io',
      icon: Shield,
      desc: 'Hierarchy, approval rules, categories, audit logs',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    {
      role: 'manager' as Role,
      title: 'Manager',
      email: 'manager@smartexpense.io',
      icon: Briefcase,
      desc: 'Approve, return, or reject team vouchers',
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    },
    {
      role: 'accounts' as Role,
      title: 'Accounts Officer',
      email: 'accounts@smartexpense.io',
      icon: Wallet,
      desc: 'Verify approvals, process NEFT/UPI disbursements',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    {
      role: 'employee' as Role,
      title: 'Employee',
      email: 'employee@smartexpense.io',
      icon: UserCheck,
      desc: 'Create vouchers, attach receipts, track status',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  ];

  const handleQuickDemoFill = (accEmail: string) => {
    setEmail(accEmail);
    setPassword('Demo@12345');
    setErrorMessage(null);
  };

  const handleQuickDemoLogin = async (accRole: Role) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await loginAsDemo(accRole);
      if (accRole === 'employee') navigate('/dashboard');
      else if (accRole === 'manager') navigate('/manager/dashboard');
      else if (accRole === 'accounts') navigate('/accounts/dashboard');
      else if (accRole === 'admin') navigate('/admin/dashboard');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      // Find user role from email or target route
      if (email.includes('admin')) navigate('/admin/dashboard');
      else if (email.includes('manager')) navigate('/manager/dashboard');
      else if (email.includes('accounts')) navigate('/accounts/dashboard');
      else navigate('/dashboard');
    } else {
      setErrorMessage(res.error || 'Invalid credentials. Try using one of the demo accounts below.');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 text-slate-800">
      {/* ======================================================== */}
      {/* LEFT PANEL: Enterprise Branding, Value Proposition & Features */}
      {/* ======================================================== */}
      <div className="lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white min-h-[420px] lg:min-h-screen">
        {/* Decorative background glow circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo & Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-indigo-300 shadow-inner">
            <Sparkles className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Smart Expense
            </h2>
            <p className="text-xs text-indigo-200/80 font-medium tracking-wide uppercase">
              Enterprise Expense Management
            </p>
          </div>
        </div>

        {/* Main Content & Feature Highlights */}
        <div className="relative z-10 my-8 lg:my-auto max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Next-Gen Financial SaaS
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Manage expenses with confidence.
          </h1>

          <p className="mt-4 text-base sm:text-lg text-indigo-100/90 leading-relaxed font-normal">
            Streamline employee expense claims, configure dynamic multi-level approval thresholds, and disburse reimbursements with end-to-end financial audit compliance.
          </p>

          {/* 4 Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 sm:mt-10">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Multi-level Approvals</h4>
                <p className="text-xs text-indigo-200/70">Dynamic threshold rules</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Real-time Tracking</h4>
                <p className="text-xs text-indigo-200/70">Live workflow timeline</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">PDF & Excel Reports</h4>
                <p className="text-xs text-indigo-200/70">1-click MIS exports</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Role-based Access</h4>
                <p className="text-xs text-indigo-200/70">Supabase RLS security</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-6 border-t border-white/10 text-xs text-indigo-200/60 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} Smart Expense Inc.</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Vercel & Supabase Ready
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT PANEL: Login Form & Demo Accounts */}
      {/* ======================================================== */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <div className="max-w-md w-full my-auto space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-indigo-500/5">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
              <p className="text-sm text-slate-500 mt-1">Sign in to your account to continue</p>
            </div>

            {errorMessage && (
              <div className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <Input
                  type="email"
                  required
                  placeholder="name@company.com"
                  icon={<Mail className="w-4 h-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotOpen(true);
                      setForgotSuccess(false);
                      setForgotEmail(email);
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    icon={<Lock className="w-4 h-4" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-2"
              >
                Sign In to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </div>

          {/* DEMO ACCOUNTS SECTION */}
          <div className="bg-slate-100/80 rounded-3xl p-5 sm:p-6 border border-slate-200/90">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Explore Demo Roles
              </h3>
              <span className="text-[11px] font-medium text-slate-400">1-Click Instant Sign-In</span>
            </div>

            <p className="text-xs text-slate-500 mb-3.5">
              Select any role to test authorization, approval workflows, and role-tailored dashboards:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                return (
                  <div
                    key={acc.role}
                    className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 transition-all hover:shadow-md group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-indigo-500" />
                          {acc.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                        {acc.desc}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleQuickDemoLogin(acc.role)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-[11px] font-semibold transition-all text-center"
                      >
                        Sign in as {acc.role}
                      </button>
                      <button
                        type="button"
                        title="Fill fields"
                        onClick={() => handleQuickDemoFill(acc.email)}
                        className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium transition-colors"
                      >
                        Fill
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        title="Reset your password"
        description="We will send you a secure password reset link to your official email."
      >
        {forgotSuccess ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            <p className="font-semibold">Password reset link sent!</p>
            <p className="text-xs text-emerald-700 mt-1">
              Please check your inbox for <b>{forgotEmail}</b> and follow the instructions to set a new password.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setIsForgotOpen(false)}
            >
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Email Address
              </label>
              <Input
                type="email"
                required
                placeholder="name@company.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsForgotOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Send Reset Link
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
};
