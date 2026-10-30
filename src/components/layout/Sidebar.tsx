import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  Clock,
  Bell,
  User,
  CheckSquare,
  Users,
  Building,
  Briefcase,
  GitFork,
  Sliders,
  Tags,
  FileSpreadsheet,
  ShieldCheck,
  CreditCard,
  History,
  FileCheck2,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const role = user.role;

  // Determine navigation items by role
  let navSections: { title?: string; items: { label: string; to: string; icon: any; badge?: string }[] }[] = [];

  if (role === 'employee') {
    navSections = [
      {
        items: [
          { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
          { label: 'New Voucher', to: '/vouchers/new', icon: PlusCircle },
          { label: 'My Vouchers', to: '/vouchers', icon: Receipt },
          { label: 'Notifications', to: '/notifications', icon: Bell },
          { label: 'Profile', to: '/profile', icon: User },
        ],
      },
    ];
  } else if (role === 'manager') {
    navSections = [
      {
        items: [
          { label: 'Dashboard', to: '/manager/dashboard', icon: LayoutDashboard },
          { label: 'Pending Approvals', to: '/manager/approvals', icon: CheckSquare },
          { label: 'Team Expenses', to: '/manager/team-expenses', icon: Users },
          { label: 'Approval History', to: '/manager/history', icon: History },
          { label: 'Notifications', to: '/notifications', icon: Bell },
          { label: 'Profile', to: '/profile', icon: User },
        ],
      },
    ];
  } else if (role === 'accounts') {
    navSections = [
      {
        items: [
          { label: 'Dashboard', to: '/accounts/dashboard', icon: LayoutDashboard },
          { label: 'Approved Vouchers', to: '/accounts/approved', icon: FileCheck2 },
          { label: 'Payment Processing', to: '/accounts/payments', icon: CreditCard },
          { label: 'Payment History', to: '/accounts/history', icon: History },
          { label: 'Reports', to: '/reports', icon: FileSpreadsheet },
          { label: 'Profile', to: '/profile', icon: User },
        ],
      },
    ];
  } else if (role === 'admin') {
    navSections = [
      {
        title: 'Overview',
        items: [
          { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'All Vouchers', to: '/admin/all-vouchers', icon: Receipt },
          { label: 'Reports', to: '/reports', icon: FileSpreadsheet },
          { label: 'Audit Logs', to: '/admin/audit-logs', icon: ShieldCheck },
        ],
      },
      {
        title: 'Organization',
        items: [
          { label: 'Employees', to: '/admin/employees', icon: Users },
          { label: 'Departments', to: '/admin/departments', icon: Building },
          { label: 'Designations', to: '/admin/designations', icon: Briefcase },
          { label: 'Employee Hierarchy', to: '/admin/hierarchy', icon: GitFork },
          { label: 'Approval Limits', to: '/admin/approval-limits', icon: Sliders },
          { label: 'Expense Categories', to: '/admin/categories', icon: Tags },
        ],
      },
    ];
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white/95 border-r border-slate-200/80 shadow-sm flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 backdrop-blur-md',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
              Smart Expense
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                PRO
              </span>
            </span>
            <span className="text-xs text-slate-400 font-medium capitalize">
              {role} Portal
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.title && (
                <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                        isActive
                          ? 'bg-indigo-50/90 text-indigo-700 font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Card & Sign Out at bottom */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-slate-200/80">
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user.full_name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user.full_name}</p>
              <p className="text-[11px] text-slate-500 truncate capitalize">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
