-- ====================================================================
-- SMART EXPENSE: Comprehensive Seed Data
-- ====================================================================

-- 1. EXPENSE CATEGORIES
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
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 2. APPROVAL RULES (Configurable Monetary Thresholds)
INSERT INTO public.approval_rules (id, name, min_amount, max_amount, required_levels, description, is_active)
VALUES
  ('r1000000-0000-0000-0000-000000000001', 'Standard Tier (Under ₹10,000)', 0.00, 10000.00, ARRAY['manager', 'accounts'], 'Requires direct manager approval followed by accounts verification and payout.', true),
  ('r1000000-0000-0000-0000-000000000002', 'Mid-Value Tier (₹10,000 - ₹50,000)', 10000.01, 50000.00, ARRAY['manager', 'dept_head', 'accounts'], 'Requires reporting manager and department head approvals before accounts.', true),
  ('r1000000-0000-0000-0000-000000000003', 'High-Value Tier (Above ₹50,000)', 50000.01, NULL, ARRAY['manager', 'dept_head', 'finance', 'accounts'], 'High-value claims require manager, department head, and executive finance approval.', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, min_amount = EXCLUDED.min_amount, max_amount = EXCLUDED.max_amount, required_levels = EXCLUDED.required_levels;

-- 3. DEPARTMENTS
INSERT INTO public.departments (id, name, code, description, budget, is_active)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Engineering', 'ENG', 'Software engineering, DevOps, and cloud infrastructure', 2500000.00, true),
  ('d1000000-0000-0000-0000-000000000002', 'Product & Design', 'PRD', 'UI/UX design, product management and user research', 1200000.00, true),
  ('d1000000-0000-0000-0000-000000000003', 'Sales & Marketing', 'S&M', 'Enterprise sales, partnerships, growth marketing', 3500000.00, true),
  ('d1000000-0000-0000-0000-000000000004', 'Finance & Accounts', 'FIN', 'Corporate finance, payroll, auditing and accounting', 1800000.00, true),
  ('d1000000-0000-0000-0000-000000000005', 'Human Resources', 'HR', 'Talent acquisition, employee welfare, workplace', 800000.00, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 4. DESIGNATIONS
INSERT INTO public.designations (id, title, department_id, level)
VALUES
  ('g1000000-0000-0000-0000-000000000001', 'Senior Software Engineer', 'd1000000-0000-0000-0000-000000000001', 3),
  ('g1000000-0000-0000-0000-000000000002', 'Engineering Manager', 'd1000000-0000-0000-0000-000000000001', 5),
  ('g1000000-0000-0000-0000-000000000003', 'VP of Engineering', 'd1000000-0000-0000-0000-000000000001', 7),
  ('g1000000-0000-0000-0000-000000000004', 'Accounts Officer', 'd1000000-0000-0000-0000-000000000004', 3),
  ('g1000000-0000-0000-0000-000000000005', 'Finance Director', 'd1000000-0000-0000-0000-000000000004', 7),
  ('g1000000-0000-0000-0000-000000000006', 'Chief Executive Officer', NULL, 10),
  ('g1000000-0000-0000-0000-000000000007', 'System Administrator', 'd1000000-0000-0000-0000-000000000001', 4)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;
