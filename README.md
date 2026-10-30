# Smart Expense — Enterprise Employee Expense Management System

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://vercel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Postgres-3ECF8E?logo=supabase)](https://supabase.com)

**Smart Expense** is a modern, enterprise-grade Financial SaaS application designed to streamline employee expense claims, enforce dynamic multi-level approval hierarchies based on monetary thresholds, and automate accounts reimbursement workflows with complete audit compliance.

---

## 🌟 Key Features

### 1. Modern Login & Role-Based Access Control
- Recreated login page layout matching enterprise financial software standards.
- Supports email/password authentication via Supabase Auth.
- **1-Click Demo Account Switcher** for instant testing of all four roles:
  - **Administrator:** Full governance over organizational hierarchy, approval rules, expense categories, and audit logs.
  - **Engineering Manager:** Multi-level approval queue, voucher review, returning for correction, and rejections with mandatory reasoning.
  - **Accounts Officer:** Verification of approved claims, external disbursement tracking (NEFT/UPI/Bank Transfer), and financial reports.
  - **Employee:** Intuitive voucher builder, multi-item claims in INR (₹), receipt attachment (PDF/images), and live workflow timeline.

### 2. Dynamic Monetary Approval Workflow Engine
Configurable multi-level approval pipeline based on voucher total value:
- **Tier 1 (Up to ₹10,000):** Employee &rarr; Reporting Manager &rarr; Accounts Disbursement
- **Tier 2 (₹10,001 – ₹50,000):** Employee &rarr; Reporting Manager &rarr; Department Head (VP) &rarr; Accounts Disbursement
- **Tier 3 (Above ₹50,000):** Employee &rarr; Reporting Manager &rarr; Department Head (VP) &rarr; Finance Director &rarr; Accounts Disbursement

### 3. Vouchers & Receipt Management
- Add/Remove multiple expense items per voucher with automatic INR (₹) total calculation.
- Support for PDF, PNG, JPG, and JPEG receipt uploads.
- Built-in document and image viewer.
- Full state management: `Draft`, `Pending Manager`, `Pending Dept Head`, `Pending Finance`, `Approved`, `Returned for Correction`, `Rejected`, `Paid`.

### 4. Interactive Reports & MIS Export
- Management Information System (MIS) reports, Department spending, Employee reimbursements, and Overdue approval exception reports.
- **1-Click Excel Export (.xlsx)** using SheetJS.
- **1-Click PDF Export (.pdf)** using jsPDF and AutoTable.
- Printable report view.

### 5. In-App Notification Center & Audit Trail
- Real-time and polled notification alerts with unread badge counters.
- Comprehensive immutable audit trail logging actor, action, timestamp, entity type, and metadata.

---

## 👥 Demo Accounts

You can test each role directly from the Login page using the **1-Click Quick Sign-In** buttons or manually enter the credentials below:

| Role | Email | Password | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@smartexpense.io` | `Admin@12345` | Org hierarchy, approval limits, categories, audit logs |
| **Manager** | `manager@smartexpense.io` | `Manager@12345` | Review team claims, approve, return, or reject |
| **Accounts Officer** | `accounts@smartexpense.io` | `Accounts@12345` | Review receipts, record NEFT/UPI payment reference |
| **Employee** | `employee@smartexpense.io` | `Employee@12345` | Submit vouchers, attach receipts, track approval timeline |

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Lucide React icons, Framer Motion, Recharts, Canvas Confetti
- **Backend & Database:** Supabase Authentication, PostgreSQL, Row Level Security (RLS), Supabase Storage
- **Export Engines:** SheetJS (`xlsx`) for Excel reports, `jspdf` & `jspdf-autotable` for PDF generation
- **Deployment:** Exclusively deployed to **Vercel** with client-side SPA routing (`vercel.json`)

---

## ⚡ Quick Start & Local Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/smart-expense.git
cd smart-expense
pnpm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory (refer to `.env.example`):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
*(Note: If Supabase credentials are not provided, the application automatically runs in a self-contained local storage demo mode with pre-seeded data, allowing full testing of all workflows).*

### 3. Run Development Server
```bash
pnpm dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
```bash
pnpm build
```

---

## 🗄️ Supabase Database Setup

To link your remote Supabase instance:
1. Log in to your [Supabase Dashboard](https://supabase.com).
2. Create a new PostgreSQL project.
3. Open the **SQL Editor** tab.
4. Copy the entire contents of [`supabase/setup.sql`](./supabase/setup.sql) and click **RUN**.
   - This sets up all 13 relational tables (`profiles`, `departments`, `designations`, `expense_categories`, `vouchers`, `voucher_items`, `attachments`, `approval_rules`, `workflow_history`, `notifications`, `payments`, `audit_logs`).
   - Configures granular Row Level Security (RLS) policies for each role.
   - Creates the private `receipts` storage bucket.
   - Seeds initial departments, designations, expense categories, and monetary approval rules.
5. In your Supabase Project Settings &rarr; **API**, copy the **Project URL** and **Anon public API key** and paste them into your `.env` or Vercel Environment Variables.

---

## 🚀 Vercel Deployment Instructions

1. Push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "feat: complete Smart Expense application"
   git push origin main
   ```
2. In [Vercel](https://vercel.com), click **Add New...** &rarr; **Project** and import your GitHub repository.
3. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Ensure the Build Command is `pnpm build` and Output Directory is `dist`.
5. Click **Deploy**. Vercel will build and deploy the production application with HTTPS.

---

## 📄 License
MIT © Smart Expense Inc. All rights reserved.
