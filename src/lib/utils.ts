import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency amounts into Indian Rupees (INR)
 * e.g., 25000 -> ₹25,000.00
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a date string into a user-friendly format (e.g. 24 Oct 2026)
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Formats date and time (e.g. 24 Oct 2026, 04:30 PM)
 */
export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Maps voucher status to human-readable text and styling
 */
export function getStatusConfig(status: string) {
  switch (status) {
    case 'draft':
      return {
        label: 'Draft',
        variant: 'slate',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        badge: 'Draft',
      };
    case 'pending_manager':
      return {
        label: 'Pending Manager',
        variant: 'amber',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        badge: 'Manager Review',
      };
    case 'pending_dept_head':
      return {
        label: 'Pending Dept Head',
        variant: 'amber',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        badge: 'Dept Head Review',
      };
    case 'pending_finance':
      return {
        label: 'Pending Finance',
        variant: 'purple',
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        badge: 'Finance Review',
      };
    case 'pending_accounts':
    case 'approved':
      return {
        label: 'Approved (Pending Payout)',
        variant: 'blue',
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        badge: 'Ready for Accounts',
      };
    case 'paid':
      return {
        label: 'Paid',
        variant: 'emerald',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badge: 'Reimbursed',
      };
    case 'returned':
      return {
        label: 'Returned for Correction',
        variant: 'orange',
        bg: 'bg-orange-50 text-orange-700 border-orange-200',
        badge: 'Needs Revision',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        variant: 'rose',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        badge: 'Rejected',
      };
    default:
      return {
        label: status,
        variant: 'slate',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        badge: status,
      };
  }
}
