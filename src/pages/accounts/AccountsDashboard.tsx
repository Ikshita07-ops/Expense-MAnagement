import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Voucher, PaymentRecord } from '@/types';
import { api } from '@/services/api';
import { formatINR, formatDate, getStatusConfig } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Wallet,
  Clock,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Eye,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const AccountsDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  // Record Payment Modal State
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['payment_method']>('NEFT');
  const [txnRef, setTxnRef] = useState(`TXN-${Math.floor(10000000 + Math.random() * 90000000)}`);
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    try {
      const all = await api.getVouchers();
      setVouchers(all);
    } catch (err) {
      console.error('Failed to load accounts data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter vouchers
  const awaitingVerification = vouchers.filter((v) => v.status === 'pending_accounts');
  const paidVouchers = vouchers.filter((v) => v.status === 'paid');

  const paidThisMonthCount = paidVouchers.length;
  const totalReimbursements = paidVouchers.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
  const pendingPayoutAmount = awaitingVerification.reduce((acc, curr) => acc + Number(curr.total_amount), 0);

  const handleOpenPaymentModal = (v: Voucher) => {
    setSelectedVoucher(v);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setTxnRef(`TXN-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setRemarks('');
  };

  const handleRecordPayment = async () => {
    if (!selectedVoucher || !user) return;
    if (!txnRef.trim()) {
      showToast('Validation', 'Transaction reference number is required.', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      await api.recordPayment(
        selectedVoucher.id,
        {
          payment_date: paymentDate,
          payment_method: paymentMethod,
          transaction_reference: txnRef,
          amount_paid: selectedVoucher.total_amount,
          remarks,
        },
        user
      );

      showToast(
        'Disbursement Recorded',
        `Marked ${selectedVoucher.voucher_number} as paid (${formatINR(selectedVoucher.total_amount)}).`,
        'success'
      );
      setSelectedVoucher(null);
      await loadData();
    } catch (err: any) {
      showToast('Error', err?.message || 'Payment recording failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

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
            Accounts & Finance Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit approved vouchers, verify GST compliance, and record external disbursements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/reports')}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Export Reports
          </Button>
        </div>
      </div>

      {/* 4 Accounts KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Awaiting Verification
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
                {awaitingVerification.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-amber-600 font-medium">Approved by managers</p>
        </Card>

        <Card className="hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Ready for Payment
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-indigo-700 mt-1">
                {formatINR(pendingPayoutAmount)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500 font-medium">Pending release to bank</p>
        </Card>

        <Card className="hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Paid This Month
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                {paidThisMonthCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-emerald-600 font-medium">Claims disbursed</p>
        </Card>

        <Card className="hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Reimbursements
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                {formatINR(totalReimbursements)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-emerald-600 font-medium">Processed via NEFT / UPI</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Ready for Payment ({awaitingVerification.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Completed Payments ({paidVouchers.length})</span>
        </button>
      </div>

      {/* Table: Ready for Payment */}
      {activeTab === 'pending' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Voucher #</th>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Approval Date</th>
                  <th className="py-3.5 px-6 text-right">Disburse Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {awaitingVerification.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No vouchers awaiting payout</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Approved claims ready for payment processing will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  awaitingVerification.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => navigate(`/vouchers/${v.id}`)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6 font-mono font-semibold text-indigo-700 whitespace-nowrap">
                        {v.voucher_number}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {v.employee_name}
                      </td>
                      <td className="py-4 px-4 max-w-xs truncate font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {v.title}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {v.department_name}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(v.total_amount)}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(v.approved_at || v.updated_at)}
                      </td>
                      <td
                        className="py-4 px-6 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-xs shadow-sm shadow-emerald-500/20"
                          onClick={() => handleOpenPaymentModal(v)}
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" /> Record Payment
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Table: Completed Payments */}
      {activeTab === 'completed' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Voucher #</th>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Amount Paid</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Transaction Ref</th>
                  <th className="py-3.5 px-4">Payment Date</th>
                  <th className="py-3.5 px-6 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paidVouchers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No disbursed payments on record.
                    </td>
                  </tr>
                ) : (
                  paidVouchers.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => navigate(`/vouchers/${v.id}`)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6 font-mono font-semibold text-indigo-700 whitespace-nowrap">
                        {v.voucher_number}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {v.employee_name}
                      </td>
                      <td className="py-4 px-4 font-bold text-emerald-700 whitespace-nowrap">
                        {formatINR(v.total_amount)}
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                        {v.payment?.payment_method || 'NEFT'}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {v.payment?.transaction_reference || '—'}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(v.payment?.payment_date || v.paid_at)}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 text-slate-400" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Record Payment Dialog */}
      <Dialog
        isOpen={Boolean(selectedVoucher)}
        onClose={() => setSelectedVoucher(null)}
        title={`Record Payment for ${selectedVoucher?.voucher_number}`}
        description="Verify bank disbursement details. This records the reimbursement after external bank payment."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Disbursement Date
              </label>
              <Input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Channel
              </label>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <option value="NEFT">NEFT (Direct Bank Transfer)</option>
                <option value="RTGS">RTGS</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Corporate Card">Corporate Card</option>
                <option value="Cheque">Cheque</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction Reference / UTR Number <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="e.g. NEFT-HDFC-99201948"
              value={txnRef}
              onChange={(e) => setTxnRef(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount to Disburse (INR)
            </label>
            <Input
              disabled
              value={formatINR(selectedVoucher?.total_amount || 0)}
              className="bg-slate-100 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks (Optional)
            </label>
            <Input
              placeholder="e.g. Cleared via primary payroll reimbursement account"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setSelectedVoucher(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700"
              isLoading={isProcessing}
              onClick={handleRecordPayment}
            >
              Confirm Disbursement
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
