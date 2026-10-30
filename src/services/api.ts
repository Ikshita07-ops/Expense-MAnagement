import {
  UserProfile,
  Department,
  Designation,
  ExpenseCategory,
  ApprovalRule,
  Voucher,
  VoucherItem,
  NotificationItem,
  AuditLogItem,
  PaymentRecord,
} from '@/types';
import {
  INITIAL_PROFILES,
  INITIAL_DEPARTMENTS,
  INITIAL_DESIGNATIONS,
  INITIAL_CATEGORIES,
  INITIAL_RULES,
  INITIAL_VOUCHERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from './mockData';

// Local storage keys
const STORAGE_KEYS = {
  PROFILES: 'smartexpense_profiles',
  DEPARTMENTS: 'smartexpense_departments',
  DESIGNATIONS: 'smartexpense_designations',
  CATEGORIES: 'smartexpense_categories',
  RULES: 'smartexpense_rules',
  VOUCHERS: 'smartexpense_vouchers',
  NOTIFICATIONS: 'smartexpense_notifications',
  AUDIT_LOGS: 'smartexpense_audit_logs',
};

// Generic storage helper
function getStored<T>(key: string, defaultVal: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Failed to store key ${key}`, e);
  }
}

// Initialize default storage on first load
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
    setStored(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
    setStored(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.DESIGNATIONS)) {
    setStored(STORAGE_KEYS.DESIGNATIONS, INITIAL_DESIGNATIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    setStored(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.RULES)) {
    setStored(STORAGE_KEYS.RULES, INITIAL_RULES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.VOUCHERS)) {
    setStored(STORAGE_KEYS.VOUCHERS, INITIAL_VOUCHERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    setStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    setStored(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }
}

// Run storage init
initStorage();

export const api = {
  // ==========================================
  // PROFILES
  // ==========================================
  getProfiles: async (): Promise<UserProfile[]> => {
    return getStored<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  },

  getProfileById: async (id: string): Promise<UserProfile | null> => {
    const list = getStored<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    return list.find((p) => p.id === id) || null;
  },

  getProfileByEmail: async (email: string): Promise<UserProfile | null> => {
    const list = getStored<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    return list.find((p) => p.email.toLowerCase() === email.toLowerCase()) || null;
  },

  updateProfile: async (id: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
    const list = getStored<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Profile not found');
    const updated = { ...list[index], ...updates };
    list[index] = updated;
    setStored(STORAGE_KEYS.PROFILES, list);
    return updated;
  },

  createProfile: async (profile: Omit<UserProfile, 'id'>): Promise<UserProfile> => {
    const list = getStored<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    const newProfile: UserProfile = {
      ...profile,
      id: `u-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    list.push(newProfile);
    setStored(STORAGE_KEYS.PROFILES, list);
    return newProfile;
  },

  // ==========================================
  // DEPARTMENTS & DESIGNATIONS
  // ==========================================
  getDepartments: async (): Promise<Department[]> => {
    return getStored<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  },

  saveDepartment: async (dept: Partial<Department>): Promise<Department> => {
    const list = getStored<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    if (dept.id) {
      const idx = list.findIndex((d) => d.id === dept.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...dept } as Department;
        setStored(STORAGE_KEYS.DEPARTMENTS, list);
        return list[idx];
      }
    }
    const newDept: Department = {
      id: `d-${Date.now()}`,
      name: dept.name || 'New Department',
      code: dept.code || 'DEPT',
      description: dept.description,
      budget: dept.budget || 0,
      is_active: dept.is_active ?? true,
      head_id: dept.head_id,
      head_name: dept.head_name,
      created_at: new Date().toISOString(),
    };
    list.push(newDept);
    setStored(STORAGE_KEYS.DEPARTMENTS, list);
    return newDept;
  },

  getDesignations: async (): Promise<Designation[]> => {
    return getStored<Designation[]>(STORAGE_KEYS.DESIGNATIONS, INITIAL_DESIGNATIONS);
  },

  saveDesignation: async (des: Partial<Designation>): Promise<Designation> => {
    const list = getStored<Designation[]>(STORAGE_KEYS.DESIGNATIONS, INITIAL_DESIGNATIONS);
    if (des.id) {
      const idx = list.findIndex((d) => d.id === des.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...des } as Designation;
        setStored(STORAGE_KEYS.DESIGNATIONS, list);
        return list[idx];
      }
    }
    const newDes: Designation = {
      id: `des-${Date.now()}`,
      title: des.title || 'New Designation',
      department_id: des.department_id,
      department_name: des.department_name,
      level: des.level || 1,
      created_at: new Date().toISOString(),
    };
    list.push(newDes);
    setStored(STORAGE_KEYS.DESIGNATIONS, list);
    return newDes;
  },

  // ==========================================
  // EXPENSE CATEGORIES
  // ==========================================
  getCategories: async (): Promise<ExpenseCategory[]> => {
    return getStored<ExpenseCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },

  saveCategory: async (cat: Partial<ExpenseCategory>): Promise<ExpenseCategory> => {
    const list = getStored<ExpenseCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    if (cat.id) {
      const idx = list.findIndex((c) => c.id === cat.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...cat } as ExpenseCategory;
        setStored(STORAGE_KEYS.CATEGORIES, list);
        return list[idx];
      }
    }
    const newCat: ExpenseCategory = {
      id: `cat-${Date.now()}`,
      name: cat.name || 'New Category',
      description: cat.description,
      icon: cat.icon || 'HelpCircle',
      is_active: cat.is_active ?? true,
      created_at: new Date().toISOString(),
    };
    list.push(newCat);
    setStored(STORAGE_KEYS.CATEGORIES, list);
    return newCat;
  },

  // ==========================================
  // APPROVAL RULES
  // ==========================================
  getApprovalRules: async (): Promise<ApprovalRule[]> => {
    return getStored<ApprovalRule[]>(STORAGE_KEYS.RULES, INITIAL_RULES);
  },

  saveApprovalRule: async (rule: Partial<ApprovalRule>): Promise<ApprovalRule> => {
    const list = getStored<ApprovalRule[]>(STORAGE_KEYS.RULES, INITIAL_RULES);
    if (rule.id) {
      const idx = list.findIndex((r) => r.id === rule.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...rule } as ApprovalRule;
        setStored(STORAGE_KEYS.RULES, list);
        return list[idx];
      }
    }
    const newRule: ApprovalRule = {
      id: `rule-${Date.now()}`,
      name: rule.name || 'Custom Rule',
      min_amount: rule.min_amount || 0,
      max_amount: rule.max_amount ?? null,
      required_levels: rule.required_levels || ['manager', 'accounts'],
      description: rule.description,
      is_active: rule.is_active ?? true,
      created_at: new Date().toISOString(),
    };
    list.push(newRule);
    setStored(STORAGE_KEYS.RULES, list);
    return newRule;
  },

  // ==========================================
  // VOUCHERS
  // ==========================================
  getVouchers: async (): Promise<Voucher[]> => {
    return getStored<Voucher[]>(STORAGE_KEYS.VOUCHERS, INITIAL_VOUCHERS);
  },

  getVoucherById: async (id: string): Promise<Voucher | null> => {
    const list = getStored<Voucher[]>(STORAGE_KEYS.VOUCHERS, INITIAL_VOUCHERS);
    return list.find((v) => v.id === id || v.voucher_number === id) || null;
  },

  createVoucher: async (
    data: {
      title: string;
      description?: string;
      business_purpose: string;
      items: Omit<VoucherItem, 'id'>[];
      isDraft?: boolean;
    },
    user: UserProfile
  ): Promise<Voucher> => {
    const list = getStored<Voucher[]>(STORAGE_KEYS.VOUCHERS, INITIAL_VOUCHERS);
    const count = list.length + 1;
    const voucherNumber = `EXP-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
    const total = data.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const now = new Date().toISOString();
    const itemsWithIds: VoucherItem[] = data.items.map((it, idx) => ({
      ...it,
      id: `vi-${Date.now()}-${idx}`,
      amount: Number(it.amount),
    }));

    const status = data.isDraft ? 'draft' : 'pending_manager';
    const current_step = data.isDraft ? 'Draft' : 'Manager Approval';

    const newVoucher: Voucher = {
      id: `v-${Date.now()}`,
      voucher_number: voucherNumber,
      title: data.title,
      description: data.description,
      business_purpose: data.business_purpose,
      employee_id: user.id,
      employee_name: user.full_name,
      employee_email: user.email,
      employee_avatar: user.avatar_url,
      department_name: user.department_name || 'Engineering',
      total_amount: total,
      currency: 'INR',
      status,
      current_step,
      current_approver_id: data.isDraft ? undefined : user.manager_id || 'u-manager-1',
      current_approver_name: data.isDraft ? undefined : user.manager_name || 'Sarah Jenkins',
      submitted_at: data.isDraft ? undefined : now,
      created_at: now,
      updated_at: now,
      items: itemsWithIds,
      history: [
        {
          id: `h-${Date.now()}`,
          voucher_id: `v-${Date.now()}`,
          actor_id: user.id,
          actor_name: user.full_name,
          actor_role: user.role,
          action: data.isDraft ? 'created' : 'submitted',
          to_status: status,
          comments: data.isDraft ? 'Saved voucher as draft' : 'Submitted voucher for manager approval',
          created_at: now,
        },
      ],
    };

    list.unshift(newVoucher);
    setStored(STORAGE_KEYS.VOUCHERS, list);

    // Notifications
    if (!data.isDraft) {
      await api.createNotification({
        recipient_id: user.manager_id || 'u-manager-1',
        title: 'New Voucher Submitted',
        message: `${user.full_name} submitted ${voucherNumber} (₹${total.toLocaleString('en-IN')}) for approval.`,
        type: 'approval_required',
        voucher_id: newVoucher.id,
      });
    }

    // Audit Log
    await api.createAuditLog({
      actor_id: user.id,
      actor_name: user.full_name,
      actor_email: user.email,
      action: data.isDraft ? 'VOUCHER_DRAFT_CREATED' : 'VOUCHER_SUBMITTED',
      entity_type: 'voucher',
      entity_id: newVoucher.id,
      details: { voucher_number: voucherNumber, total_amount: total, items_count: itemsWithIds.length },
    });

    return newVoucher;
  },

  updateVoucher: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      business_purpose?: string;
      items?: VoucherItem[];
      submitNow?: boolean;
    },
    user: UserProfile
  ): Promise<Voucher> => {
    const list = getStored<Voucher[]>(STORAGE_KEYS.VOUCHERS, INITIAL_VOUCHERS);
    const idx = list.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error('Voucher not found');

    const voucher = list[idx];
    const now = new Date().toISOString();

    let newTotal = voucher.total_amount;
    let newItems = voucher.items || [];
    if (data.items) {
      newItems = data.items.map((it, i) => ({
        ...it,
        id: it.id || `vi-${Date.now()}-${i}`,
        amount: Number(it.amount),
      }));
      newTotal = newItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    }

    let status = voucher.status;
    let current_step = voucher.current_step;
    let submitted_at = voucher.submitted_at;
    let current_approver_id = voucher.current_approver_id;
    let current_approver_name = voucher.current_approver_name;

    const history = [...(voucher.history || [])];

    if (data.submitNow) {
      status = 'pending_manager';
      current_step = 'Manager Approval';
      submitted_at = now;
      current_approver_id = user.manager_id || 'u-manager-1';
      current_approver_name = user.manager_name || 'Sarah Jenkins';

      history.push({
        id: `h-${Date.now()}`,
        voucher_id: voucher.id,
        actor_id: user.id,
        actor_name: user.full_name,
        actor_role: user.role,
        action: 'resubmitted',
        from_status: voucher.status,
        to_status: 'pending_manager',
        comments: 'Resubmitted for review after adjustments',
        created_at: now,
      });

      await api.createNotification({
        recipient_id: user.manager_id || 'u-manager-1',
        title: 'Voucher Resubmitted',
        message: `${user.full_name} resubmitted ${voucher.voucher_number} for approval.`,
        type: 'approval_required',
        voucher_id: voucher.id,
      });
    }

    const updated: Voucher = {
      ...voucher,
      title: data.title ?? voucher.title,
      description: data.description ?? voucher.description,
      business_purpose: data.business_purpose ?? voucher.business_purpose,
      items: newItems,
      total_amount: newTotal,
      status,
      current_step,
      submitted_at,
      current_approver_id,
      current_approver_name,
      updated_at: now,
      history,
    };

    list[idx] = updated;
    setStored(STORAGE_KEYS.VOUCHERS, list);
    return updated;
  },

  // ==========================================
  // DYNAMIC APPROVAL WORKFLOW ENGINE
  // ==========================================
  approveVoucher: async (
    voucherId: string,
    comments: string = '',
    actor: UserProfile
  ): Promise<Voucher> => {
    const list = getStored<Voucher[]>(STORAGE_KEYS.VOUCHERS, INITIAL_VOUCHERS);
    const idx = list.findIndex((v) => v.id === voucherId);
    if (idx === -1) throw new Error('Voucher not found');

    const voucher = list[idx];
    const rules = getStored<ApprovalRule[]>(STORAGE_KEYS.RULES, INITIAL_RULES);
    const amount = Number(voucher.total_amount);
    const now = new Date().toISOString();

    // Determine the required levels for this amount
    // Rule 1: <= 10000 -> manager, accounts
    // Rule 2: 10001..50000 -> manager, dept_head, accounts
    // Rule 3: > 50000 -> manager, dept_head, finance, accounts
    let matchedRule = rules.find((r) => {
      const minOk = amount >= r.min_amount;
      const maxOk = r.max_amount === null || amount <= r.max_amount;
      return minOk && maxOk && r.is_active;
    });

    if (!matchedRule) {
      // Default fallback
      matchedRule = {
        id: 'default',
        name: 'Default Workflow',
        min_amount: 0,
        max_amount: null,
        required_levels: ['manager', 'accounts'],
        is_active: true,
      };
    }

    let nextStatus: Voucher['status'] = voucher.status;
    let nextStep: string = voucher.current_step;
    let nextApproverId: string | undefined = undefined;
    let nextApproverName: string | undefined = undefined;
    let approved_at = voucher.approved_at;

    if (voucher.status === 'pending_manager') {
      if (matchedRule.required_levels.includes('dept_head')) {
        nextStatus = 'pending_dept_head';
        nextStep = 'Department Head Approval';
        nextApproverId = 'u-depthead-1';
        nextApproverName = 'Priya Sharma (VP Eng)';
      } else {
        nextStatus = 'pending_accounts';
        nextStep = 'Accounts Verification';
        nextApproverId = 'u-accounts-1';
        nextApproverName = 'David Ross';
        approved_at = now;
      }
    } else if (voucher.status === 'pending_dept_head') {
      if (matchedRule.required_levels.includes('finance')) {
        nextStatus = 'pending_finance';
        nextStep = 'Finance Approval';
        nextApproverId = 'u-financehead-1';
        nextApproverName = 'Vikram Malhotra (Finance Director)';
      } else {
        nextStatus = 'pending_accounts';
        nextStep = 'Accounts Verification';
        nextApproverId = 'u-accounts-1';
        nextApproverName = 'David Ross';
        approved_at = now;
      }
    } else if (voucher.status === 'pending_finance') {
      nextStatus = 'pending_accounts';
      nextStep = 'Accounts Verification';
      nextApproverId = 'u-accounts-1';
      nextApproverName = 'David Ross';
      approved_at = now;
    }

    const historyItem = {
      id: `h-${Date.now()}`,
      voucher_id: voucher.id,
      actor_id: actor.id,
      actor_name: actor.full_name,
      actor_role: actor.role,
      action: 'approved' as const,
      from_status: voucher.status,
      to_status: nextStatus,
      comments: comments || `Approved by ${actor.full_name}`,
      created_at: now,
    };

    const updated: Voucher = {
      ...voucher,
      status: nextStatus,
      current_step: nextStep,
      current_approver_id: nextApproverId,
      current_approver_name: nextApproverName,
      approved_at,
      updated_at: now,
      history: [...(voucher.history || []), historyItem],
    };

    list[idx] = updated;
    setStored(STORAGE_KEYS.VOUCHERS, list);

    // Notify employee of approval progress
    await api.createNotification({
      recipient_id: voucher.employee_id,
      title: 'Voucher Approved',
      message: `${voucher.voucher_number} approved by ${actor.full_name}. Now in: ${nextStep}`,
      type: 'voucher_approved',
      voucher_id: voucher.id,
    });

    // Notify next approver if any
    if (nextApproverId && nextApproverId !== voucher.employee_id) {
      await api.createNotification({
        recipient_id: nextApproverId,
        title: 'Action Required',
        message: `Voucher ${voucher.voucher_number} (₹${amount.toLocaleString('en-IN')}) requires your approval.`,
        type: 'approval_required',
        voucher_id: voucher.id,
      });
    }

    // Audit log
    await api.createAuditLog({
      actor_id: actor.id,
      actor_name: actor.full_name,
      actor_email: actor.email,
      action: 'VOUCHER_APPROVED',
      entity_type: 'voucher',
      entity_id: voucher.id,
      details: {
        from: voucher.status,
        to: nextStatus,
        comments,
        amount,
      },
    });

    return updated;
  },

  returnVoucher: async (
    voucherId: string,
    reason: string,
    actor: UserProfile
  ): Promise<Voucher> => {
    if (!reason || !reason.trim()) {
      throw new Error('A reason is strictly required to return a voucher for correction.');
    }

    const list = getStored<Voucher[]>(STORAGE_KEYS.VOUCHERS, INITIAL_VOUCHERS);
    const idx = list.findIndex((v) => v.id === voucherId);
    if (idx === -1) throw new Error('Voucher not found');

    const voucher = list[idx];
    const now = new Date().toISOString();

    const historyItem = {
      id: `h-${Date.now()}`,
      voucher_id: voucher.id,
      actor_id: actor.id,
      actor_name: actor.full_name,
      actor_role: actor.role,
      action: 'returned' as const,
      from_status: voucher.status,
      to_status: 'returned',
      comments: reason,
      created_at: now,
    };

    const updated: Voucher = {
      ...voucher,
      status: 'returned',
      current_step: 'Returned for Correction',
      current_approver_id: voucher.employee_id,
      current_approver_name: voucher.employee_name,
      updated_at: now,
      history: [...(voucher.history || []), historyItem],
    };

    list[idx] = updated;
    setStored(STORAGE_KEYS.VOUCHERS, list);

    // Notify employee
    await api.createNotification({
      recipient_id: voucher.employee_id,
      title: 'Voucher Returned for Correction',
      message: `${actor.full_name} returned ${voucher.voucher_number}: "${reason}"`,
      type: 'voucher_returned',
      voucher_id: voucher.id,
    });

    // Audit log
    await api.createAuditLog({
      actor_id: actor.id,
      actor_name: actor.full_name,
      actor_email: actor.email,
      action: 'VOUCHER_RETURNED',
      entity_type: 'voucher',
      entity_id: voucher.id,
      details: { reason },
    });

    return updated;
  },

  rejectVoucher: async (
    voucherId: string,
    reason: string,
    actor: UserProfile
  ): Promise<Voucher> => {
    if (!reason || !reason.trim()) {
      throw new Error('A rejection reason is strictly required.');
    }

    const list = getStored<Voucher[]>(STORAGE_KEYS.VOUCHERS, INITIAL_VOUCHERS);
    const idx = list.findIndex((v) => v.id === voucherId);
    if (idx === -1) throw new Error('Voucher not found');

    const voucher = list[idx];
    const now = new Date().toISOString();

    const historyItem = {
      id: `h-${Date.now()}`,
      voucher_id: voucher.id,
      actor_id: actor.id,
      actor_name: actor.full_name,
      actor_role: actor.role,
      action: 'rejected' as const,
      from_status: voucher.status,
      to_status: 'rejected',
      comments: reason,
      created_at: now,
    };

    const updated: Voucher = {
      ...voucher,
      status: 'rejected',
      current_step: 'Rejected',
      current_approver_id: undefined,
      current_approver_name: undefined,
      updated_at: now,
      history: [...(voucher.history || []), historyItem],
    };

    list[idx] = updated;
    setStored(STORAGE_KEYS.VOUCHERS, list);

    // Notify employee
    await api.createNotification({
      recipient_id: voucher.employee_id,
      title: 'Voucher Rejected',
      message: `${voucher.voucher_number} was rejected by ${actor.full_name}: "${reason}"`,
      type: 'voucher_rejected',
      voucher_id: voucher.id,
    });

    // Audit log
    await api.createAuditLog({
      actor_id: actor.id,
      actor_name: actor.full_name,
      actor_email: actor.email,
      action: 'VOUCHER_REJECTED',
      entity_type: 'voucher',
      entity_id: voucher.id,
      details: { reason },
    });

    return updated;
  },

  // ==========================================
  // PAYMENT PROCESSING (ACCOUNTS)
  // ==========================================
  recordPayment: async (
    voucherId: string,
    paymentData: {
      payment_date: string;
      payment_method: PaymentRecord['payment_method'];
      transaction_reference: string;
      amount_paid: number;
      remarks?: string;
    },
    actor: UserProfile
  ): Promise<Voucher> => {
    const list = getStored<Voucher[]>(STORAGE_KEYS.VOUCHERS, INITIAL_VOUCHERS);
    const idx = list.findIndex((v) => v.id === voucherId);
    if (idx === -1) throw new Error('Voucher not found');

    const voucher = list[idx];
    const now = new Date().toISOString();

    const payment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      voucher_id: voucher.id,
      payment_date: paymentData.payment_date,
      payment_method: paymentData.payment_method,
      transaction_reference: paymentData.transaction_reference,
      amount_paid: Number(paymentData.amount_paid),
      remarks: paymentData.remarks,
      processed_by: actor.id,
      processed_by_name: actor.full_name,
      created_at: now,
    };

    const historyItem = {
      id: `h-${Date.now()}`,
      voucher_id: voucher.id,
      actor_id: actor.id,
      actor_name: actor.full_name,
      actor_role: actor.role,
      action: 'paid' as const,
      from_status: voucher.status,
      to_status: 'paid',
      comments: `Reimbursement recorded via ${paymentData.payment_method} Ref #${paymentData.transaction_reference}`,
      created_at: now,
    };

    const updated: Voucher = {
      ...voucher,
      status: 'paid',
      current_step: 'Completed',
      paid_at: now,
      updated_at: now,
      payment,
      history: [...(voucher.history || []), historyItem],
    };

    list[idx] = updated;
    setStored(STORAGE_KEYS.VOUCHERS, list);

    // Notify employee of payment completion
    await api.createNotification({
      recipient_id: voucher.employee_id,
      title: 'Payment Disbursed',
      message: `Reimbursement of ₹${paymentData.amount_paid.toLocaleString('en-IN')} for ${voucher.voucher_number} processed (${paymentData.payment_method} Ref #${paymentData.transaction_reference}).`,
      type: 'payment_completed',
      voucher_id: voucher.id,
    });

    // Audit log
    await api.createAuditLog({
      actor_id: actor.id,
      actor_name: actor.full_name,
      actor_email: actor.email,
      action: 'PAYMENT_RECORDED',
      entity_type: 'payment',
      entity_id: payment.id,
      details: {
        voucher_number: voucher.voucher_number,
        amount: paymentData.amount_paid,
        method: paymentData.payment_method,
        ref: paymentData.transaction_reference,
      },
    });

    return updated;
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  getNotifications: async (userId: string): Promise<NotificationItem[]> => {
    const list = getStored<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    return list.filter((n) => n.recipient_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  markNotificationAsRead: async (id: string): Promise<void> => {
    const list = getStored<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const item = list.find((n) => n.id === id);
    if (item) {
      item.is_read = true;
      setStored(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  },

  markAllNotificationsAsRead: async (userId: string): Promise<void> => {
    const list = getStored<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    list.forEach((n) => {
      if (n.recipient_id === userId) {
        n.is_read = true;
      }
    });
    setStored(STORAGE_KEYS.NOTIFICATIONS, list);
  },

  createNotification: async (
    notification: Omit<NotificationItem, 'id' | 'is_read' | 'created_at'>
  ): Promise<NotificationItem> => {
    const list = getStored<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const newItem: NotificationItem = {
      ...notification,
      id: `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    list.unshift(newItem);
    setStored(STORAGE_KEYS.NOTIFICATIONS, list);
    return newItem;
  },

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  getAuditLogs: async (): Promise<AuditLogItem[]> => {
    const list = getStored<AuditLogItem[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  createAuditLog: async (log: Omit<AuditLogItem, 'id' | 'created_at'>): Promise<AuditLogItem> => {
    const list = getStored<AuditLogItem[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    const newLog: AuditLogItem = {
      ...log,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      created_at: new Date().toISOString(),
    };
    list.unshift(newLog);
    setStored(STORAGE_KEYS.AUDIT_LOGS, list);
    return newLog;
  },
};
