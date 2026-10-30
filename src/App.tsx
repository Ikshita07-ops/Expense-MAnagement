import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

// Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { EmployeeDashboard } from '@/pages/employee/EmployeeDashboard';
import { NewVoucherPage } from '@/pages/employee/NewVoucherPage';
import { MyVouchersPage } from '@/pages/employee/MyVouchersPage';
import { VoucherDetailPage } from '@/pages/vouchers/VoucherDetailPage';
import { ManagerDashboard } from '@/pages/manager/ManagerDashboard';
import { PendingApprovalsPage } from '@/pages/manager/PendingApprovalsPage';
import { TeamExpensesPage } from '@/pages/manager/TeamExpensesPage';
import { ApprovalHistoryPage } from '@/pages/manager/ApprovalHistoryPage';
import { AccountsDashboard } from '@/pages/accounts/AccountsDashboard';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminEmployeesPage } from '@/pages/admin/AdminEmployeesPage';
import { AdminDepartmentsPage } from '@/pages/admin/AdminDepartmentsPage';
import { AdminDesignationsPage } from '@/pages/admin/AdminDesignationsPage';
import { AdminHierarchyPage } from '@/pages/admin/AdminHierarchyPage';
import { AdminApprovalRulesPage } from '@/pages/admin/AdminApprovalRulesPage';
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage';
import { AllVouchersPage } from '@/pages/admin/AllVouchersPage';
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';

// Helper component to redirect root to current user's role dashboard
const RootRedirect: React.FC = () => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'manager') return <Navigate to="/manager/dashboard" replace />;
  if (role === 'accounts') return <Navigate to="/accounts/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated Application Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Root route redirects by role */}
              <Route index element={<RootRedirect />} />

              {/* Employee Routes */}
              <Route path="dashboard" element={<EmployeeDashboard />} />
              <Route path="vouchers/new" element={<NewVoucherPage />} />
              <Route path="vouchers" element={<MyVouchersPage />} />
              <Route path="vouchers/:id" element={<VoucherDetailPage />} />

              {/* Manager Routes */}
              <Route
                path="manager/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin']}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="manager/approvals"
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin']}>
                    <PendingApprovalsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="manager/team-expenses"
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin']}>
                    <TeamExpensesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="manager/history"
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin']}>
                    <ApprovalHistoryPage />
                  </ProtectedRoute>
                }
              />

              {/* Accounts Routes */}
              <Route
                path="accounts/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['accounts', 'admin']}>
                    <AccountsDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="accounts/approved"
                element={
                  <ProtectedRoute allowedRoles={['accounts', 'admin']}>
                    <AccountsDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="accounts/payments"
                element={
                  <ProtectedRoute allowedRoles={['accounts', 'admin']}>
                    <AccountsDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="accounts/history"
                element={
                  <ProtectedRoute allowedRoles={['accounts', 'admin']}>
                    <AccountsDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/employees"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminEmployeesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/departments"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDepartmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/designations"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDesignationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/hierarchy"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminHierarchyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/approval-limits"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminApprovalRulesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/categories"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminCategoriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/all-vouchers"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AllVouchersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminAuditLogsPage />
                  </ProtectedRoute>
                }
              />

              {/* Shared Authenticated Routes */}
              <Route path="reports" element={<ReportsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
