import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Voucher, PaymentRecord } from '@/types';
import { api } from '@/services/api';
import { formatINR, formatDate, formatDateTime, getStatusConfig } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  CreditCard,
  Eye,
  FileCheck,
  Calendar,
  Building,
  User,
  Clock,
  Paperclip,
  Edit3,
  Receipt,
  FileText,
} from 'lucide-react';

export const VoucherDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Manager action modals
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [approveComments, setApproveComments] = useState('');
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Accounts payment modal
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['payment_method']>('NEFT');
  const [txnRef, setTxnRef] = useState(`TXN-${Math.floor(10000000 + Math.random() * 90000000)}`);
  const [paymentRemarks, setPaymentRemarks] = useState('');

  // Receipt preview modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);

  const loadVoucher = async () => {
    if (!id) return;
    try {
      const v = await api.getVoucherById(id);
      setVoucher(v);
    } catch (err) {
      console.error('Failed to load voucher:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVoucher();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="p-12 text-center">
        <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Voucher Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested voucher could not be found.</p>
        <Button variant="primary" size="sm" className="mt-4" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const statusConf = getStatusConfig(voucher.status);
  const isEditable = ['draft', 'returned', 'rejected'].includes(voucher.status) && user?.id === voucher.employee_id;

  // Authorization checks
  const canManagerApprove =
    (user?.role === 'manager' || user?.role === 'admin') &&
    (voucher.status === 'pending_manager' ||
      voucher.status === 'pending_dept_head' ||
      voucher.status === 'pending_finance');

  const canAccountsDisburse =
    (user?.role === 'accounts' || user?.role === 'admin') &&
    voucher.status === 'pending_accounts';

  // Handle Approve
  const handleApprove = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.approveVoucher(voucher.id, approveComments, user);
      showToast('Voucher Approved', `Voucher ${voucher.voucher_number} approved successfully.`, 'success');
      setIsApproveOpen(false);
      setApproveComments('');
      await loadVoucher();
    } catch (err: any) {
      showToast('Error', err?.message || 'Approval failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Return
  const handleReturn = async () => {
    if (!user) return;
    if (!returnReason.trim()) {
      showToast('Required', 'Please enter a return reason for the employee.', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      await api.returnVoucher(voucher.id, returnReason, user);
      showToast('Voucher Returned', `Returned ${voucher.voucher_number} to employee for correction.`, 'info');
      setIsReturnOpen(false);
      setReturnReason('');
      await loadVoucher();
    } catch (err: any) {
      showToast('Error', err?.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!user) return;
    if (!rejectReason.trim()) {
      showToast('Required', 'Please enter a rejection reason.', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      await api.rejectVoucher(voucher.id, rejectReason, user);
      showToast('Voucher Rejected', `Voucher ${voucher.voucher_number} rejected.`, 'error');
      setIsRejectOpen(false);
      setRejectReason('');
      await loadVoucher();
    } catch (err: any) {
      showToast('Error', err?.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Record Payment (Accounts)
  const handlePayment = async () => {
    if (!user) return;
    if (!txnRef.trim()) {
      showToast('Required', 'Please enter a transaction reference number.', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      await api.recordPayment(
        voucher.id,
        {
          payment_date: paymentDate,
          payment_method: paymentMethod,
          transaction_reference: txnRef,
          amount_paid: voucher.total_amount,
          remarks: paymentRemarks,
        },
        user
      );
      showToast(
        'Payment Recorded',
        `Disbursement of ${formatINR(voucher.total_amount)} recorded via ${paymentMethod}.`,
        'success'
      );
      setIsPaymentOpen(false);
      await loadVoucher();
    } catch (err: any) {
      showToast('Error', err?.message || 'Payment processing failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {voucher.title}
            </h1>
            <span className="font-mono text-sm px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
              {voucher.voucher_number}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${statusConf.bg}`}>
              {statusConf.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Submitted on {formatDateTime(voucher.submitted_at || voucher.created_at)}
          </p>
        </div>

        {/* Action Buttons bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Employee Edit */}
          {isEditable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/vouchers/new?edit=${voucher.id}`)}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <Edit3 className="w-4 h-4 mr-1.5" /> Edit Voucher
            </Button>
          )}

          {/* Manager Action Buttons (Approve / Return / Reject) */}
          {canManagerApprove && (
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsRejectOpen(true)}
              >
                <XCircle className="w-4 h-4 mr-1.5" /> Reject
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={() => setIsReturnOpen(true)}
              >
                <RotateCcw className="w-4 h-4 mr-1.5" /> Return
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={() => setIsApproveOpen(true)}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
              </Button>
            </div>
          )}

          {/* Accounts Officer Action (Record Payment) */}
          {canAccountsDisburse && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPaymentOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
            >
              <CreditCard className="w-4 h-4 mr-1.5" /> Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Amount</p>
          <h3 className="text-2xl font-extrabold text-indigo-700 mt-1">
            {formatINR(voucher.total_amount)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Claimed in Indian Rupees (INR)</p>
        </Card>

        <Card className="p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Step</p>
          <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" /> {voucher.current_step}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {voucher.current_approver_name ? `Assigned to: ${voucher.current_approver_name}` : 'Workflow completed'}
          </p>
        </Card>

        <Card className="p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Submitted By</p>
          <div className="flex items-center gap-3 mt-1.5">
            <img
              src={voucher.employee_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={voucher.employee_name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{voucher.employee_name}</p>
              <p className="text-xs text-slate-500 truncate">{voucher.department_name}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Purpose & Description */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" /> Business Purpose & Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Purpose:</span>
            <p className="text-slate-800 font-medium mt-0.5">{voucher.business_purpose}</p>
          </div>
          {voucher.description && (
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes:</span>
              <p className="text-slate-600 mt-0.5">{voucher.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Itemized Expense Breakdown Table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Itemized Expense Breakdown</h3>
          <span className="text-xs font-medium text-slate-500">
            {voucher.items?.length || 0} {voucher.items?.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Merchant</th>
                <th className="py-3 px-4">Expense Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-6 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {voucher.items?.map((it, idx) => (
                <tr key={it.id || idx} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-6 font-semibold text-slate-800">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium">
                      {it.category_name}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">{it.description}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{it.merchant_name || '—'}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">{formatDate(it.expense_date)}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {formatINR(Number(it.amount))}
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    {it.receipt_url || it.receipt_name ? (
                      <button
                        onClick={() => {
                          setPreviewUrl(it.receipt_url || 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600');
                          setPreviewTitle(it.receipt_name || 'Receipt Document');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        <FileCheck className="w-3.5 h-3.5" /> View
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-indigo-50/50 border-t border-indigo-100 font-bold text-slate-900">
              <tr>
                <td colSpan={4} className="py-3.5 px-6 text-sm">
                  Total Reimbursable Claim:
                </td>
                <td className="py-3.5 px-4 text-right text-base text-indigo-700">
                  {formatINR(voucher.total_amount)}
                </td>
                <td className="py-3.5 px-6" />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Payment Details if Reimbursed */}
      {voucher.payment && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-800 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Disbursement Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 uppercase tracking-wider font-semibold">Payment Date:</span>
              <p className="font-semibold text-slate-900 mt-0.5">{formatDate(voucher.payment.payment_date)}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase tracking-wider font-semibold">Method:</span>
              <p className="font-semibold text-slate-900 mt-0.5">{voucher.payment.payment_method}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase tracking-wider font-semibold">Transaction Ref:</span>
              <p className="font-mono font-semibold text-slate-900 mt-0.5">{voucher.payment.transaction_reference}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase tracking-wider font-semibold">Amount Paid:</span>
              <p className="font-bold text-emerald-700 text-sm mt-0.5">{formatINR(voucher.payment.amount_paid)}</p>
            </div>
            {voucher.payment.remarks && (
              <div className="sm:col-span-4 pt-1 border-t border-emerald-100">
                <span className="text-slate-400 font-semibold">Remarks:</span> {voucher.payment.remarks}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Workflow History & Approval Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" /> Workflow & Approval Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {voucher.history && voucher.history.length > 0 ? (
              voucher.history.map((h, i) => (
                <div key={h.id || i} className="relative group">
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <p className="text-xs font-bold text-slate-900">
                      {h.actor_name}{' '}
                      <span className="font-normal text-slate-500 capitalize">({h.actor_role})</span>
                    </p>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDateTime(h.created_at)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-indigo-700 capitalize mt-0.5">
                    {h.action.replace('_', ' ')}
                  </p>
                  {h.comments && (
                    <p className="text-xs text-slate-600 mt-1 p-2 rounded-lg bg-slate-50 border border-slate-100 italic">
                      "{h.comments}"
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No workflow history recorded yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* MODALS: Manager Decisions & Payment */}
      {/* ======================================================== */}

      {/* Approve Modal */}
      <Dialog
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title={`Approve ${voucher.voucher_number}`}
        description="Confirm your approval decision. The voucher will proceed to the next required approver or release to Accounts."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Approval Comments (Optional)
            </label>
            <Textarea
              rows={3}
              placeholder="e.g. Approved. Verified all conference travel receipts."
              value={approveComments}
              onChange={(e) => setApproveComments(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              isLoading={actionLoading}
              onClick={handleApprove}
            >
              Confirm Approval
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Return Modal */}
      <Dialog
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        title={`Return ${voucher.voucher_number} for Correction`}
        description="A clear reason is strictly required so the employee can fix the issues and resubmit."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Return <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={4}
              required
              placeholder="e.g. Please attach the itemized restaurant tax invoice showing GST number..."
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsReturnOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-amber-600 hover:bg-amber-700"
              isLoading={actionLoading}
              onClick={handleReturn}
            >
              Return to Employee
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Reject Modal */}
      <Dialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title={`Reject ${voucher.voucher_number}`}
        description="Mark this claim as rejected. The employee will be notified with your stated reason."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={4}
              required
              placeholder="e.g. Ineligible expenditure under company travel policy..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              isLoading={actionLoading}
              onClick={handleReject}
            >
              Reject Voucher
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Record Payment Modal (Accounts) */}
      <Dialog
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title={`Record Reimbursement Payment (${voucher.voucher_number})`}
        description="Record payment details after disbursing funds externally to the employee."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Date
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
                Payment Method
              </label>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <option value="NEFT">NEFT (Direct Bank Transfer)</option>
                <option value="RTGS">RTGS</option>
                <option value="UPI">UPI Transfer</option>
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
              placeholder="e.g. NEFT-HDFC-88291039"
              value={txnRef}
              onChange={(e) => setTxnRef(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount Paid (₹ INR)
            </label>
            <Input
              disabled
              value={formatINR(voucher.total_amount)}
              className="bg-slate-100 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks (Optional)
            </label>
            <Input
              placeholder="e.g. October payroll reimbursement batch"
              value={paymentRemarks}
              onChange={(e) => setPaymentRemarks(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsPaymentOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700"
              isLoading={actionLoading}
              onClick={handlePayment}
            >
              Mark as Paid
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Receipt Preview Dialog */}
      <Dialog
        isOpen={Boolean(previewUrl)}
        onClose={() => setPreviewUrl(null)}
        title={previewTitle || 'Receipt Viewer'}
        maxWidth="lg"
      >
        <div className="flex flex-col items-center justify-center p-2">
          {previewUrl?.endsWith('.pdf') || previewTitle?.endsWith('.pdf') ? (
            <div className="w-full h-80 flex flex-col items-center justify-center bg-slate-100 rounded-xl p-4">
              <Paperclip className="w-12 h-12 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">{previewTitle}</p>
              <a
                href={previewUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                Open in new tab
              </a>
            </div>
          ) : (
            <img
              src={previewUrl || ''}
              alt="Receipt Preview"
              className="max-h-[500px] w-auto object-contain rounded-xl border border-slate-200 shadow-sm"
            />
          )}
        </div>
      </Dialog>
    </div>
  );
};
