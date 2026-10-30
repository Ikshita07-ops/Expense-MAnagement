-- ====================================================================
-- SMART EXPENSE: ALL-IN-ONE SUPABASE SETUP SCRIPT
-- Paste this entire script into your Supabase SQL Editor and run it!
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE SCHEMAS & TABLES
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

CREATE TABLE IF NOT EXISTS public.designations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL UNIQUE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

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

-- Circular FK for department head
ALTER TABLE public.departments 
    DROP CONSTRAINT IF EXISTS fk_departments_head;
ALTER TABLE public.departments 
    ADD CONSTRAINT fk_departments_head FOREIGN KEY (head_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.approval_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    min_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    max_amount NUMERIC(12,2),
    required_levels TEXT[] NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.workflow_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

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

-- 3. ENABLE RLS
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

-- 4. HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. RLS POLICIES (Drop existing first to allow clean re-runs)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Authenticated users can read departments" ON public.departments;
    DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
    DROP POLICY IF EXISTS "Authenticated users can read designations" ON public.designations;
    DROP POLICY IF EXISTS "Admins can manage designations" ON public.designations;
    DROP POLICY IF EXISTS "Authenticated users can read expense categories" ON public.expense_categories;
    DROP POLICY IF EXISTS "Admins can manage expense categories" ON public.expense_categories;
    DROP POLICY IF EXISTS "Authenticated users can read approval rules" ON public.approval_rules;
    DROP POLICY IF EXISTS "Admins can manage approval rules" ON public.approval_rules;
    DROP POLICY IF EXISTS "Employees can read their own vouchers" ON public.vouchers;
    DROP POLICY IF EXISTS "Employees can create vouchers" ON public.vouchers;
    DROP POLICY IF EXISTS "Employees can update their own editable vouchers" ON public.vouchers;
    DROP POLICY IF EXISTS "Users can read items for viewable vouchers" ON public.voucher_items;
    DROP POLICY IF EXISTS "Employees can manage items on editable vouchers" ON public.voucher_items;
    DROP POLICY IF EXISTS "Users can read attachments for viewable vouchers" ON public.attachments;
    DROP POLICY IF EXISTS "Employees can manage attachments on editable vouchers" ON public.attachments;
    DROP POLICY IF EXISTS "View workflow history of viewable vouchers" ON public.workflow_history;
    DROP POLICY IF EXISTS "Authenticated users can record workflow history" ON public.workflow_history;
    DROP POLICY IF EXISTS "Users can view and manage their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "System/users can insert notifications" ON public.notifications;
    DROP POLICY IF EXISTS "View payments for viewable vouchers" ON public.payments;
    DROP POLICY IF EXISTS "Accounts and admins can record payments" ON public.payments;
    DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
    DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE POLICY "Users can read all profiles" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (public.get_current_role() = 'admin');

CREATE POLICY "Authenticated users can read departments" ON public.departments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL USING (public.get_current_role() = 'admin');

CREATE POLICY "Authenticated users can read designations" ON public.designations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage designations" ON public.designations FOR ALL USING (public.get_current_role() = 'admin');

CREATE POLICY "Authenticated users can read expense categories" ON public.expense_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage expense categories" ON public.expense_categories FOR ALL USING (public.get_current_role() = 'admin');

CREATE POLICY "Authenticated users can read approval rules" ON public.approval_rules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage approval rules" ON public.approval_rules FOR ALL USING (public.get_current_role() = 'admin');

CREATE POLICY "Employees can read their own vouchers" ON public.vouchers FOR SELECT 
USING (
    auth.uid() = employee_id 
    OR auth.uid() = current_approver_id 
    OR public.get_current_role() IN ('manager', 'accounts', 'admin')
);

CREATE POLICY "Employees can create vouchers" ON public.vouchers FOR INSERT WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Employees can update their own editable vouchers" ON public.vouchers FOR UPDATE 
USING (
    (auth.uid() = employee_id AND status IN ('draft', 'returned', 'rejected'))
    OR (auth.uid() = current_approver_id)
    OR (public.get_current_role() IN ('accounts', 'admin'))
);

CREATE POLICY "Users can read items for viewable vouchers" ON public.voucher_items FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.vouchers v
    WHERE v.id = voucher_items.voucher_id
    AND (
        v.employee_id = auth.uid() 
        OR v.current_approver_id = auth.uid() 
        OR public.get_current_role() IN ('manager', 'accounts', 'admin')
    )
));

CREATE POLICY "Employees can manage items on editable vouchers" ON public.voucher_items FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.vouchers v
    WHERE v.id = voucher_items.voucher_id
    AND v.employee_id = auth.uid()
    AND v.status IN ('draft', 'returned', 'rejected')
));

CREATE POLICY "Users can read attachments for viewable vouchers" ON public.attachments FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.vouchers v
    WHERE v.id = attachments.voucher_id
    AND (
        v.employee_id = auth.uid() 
        OR v.current_approver_id = auth.uid() 
        OR public.get_current_role() IN ('manager', 'accounts', 'admin')
    )
));

CREATE POLICY "Employees can manage attachments on editable vouchers" ON public.attachments FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.vouchers v
    WHERE v.id = attachments.voucher_id
    AND v.employee_id = auth.uid()
    AND v.status IN ('draft', 'returned', 'rejected')
));

CREATE POLICY "View workflow history of viewable vouchers" ON public.workflow_history FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.vouchers v
    WHERE v.id = workflow_history.voucher_id
    AND (
        v.employee_id = auth.uid() 
        OR v.current_approver_id = auth.uid() 
        OR public.get_current_role() IN ('manager', 'accounts', 'admin')
    )
));

CREATE POLICY "Authenticated users can record workflow history" ON public.workflow_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view and manage their own notifications" ON public.notifications FOR ALL USING (auth.uid() = recipient_id);
CREATE POLICY "System/users can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "View payments for viewable vouchers" ON public.payments FOR SELECT
USING (
    public.get_current_role() IN ('accounts', 'admin')
    OR EXISTS (
        SELECT 1 FROM public.vouchers v
        WHERE v.id = payments.voucher_id AND v.employee_id = auth.uid()
    )
);

CREATE POLICY "Accounts and admins can record payments" ON public.payments FOR INSERT WITH CHECK (public.get_current_role() IN ('accounts', 'admin'));

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.get_current_role() = 'admin');
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 6. SEED ESSENTIAL LOOKUPS
INSERT INTO public.expense_categories (id, name, description, icon, is_active)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Travel', 'Flights, trains, taxis, local commute', 'Plane', true),
  ('c1000000-0000-0000-0000-000000000002', 'Accommodation', 'Hotels, guest houses, lodging during official tours', 'Building2', true),
  ('c1000000-0000-0000-0000-000000000003', 'Meals', 'Business dining, team lunches, client dinners', 'Utensils', true),
  ('c1000000-0000-0000-0000-000000000004', 'Fuel', 'Petrol, diesel, EV charging, mileage reimbursement', 'Fuel', true),
  ('c1000000-0000-0000-0000-000000000005', 'Medical', 'Emergency occupational medical expenses & health checks', 'HeartPulse', true),
  ('c1000000-0000-0000-0000-000000000006', 'Office Supplies', 'Stationery, computer peripherals, workspace items', 'Briefcase', true),
  ('c1000000-0000-0000-0000-000000000007', 'Internet', 'Monthly broadband, remote work mobile bills', 'Wifi', true),
  ('c1000000-0000-0000-0000-000000000008', 'Client Meeting', 'Conferences, gifts, venue bookings, client entertainment', 'Users', true),
  ('c1000000-0000-0000-0000-000000000009', 'Other', 'Miscellaneous authorized operational expenses', 'HelpCircle', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.approval_rules (id, name, min_amount, max_amount, required_levels, description, is_active)
VALUES
  ('r1000000-0000-0000-0000-000000000001', 'Standard Tier (Under ₹10,000)', 0.00, 10000.00, ARRAY['manager', 'accounts'], 'Requires direct manager approval followed by accounts verification and payout.', true),
  ('r1000000-0000-0000-0000-000000000002', 'Mid-Value Tier (₹10,000 - ₹50,000)', 10000.01, 50000.00, ARRAY['manager', 'dept_head', 'accounts'], 'Requires reporting manager and department head approvals before accounts.', true),
  ('r1000000-0000-0000-0000-000000000003', 'High-Value Tier (Above ₹50,000)', 50000.01, NULL, ARRAY['manager', 'dept_head', 'finance', 'accounts'], 'High-value claims require manager, department head, and executive finance approval.', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.departments (id, name, code, description, budget, is_active)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Engineering', 'ENG', 'Software engineering, DevOps, and cloud infrastructure', 2500000.00, true),
  ('d1000000-0000-0000-0000-000000000002', 'Product & Design', 'PRD', 'UI/UX design, product management and user research', 1200000.00, true),
  ('d1000000-0000-0000-0000-000000000003', 'Sales & Marketing', 'S&M', 'Enterprise sales, partnerships, growth marketing', 3500000.00, true),
  ('d1000000-0000-0000-0000-000000000004', 'Finance & Accounts', 'FIN', 'Corporate finance, payroll, auditing and accounting', 1800000.00, true),
  ('d1000000-0000-0000-0000-000000000005', 'Human Resources', 'HR', 'Talent acquisition, employee welfare, workplace', 800000.00, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.designations (id, title, department_id, level)
VALUES
  ('g1000000-0000-0000-0000-000000000001', 'Senior Software Engineer', 'd1000000-0000-0000-0000-000000000001', 3),
  ('g1000000-0000-0000-0000-000000000002', 'Engineering Manager', 'd1000000-0000-0000-0000-000000000001', 5),
  ('g1000000-0000-0000-0000-000000000003', 'VP of Engineering', 'd1000000-0000-0000-0000-000000000001', 7),
  ('g1000000-0000-0000-0000-000000000004', 'Accounts Officer', 'd1000000-0000-0000-0000-000000000004', 3),
  ('g1000000-0000-0000-0000-000000000005', 'Finance Director', 'd1000000-0000-0000-0000-000000000004', 7),
  ('g1000000-0000-0000-0000-000000000006', 'System Administrator', 'd1000000-0000-0000-0000-000000000001', 4)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- Automatic profile sync trigger when auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, department_id, designation_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'employee'),
    'd1000000-0000-0000-0000-000000000001',
    'g1000000-0000-0000-0000-000000000001'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
