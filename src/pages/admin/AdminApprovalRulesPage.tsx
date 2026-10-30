import React, { useState, useEffect } from 'react';
import { ApprovalRule } from '@/types';
import { api } from '@/services/api';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNotifications } from '@/contexts/NotificationContext';
import { Sliders, Plus, Edit2, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export const AdminApprovalRulesPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ApprovalRule | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [minAmount, setMinAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['manager', 'accounts']);

  const loadRules = async () => {
    try {
      const all = await api.getApprovalRules();
      setRules(all);
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const openCreateModal = () => {
    setEditingRule(null);
    setRuleName('');
    setMinAmount(0);
    setMaxAmount('');
    setDescription('');
    setSelectedLevels(['manager', 'accounts']);
    setIsModalOpen(true);
  };

  const openEditModal = (r: ApprovalRule) => {
    setEditingRule(r);
    setRuleName(r.name);
    setMinAmount(r.min_amount);
    setMaxAmount(r.max_amount ?? '');
    setDescription(r.description || '');
    setSelectedLevels(r.required_levels);
    setIsModalOpen(true);
  };

  const toggleLevel = (lvl: string) => {
    if (lvl === 'accounts') return; // Accounts is always final disbursement
    setSelectedLevels((prev) =>
      prev.includes(lvl) ? prev.filter((x) => x !== lvl) : [...prev, lvl]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName) {
      showToast('Validation', 'Rule name is required.', 'warning');
      return;
    }

    try {
      await api.saveApprovalRule({
        id: editingRule?.id,
        name: ruleName,
        min_amount: Number(minAmount),
        max_amount: maxAmount === '' ? null : Number(maxAmount),
        required_levels: selectedLevels,
        description,
        is_active: true,
      });

      showToast('Saved', `Rule "${ruleName}" saved successfully.`, 'success');
      setIsModalOpen(false);
      await loadRules();
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to save approval rule.', 'error');
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dynamic Approval Limits
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure multi-tier monetary thresholds and approver escalation routing
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-1.5" /> Add New Tier Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule, idx) => (
          <Card key={rule.id} className="p-5 sm:p-6 hover:border-indigo-300 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center">
                  #{idx + 1}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{rule.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{rule.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  Active
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(rule)}
                  className="text-xs"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Threshold
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {/* Monetary Threshold Range */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Applicable Claim Amount
                </span>
                <p className="text-lg font-extrabold text-indigo-700 mt-1">
                  {formatINR(rule.min_amount)} – {rule.max_amount !== null ? formatINR(rule.max_amount) : 'Unlimited (No Cap)'}
                </p>
              </div>

              {/* Approval Sequence Pipeline */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Approval Routing Chain
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                    Employee (Submitter)
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                  {rule.required_levels.map((lvl, lIdx) => {
                    const labelMap: Record<string, string> = {
                      manager: 'Reporting Manager',
                      dept_head: 'Department Head (VP)',
                      finance: 'Finance Director',
                      accounts: 'Accounts & Payout',
                    };

                    const isLast = lIdx === rule.required_levels.length - 1;

                    return (
                      <React.Fragment key={lvl}>
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
                          {labelMap[lvl] || lvl}
                        </span>
                        {!isLast && <ArrowRight className="w-3.5 h-3.5 text-slate-400" />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Rule Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? 'Edit Approval Threshold' : 'Create Approval Rule'}
        description="Set minimum/maximum thresholds and required sign-off hierarchy."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rule Tier Name <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="e.g. High-Value Executive Approval"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Amount (₹ INR)
              </label>
              <Input
                type="number"
                min="0"
                required
                value={minAmount}
                onChange={(e) => setMinAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maximum Amount (₹ INR or leave empty for no limit)
              </label>
              <Input
                type="number"
                placeholder="Leave blank for unlimited"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Required Sign-off Levels
            </label>
            <div className="space-y-2">
              {[
                { id: 'manager', label: 'Reporting Manager (Initial Review)' },
                { id: 'dept_head', label: 'Department Head (VP Level Approval)' },
                { id: 'finance', label: 'Finance Director (High-Value Executive Approval)' },
                { id: 'accounts', label: 'Accounts Officer (Mandatory Final Disbursement)' },
              ].map((lvl) => {
                const isSelected = selectedLevels.includes(lvl.id);
                return (
                  <div
                    key={lvl.id}
                    onClick={() => toggleLevel(lvl.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'border-indigo-500 bg-indigo-50/60' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-semibold text-slate-800">{lvl.label}</span>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Policy Reference
            </label>
            <Input
              placeholder="e.g. Claims over 50,000 INR require corporate finance clearance"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Rule
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
