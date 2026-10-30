import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { ExpenseCategory, VoucherItem } from '@/types';
import { api } from '@/services/api';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import confetti from 'canvas-confetti';
import {
  Plus,
  Trash2,
  UploadCloud,
  FileCheck,
  AlertCircle,
  ArrowLeft,
  Save,
  Send,
  Eye,
  Paperclip,
  CheckCircle,
} from 'lucide-react';

export const NewVoucherPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [businessPurpose, setBusinessPurpose] = useState('');

  const [items, setItems] = useState<VoucherItem[]>([
    {
      id: `vi-init-1`,
      category_id: 'cat-1',
      category_name: 'Travel',
      description: '',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      merchant_name: '',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);

  // Load categories and existing voucher if in edit mode
  useEffect(() => {
    async function init() {
      const cats = await api.getCategories();
      setCategories(cats.filter((c) => c.is_active));

      if (editId) {
        const existing = await api.getVoucherById(editId);
        if (existing) {
          setTitle(existing.title);
          setDescription(existing.description || '');
          setBusinessPurpose(existing.business_purpose);
          if (existing.items && existing.items.length > 0) {
            setItems(existing.items);
          }
        }
      }
    }
    init();
  }, [editId]);

  // Add Item Row
  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `vi-new-${Date.now()}`,
        category_id: categories[0]?.id || 'cat-1',
        category_name: categories[0]?.name || 'Travel',
        description: '',
        amount: 0,
        expense_date: new Date().toISOString().split('T')[0],
        merchant_name: '',
      },
    ]);
  };

  // Remove Item Row
  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) {
      showToast('Validation', 'A voucher must contain at least one expense item.', 'warning');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update item field
  const handleItemChange = (index: number, field: keyof VoucherItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'category_id') {
        const cat = categories.find((c) => c.id === value);
        if (cat) copy[index].category_name = cat.name;
      }
      return copy;
    });
  };

  // File Upload Handler (PDF, PNG, JPG, JPEG)
  const handleFileUpload = (index: number, file: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      showToast('Invalid File', 'Only PDF, PNG, JPG, and JPEG receipts are accepted.', 'error');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File Too Large', 'Receipt file size must not exceed 5 MB.', 'error');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    handleItemChange(index, 'receipt_file', file);
    handleItemChange(index, 'receipt_url', objectUrl);
    handleItemChange(index, 'receipt_name', file.name);
    showToast('Receipt Attached', `Attached ${file.name}`, 'success');
  };

  // Live total calculation
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Validate form
  const validate = () => {
    if (!title.trim()) {
      showToast('Required Field', 'Please enter a voucher title.', 'error');
      return false;
    }
    if (!businessPurpose.trim()) {
      showToast('Required Field', 'Please provide the business purpose of the claim.', 'error');
      return false;
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.description.trim()) {
        showToast('Required Field', `Item #${i + 1}: Description is required.`, 'error');
        return false;
      }
      if (!item.amount || Number(item.amount) <= 0) {
        showToast('Invalid Amount', `Item #${i + 1}: Amount must be greater than ₹0.`, 'error');
        return false;
      }
      if (!item.expense_date) {
        showToast('Required Field', `Item #${i + 1}: Expense date is required.`, 'error');
        return false;
      }
    }
    return true;
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!user) return;
    if (!title.trim()) {
      showToast('Required Field', 'Please provide at least a title to save a draft.', 'warning');
      return;
    }

    setIsDrafting(true);
    try {
      if (editId) {
        await api.updateVoucher(
          editId,
          {
            title,
            description,
            business_purpose: businessPurpose,
            items,
          },
          user
        );
        showToast('Draft Updated', 'Voucher draft has been saved successfully.', 'success');
        navigate('/vouchers');
      } else {
        const created = await api.createVoucher(
          {
            title,
            description,
            business_purpose: businessPurpose,
            items,
            isDraft: true,
          },
          user
        );
        showToast('Draft Saved', `Saved draft ${created.voucher_number}`, 'success');
        navigate(`/vouchers/${created.id}`);
      }
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to save draft.', 'error');
    } finally {
      setIsDrafting(false);
    }
  };

  // Submit for Approval
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      let resultVoucher;
      if (editId) {
        resultVoucher = await api.updateVoucher(
          editId,
          {
            title,
            description,
            business_purpose: businessPurpose,
            items,
            submitNow: true,
          },
          user
        );
      } else {
        resultVoucher = await api.createVoucher(
          {
            title,
            description,
            business_purpose: businessPurpose,
            items,
            isDraft: false,
          },
          user
        );
      }

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      showToast(
        'Voucher Submitted!',
        `${resultVoucher.voucher_number} submitted to ${resultVoucher.current_approver_name || 'Manager'} for approval.`,
        'success'
      );

      navigate(`/vouchers/${resultVoucher.id}`);
    } catch (err: any) {
      showToast('Submission Error', err?.message || 'Failed to submit voucher.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {editId ? 'Edit Expense Voucher' : 'Create Expense Voucher'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Submit expense claims with receipts for multi-level manager approval and reimbursement
          </p>
        </div>

        {/* Live Total Badge in INR */}
        <div className="bg-white px-5 py-3 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-4">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Amount
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-indigo-700">
              {formatINR(totalAmount)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
            ₹
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: VOUCHER DETAILS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              Voucher Details
            </CardTitle>
            <CardDescription>Primary claim description and official purpose</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Voucher Title <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Client Dinner & Hotel Accommodation - Mumbai"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Business Purpose <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  required
                  rows={3}
                  placeholder="Explain why this expense was necessary for business operations..."
                  value={businessPurpose}
                  onChange={(e) => setBusinessPurpose(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Additional Notes (Optional)
                </label>
                <Textarea
                  rows={3}
                  placeholder="Any extra context or approvals already received..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: EXPENSE ITEMS */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                Expense Items & Receipts
              </CardTitle>
              <CardDescription>Itemize all expenditures with corresponding proof</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Row
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id || index}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 relative space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    Item #{index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
                  {/* Category */}
                  <div className="lg:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={item.category_id}
                      onChange={(e) => handleItemChange(index, 'category_id', e.target.value)}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="lg:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Item Description <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="e.g. Taxi fare to client site"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    />
                  </div>

                  {/* Merchant Name */}
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Merchant Name
                    </label>
                    <Input
                      placeholder="e.g. Uber / Taj"
                      value={item.merchant_name || ''}
                      onChange={(e) => handleItemChange(index, 'merchant_name', e.target.value)}
                    />
                  </div>

                  {/* Expense Date */}
                  <div className="lg:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Expense Date <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="date"
                      required
                      value={item.expense_date}
                      onChange={(e) => handleItemChange(index, 'expense_date', e.target.value)}
                    />
                  </div>
                </div>

                {/* Amount and Receipt Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Amount (₹) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Amount (₹ INR) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min="1"
                        step="any"
                        required
                        className="pl-8 font-semibold text-slate-900"
                        placeholder="0.00"
                        value={item.amount || ''}
                        onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Receipt Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Receipt Attachment (PDF, PNG, JPG)
                    </label>
                    {item.receipt_name ? (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="text-xs font-medium text-indigo-900 truncate">
                            {item.receipt_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.receipt_url && (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewUrl(item.receipt_url || null);
                                setPreviewName(item.receipt_name || 'Receipt Preview');
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-100 flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              handleItemChange(index, 'receipt_file', undefined);
                              handleItemChange(index, 'receipt_url', undefined);
                              handleItemChange(index, 'receipt_name', undefined);
                            }}
                            className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded hover:bg-rose-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-dashed border-slate-300 bg-white hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-600 transition-colors">
                        <UploadCloud className="w-4 h-4 text-slate-400" />
                        <span>Upload receipt (PDF / Image)</span>
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/jpg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(index, file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Total Row Summary */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                Calculated Total ({items.length} {items.length === 1 ? 'item' : 'items'}):
              </span>
              <span className="text-xl font-extrabold text-indigo-700">
                {formatINR(totalAmount)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="md"
              isLoading={isDrafting}
              disabled={isSubmitting}
              onClick={handleSaveDraft}
              className="w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-1.5" /> Save Draft
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={isDrafting}
              className="w-full sm:w-auto shadow-md shadow-indigo-500/20"
            >
              <Send className="w-4 h-4 mr-1.5" /> Submit for Approval
            </Button>
          </div>
        </div>
      </form>

      {/* Receipt Preview Dialog */}
      <Dialog
        isOpen={Boolean(previewUrl)}
        onClose={() => setPreviewUrl(null)}
        title={previewName || 'Receipt Attachment'}
        maxWidth="lg"
      >
        <div className="flex flex-col items-center justify-center p-2">
          {previewUrl?.endsWith('.pdf') || previewName?.endsWith('.pdf') ? (
            <div className="w-full h-96 flex flex-col items-center justify-center bg-slate-100 rounded-xl p-4">
              <Paperclip className="w-12 h-12 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">PDF Document Attachment</p>
              <p className="text-xs text-slate-500 mt-1">{previewName}</p>
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
