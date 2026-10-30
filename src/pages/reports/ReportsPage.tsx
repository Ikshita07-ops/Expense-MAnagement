import React, { useState, useEffect, useMemo } from 'react';
import { Voucher, Department, UserProfile } from '@/types';
import { api } from '@/services/api';
import { formatINR, formatDate, getStatusConfig } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNotifications } from '@/contexts/NotificationContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  Building,
  Printer,
  FileCheck2,
  PieChart,
  Clock,
  CheckCircle,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [reportType, setReportType] = useState('mis');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [v, d, p] = await Promise.all([
          api.getVouchers(),
          api.getDepartments(),
          api.getProfiles(),
        ]);
        setVouchers(v);
        setDepartments(d);
        setProfiles(p);
      } catch (err) {
        console.error('Failed to load reports data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return vouchers.filter((v) => {
      if (departmentFilter !== 'all' && v.department_name !== departmentFilter) return false;
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;

      // Special report types
      if (reportType === 'pending' && !v.status.startsWith('pending') && v.status !== 'returned') {
        return false;
      }
      if (reportType === 'rejected' && v.status !== 'rejected') return false;
      if (reportType === 'paid' && v.status !== 'paid') return false;
      if (reportType === 'overdue') {
        // Exception report for overdue approvals (> 3 days old and still pending)
        const daysOld =
          (new Date().getTime() - new Date(v.submitted_at || v.created_at).getTime()) /
          (1000 * 3600 * 24);
        if (daysOld < 3 || v.status === 'paid' || v.status === 'draft') return false;
      }

      return true;
    });
  }, [vouchers, reportType, departmentFilter, statusFilter]);

  const totalAmount = filteredData.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
  const paidCount = filteredData.filter((v) => v.status === 'paid').length;
  const pendingCount = filteredData.filter((v) => v.status.startsWith('pending')).length;

  // Export to Excel (.xlsx) using SheetJS
  const exportToExcel = () => {
    try {
      const rows = filteredData.map((v) => ({
        'Voucher Number': v.voucher_number,
        'Employee Name': v.employee_name,
        Department: v.department_name,
        'Voucher Title': v.title,
        'Amount (INR)': v.total_amount,
        Status: getStatusConfig(v.status).label,
        'Current Stage': v.current_step,
        'Submission Date': formatDate(v.submitted_at || v.created_at),
        'Payment Method': v.payment?.payment_method || '—',
        'Transaction Ref': v.payment?.transaction_reference || '—',
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Expense Report');

      XLSX.writeFile(
        workbook,
        `SmartExpense_${reportType.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.xlsx`
      );
      showToast('Export Successful', 'Excel report downloaded successfully.', 'success');
    } catch (err: any) {
      showToast('Export Error', err?.message || 'Failed to export Excel.', 'error');
    }
  };

  // Export to PDF using jsPDF + autoTable
  const exportToPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });

      doc.setFontSize(18);
      doc.setTextColor(49, 46, 129); // indigo-900
      doc.text('Smart Expense — Financial Expense Report', 14, 18);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Generated: ${new Date().toLocaleDateString('en-IN')} | Report: ${reportType.toUpperCase()} | Total Value: ${formatINR(totalAmount)}`,
        14,
        25
      );

      const tableData = filteredData.map((v) => [
        v.voucher_number,
        v.employee_name || '—',
        v.department_name || '—',
        v.title,
        formatINR(v.total_amount),
        getStatusConfig(v.status).label,
        formatDate(v.submitted_at || v.created_at),
      ]);

      autoTable(doc, {
        head: [['Voucher #', 'Employee', 'Department', 'Title', 'Amount', 'Status', 'Date']],
        body: tableData,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9 },
      });

      doc.save(`SmartExpense_${reportType.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('Export Successful', 'PDF report generated and downloaded.', 'success');
    } catch (err: any) {
      showToast('Export Error', err?.message || 'Failed to export PDF.', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-28 rounded-2xl" />
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
            Financial Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate MIS reports, audit summaries, and export data in Excel and PDF formats
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" /> Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
          >
            <Download className="w-4 h-4 mr-1.5" /> Export Excel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={exportToPDF}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Download className="w-4 h-4 mr-1.5" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Filter Parameters */}
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Report Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Report Type
            </label>
            <Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="mis">Management Information System (MIS)</option>
              <option value="pending">Pending Approvals Report</option>
              <option value="paid">Disbursed Reimbursements Report</option>
              <option value="overdue">Exception Report (Overdue Approvals &gt; 3 Days)</option>
              <option value="rejected">Rejected Claims Report</option>
            </Select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department
            </label>
            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Filter
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_manager">Pending Manager</option>
              <option value="pending_dept_head">Pending Dept Head</option>
              <option value="pending_finance">Pending Finance</option>
              <option value="pending_accounts">Pending Accounts</option>
              <option value="paid">Paid</option>
              <option value="returned">Returned</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>

          {/* Records Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Matching Records
            </label>
            <div className="h-11 px-3.5 rounded-xl bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>{filteredData.length} Vouchers</span>
              <span className="text-indigo-700">{formatINR(totalAmount)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Claims Value</p>
          <h3 className="text-2xl font-extrabold text-indigo-700 mt-1">{formatINR(totalAmount)}</h3>
          <p className="text-xs text-slate-400 mt-1">{filteredData.length} vouchers in current filter</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid / Disbursed</p>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{paidCount}</h3>
          <p className="text-xs text-emerald-600 mt-1">Successfully cleared payments</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In-Pipeline</p>
          <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount}</h3>
          <p className="text-xs text-amber-600 mt-1">Under managerial review</p>
        </Card>
      </div>

      {/* Report Data Preview Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Voucher #</th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Title</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No vouchers matching the current report criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((v) => {
                  const statusConf = getStatusConfig(v.status);
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/70">
                      <td className="py-4 px-6 font-mono font-semibold text-indigo-700 whitespace-nowrap">
                        {v.voucher_number}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap font-medium text-slate-900">
                        {v.employee_name}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {v.department_name}
                      </td>
                      <td className="py-4 px-4 max-w-xs truncate font-medium text-slate-800">
                        {v.title}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(v.total_amount)}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(v.submitted_at || v.created_at)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusConf.bg}`}>
                          {statusConf.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
