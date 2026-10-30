export type Role = 'employee' | 'manager' | 'accounts' | 'admin';

export type VoucherStatus =
  | 'draft'
  | 'pending_manager'
  | 'pending_dept_head'
  | 'pending_finance'
  | 'approved'
  | 'rejected'
  | 'returned'
  | 'pending_accounts'
  | 'paid';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: Role;
  department_id?: string;
  department_name?: string;
  designation_id?: string;
  designation_title?: string;
  manager_id?: string;
  manager_name?: string;
  phone?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  head_id?: string;
  head_name?: string;
  budget: number;
  is_active: boolean;
  created_at?: string;
}

export interface Designation {
  id: string;
  title: string;
  department_id?: string;
  department_name?: string;
  level: number;
  created_at?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_at?: string;
}

export interface ApprovalRule {
  id: string;
  name: string;
  min_amount: number;
  max_amount: number | null;
  required_levels: string[]; // ['manager', 'accounts'] or ['manager', 'dept_head', 'accounts']
  description?: string;
  is_active: boolean;
  created_at?: string;
}

export interface VoucherItem {
  id: string;
  voucher_id?: string;
  category_id: string;
  category_name: string;
  description: string;
  amount: number;
  expense_date: string;
  merchant_name?: string;
  receipt_file?: File;
  receipt_url?: string;
  receipt_name?: string;
}

export interface VoucherAttachment {
  id: string;
  voucher_id: string;
  voucher_item_id?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  public_url?: string;
  uploaded_by: string;
  created_at: string;
}

export interface WorkflowHistoryItem {
  id: string;
  voucher_id: string;
  actor_id?: string;
  actor_name: string;
  actor_role: string;
  action: 'created' | 'submitted' | 'approved' | 'returned' | 'rejected' | 'resubmitted' | 'verified' | 'paid';
  from_status?: string;
  to_status?: string;
  comments?: string;
  created_at: string;
}

export interface ApprovalStep {
  id: string;
  voucher_id: string;
  step_number: number;
  role_required: string;
  approver_id?: string;
  approver_name?: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'skipped';
  action_date?: string;
  comments?: string;
}

export interface PaymentRecord {
  id: string;
  voucher_id: string;
  payment_date: string;
  payment_method: 'NEFT' | 'RTGS' | 'UPI' | 'Bank Transfer' | 'Corporate Card' | 'Cheque';
  transaction_reference: string;
  amount_paid: number;
  remarks?: string;
  processed_by: string;
  processed_by_name?: string;
  created_at: string;
}

export interface Voucher {
  id: string;
  voucher_number: string;
  title: string;
  description?: string;
  business_purpose: string;
  employee_id: string;
  employee_name?: string;
  employee_email?: string;
  employee_avatar?: string;
  department_name?: string;
  total_amount: number;
  currency: string;
  status: VoucherStatus;
  current_step: string;
  current_approver_id?: string;
  current_approver_name?: string;
  items?: VoucherItem[];
  attachments?: VoucherAttachment[];
  history?: WorkflowHistoryItem[];
  payment?: PaymentRecord;
  submitted_at?: string;
  approved_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: 'voucher_submitted' | 'approval_required' | 'voucher_approved' | 'voucher_rejected' | 'voucher_returned' | 'payment_completed';
  voucher_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  actor_id?: string;
  actor_name: string;
  actor_email?: string;
  action: string;
  entity_type: 'voucher' | 'employee' | 'rule' | 'department' | 'payment';
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}
