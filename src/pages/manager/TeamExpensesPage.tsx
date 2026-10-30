import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Voucher } from '@/types';
import { api } from '@/services/api';
import { formatINR, formatDate, getStatusConfig } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Users, Receipt, Eye } from 'lucide-react';

export const TeamExpensesPage: React.FC = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const all = await api.getVouchers();
        setVouchers(all);
      } catch (err) {
        console.error('Failed to load team expenses:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Team Expenses
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete listing of all team claims, status history, and expenditure details
        </p>
      </div>

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
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vouchers.map((v) => {
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
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusConf.bg}`}>
                        {statusConf.label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 text-slate-400" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
