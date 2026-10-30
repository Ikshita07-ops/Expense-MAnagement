-- ====================================================================
-- SMART EXPENSE: Database Schema & Row-Level Security (RLS)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    head_id UUID,
    budget NUMERIC(14,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. DESIGNATIONS
CREATE TABLE IF NOT EXISTS public.designations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL UNIQUE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('employee', 'manager', 'accounts', 'admin')),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    designation_id UUID REFERENCES public.designations(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add head_id FK back to departments now that profiles exists
ALTER TABLE public.departments 
    DROP CONSTRAINT IF EXISTS fk_departments_head;
ALTER TABLE public.departments 
    ADD CONSTRAINT fk_departments_head FOREIGN KEY (head_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. EXPENSE CATEGORIES
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. APPROVAL RULES
CREATE TABLE IF NOT EXISTS public.approval_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    min_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    max_amount NUMERIC(12,2),
    required_levels TEXT[] NOT NULL, -- e.g. ['manager', 'accounts']
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. VOUCHERS
CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    business_purpose TEXT NOT NULL,
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (
        status IN (
            'draft',
            'pending_manager',
            'pending_dept_head',
            'pending_finance',
            'approved',
            'rejected',
            'returned',
            'pending_accounts',
            'paid'
        )
    ),
    current_step TEXT DEFAULT 'Draft',
    current_approver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. VOUCHER ITEMS
CREATE TABLE IF NOT EXISTS public.voucher_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
    category_name TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL,
    merchant_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. ATTACHMENTS
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
    voucher_item_id UUID REFERENCES public.voucher_items(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL,
    public_url TEXT,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. APPROVAL STEPS
CREATE TABLE IF NOT EXISTS public.approval_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    role_required TEXT NOT NULL,
    approver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'returned', 'skipped')),
    action_date TIMESTAMPTZ,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. WORKFLOW HISTORY
CREATE TABLE IF NOT EXISTS public.workflow_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL, -- 'created', 'submitted', 'approved', 'returned', 'rejected', 'resubmitted', 'verified', 'paid'
    from_status TEXT,
    to_status TEXT,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    voucher_id UUID REFERENCES public.vouchers(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID NOT NULL UNIQUE REFERENCES public.vouchers(id) ON DELETE RESTRICT,
    payment_date DATE NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('NEFT', 'RTGS', 'UPI', 'Bank Transfer', 'Corporate Card', 'Cheque')),
    transaction_reference TEXT NOT NULL,
    amount_paid NUMERIC(12,2) NOT NULL,
    remarks TEXT,
    processed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_vouchers_employee ON public.vouchers(employee_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON public.vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_current_approver ON public.vouchers(current_approver_id);
CREATE INDEX IF NOT EXISTS idx_voucher_items_voucher ON public.voucher_items(voucher_id);
CREATE INDEX IF NOT EXISTS idx_workflow_voucher ON public.workflow_history(voucher_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_manager ON public.profiles(manager_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can read all profiles" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage profiles" 
    ON public.profiles FOR ALL 
    USING (public.get_current_role() = 'admin');

-- Departments, Designations, Categories: read by authenticated, managed by admin
CREATE POLICY "Authenticated users can read departments" 
    ON public.departments FOR SELECT 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage departments" 
    ON public.departments FOR ALL 
    USING (public.get_current_role() = 'admin');

CREATE POLICY "Authenticated users can read designations" 
    ON public.designations FOR SELECT 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage designations" 
    ON public.designations FOR ALL 
    USING (public.get_current_role() = 'admin');

CREATE POLICY "Authenticated users can read expense categories" 
    ON public.expense_categories FOR SELECT 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage expense categories" 
    ON public.expense_categories FOR ALL 
    USING (public.get_current_role() = 'admin');

CREATE POLICY "Authenticated users can read approval rules" 
    ON public.approval_rules FOR SELECT 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage approval rules" 
    ON public.approval_rules FOR ALL 
    USING (public.get_current_role() = 'admin');

-- Vouchers Policies
CREATE POLICY "Employees can read their own vouchers" 
    ON public.vouchers FOR SELECT 
    USING (
        auth.uid() = employee_id 
        OR auth.uid() = current_approver_id 
        OR public.get_current_role() IN ('manager', 'accounts', 'admin')
    );

CREATE POLICY "Employees can create vouchers" 
    ON public.vouchers FOR INSERT 
    WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Employees can update their own editable vouchers" 
    ON public.vouchers FOR UPDATE 
    USING (
        (auth.uid() = employee_id AND status IN ('draft', 'returned', 'rejected'))
        OR (auth.uid() = current_approver_id)
        OR (public.get_current_role() IN ('accounts', 'admin'))
    );

-- Voucher items and attachments policies
CREATE POLICY "Users can read items for viewable vouchers"
    ON public.voucher_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.vouchers v
        WHERE v.id = voucher_items.voucher_id
        AND (
            v.employee_id = auth.uid() 
            OR v.current_approver_id = auth.uid() 
            OR public.get_current_role() IN ('manager', 'accounts', 'admin')
        )
    ));

CREATE POLICY "Employees can manage items on editable vouchers"
    ON public.voucher_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.vouchers v
        WHERE v.id = voucher_items.voucher_id
        AND v.employee_id = auth.uid()
        AND v.status IN ('draft', 'returned', 'rejected')
    ));

CREATE POLICY "Users can read attachments for viewable vouchers"
    ON public.attachments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.vouchers v
        WHERE v.id = attachments.voucher_id
        AND (
            v.employee_id = auth.uid() 
            OR v.current_approver_id = auth.uid() 
            OR public.get_current_role() IN ('manager', 'accounts', 'admin')
        )
    ));

CREATE POLICY "Employees can manage attachments on editable vouchers"
    ON public.attachments FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.vouchers v
        WHERE v.id = attachments.voucher_id
        AND v.employee_id = auth.uid()
        AND v.status IN ('draft', 'returned', 'rejected')
    ));

-- Workflow History
CREATE POLICY "View workflow history of viewable vouchers"
    ON public.workflow_history FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.vouchers v
        WHERE v.id = workflow_history.voucher_id
        AND (
            v.employee_id = auth.uid() 
            OR v.current_approver_id = auth.uid() 
            OR public.get_current_role() IN ('manager', 'accounts', 'admin')
        )
    ));

CREATE POLICY "Authenticated users can record workflow history"
    ON public.workflow_history FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Notifications
CREATE POLICY "Users can view and manage their own notifications"
    ON public.notifications FOR ALL
    USING (auth.uid() = recipient_id);

CREATE POLICY "System/users can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Payments
CREATE POLICY "View payments for viewable vouchers"
    ON public.payments FOR SELECT
    USING (
        public.get_current_role() IN ('accounts', 'admin')
        OR EXISTS (
            SELECT 1 FROM public.vouchers v
            WHERE v.id = payments.voucher_id AND v.employee_id = auth.uid()
        )
    );

CREATE POLICY "Accounts and admins can record payments"
    ON public.payments FOR INSERT
    WITH CHECK (public.get_current_role() IN ('accounts', 'admin'));

-- Audit Logs
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.get_current_role() = 'admin');

CREATE POLICY "Authenticated users can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Setup Storage Bucket for private receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Authenticated users can read receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'receipts');
