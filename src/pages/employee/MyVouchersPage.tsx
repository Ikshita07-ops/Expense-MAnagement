import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Voucher, VoucherStatus } from '@/types';
import { api } from '@/services/api';
import { formatINR, formatDate, getStatusConfig } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  Edit3,
  Calendar,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Receipt,
  FileQuestion,
} from 'lucide-react';

export const MyVouchersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('search') || '';

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const all = await api.getVouchers();
        // Employee views their own claims
        const mine = all.filter((v) => v.employee_id === user.id);
        setVouchers(mine);
      } catch (err) {
        console.error('Failed to load vouchers:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user]);

  // Filtering and sorting
  const filteredVouchers = useMemo(() => {
    return vouchers
      .filter((v) => {
        // Search query
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = v.title.toLowerCase().includes(q);
          const matchesNum = v.voucher_number.toLowerCase().includes(q);
          const matchesPurpose = v.business_purpose.toLowerCase().includes(q);
          const matchesItem = v.items?.some((i) =>
            i.description.toLowerCase().includes(q) || i.merchant_name?.toLowerCase().includes(q)
          );
          if (!matchesTitle && !matchesNum && !matchesPurpose && !matchesItem) return false;
        }

        // Status filter
        if (statusFilter !== 'all') {
          if (statusFilter === 'pending') {
            if (!v.status.startsWith('pending') && v.status !== 'returned') return false;
          } else if (v.status !== statusFilter) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'date_asc') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === 'amount_desc') {
          return b.total_amount - a.total_amount;
        }
        if (sortBy === 'amount_asc') {
          return a.total_amount - b.total_amount;
        }
        return 0;
      });
  }, [vouchers, searchQuery, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredVouchers.length / pageSize) || 1;
  const paginatedVouchers = filteredVouchers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Vouchers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track, filter, and manage your submitted reimbursement claims
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

      {/* Filter and Search Bar */}
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
          {/* Search Query */}
          <div className="lg:col-span-5">
            <Input
              placeholder="Search by voucher #, title, merchant..."
              icon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-4">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending">All In-Review (Pending)</option>
              <option value="pending_manager">Pending Manager</option>
              <option value="pending_dept_head">Pending Dept Head</option>
              <option value="pending_finance">Pending Finance</option>
              <option value="pending_accounts">Pending Accounts</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid (Reimbursed)</option>
              <option value="returned">Returned for Correction</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-3">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Vouchers Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Voucher Number</th>
                <th className="py-3.5 px-4">Title & Details</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Current Stage</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileQuestion className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No matching vouchers found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try clearing search filters or create a new voucher.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedVouchers.map((v) => {
                  const statusConf = getStatusConfig(v.status);
                  const isEditable = ['draft', 'returned', 'rejected'].includes(v.status);

                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/vouchers/${v.id}`)}
                    >
                      <td className="py-4 px-4 sm:px-6 font-mono font-semibold text-indigo-700 whitespace-nowrap">
                        {v.voucher_number}
                      </td>
                      <td className="py-4 px-4 max-w-xs sm:max-w-sm">
                        <p className="font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {v.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {v.business_purpose}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(v.submitted_at || v.created_at)}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(v.total_amount)}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600 whitespace-nowrap">
                        <span className="font-medium">{v.current_step}</span>
                        {v.current_approver_name && (
                          <span className="block text-[11px] text-slate-400">
                            ({v.current_approver_name})
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConf.bg}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>
                      <td
                        className="py-4 px-4 text-right pr-6 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/vouchers/${v.id}`)}
                            title="View Voucher"
                          >
                            <Eye className="w-4 h-4 text-slate-500" />
                          </Button>

                          {isEditable && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/vouchers/new?edit=${v.id}`)}
                              title="Edit Voucher"
                              className="text-xs gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing <span className="font-medium">{filteredVouchers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(currentPage * pageSize, filteredVouchers.length)}
            </span>{' '}
            of <span className="font-medium">{filteredVouchers.length}</span> vouchers
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium text-slate-600 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
