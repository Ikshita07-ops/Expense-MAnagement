import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Role } from '@/types';
import { api } from '@/services/api';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: (role: Role) => Promise<void>;
  logout: () => Promise<void>;
  updateCurrentUser: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_STORAGE_KEY = 'smartexpense_active_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize active session on mount
  useEffect(() => {
    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) {
            const profile = await api.getProfileByEmail(session.user.email);
            if (profile) {
              setUser(profile);
              setIsLoading(false);
              return;
            }
          }
        }

        // Check local storage session
        const stored = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as UserProfile;
          // Refresh from api profiles
          const fresh = await api.getProfileById(parsed.id);
          if (fresh && fresh.is_active) {
            setUser(fresh);
          } else {
            localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
          }
        } else {
          // Default to employee for immediate exploration if not logged in
          const defaultEmp = await api.getProfileByEmail('employee@smartexpense.io');
          if (defaultEmp) {
            setUser(defaultEmp);
            localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(defaultEmp));
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase && password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
      }

      // Check profile in database
      const profile = await api.getProfileByEmail(email);
      if (!profile) {
        setIsLoading(false);
        return { success: false, error: 'No employee account found with this email address.' };
      }

      if (!profile.is_active) {
        setIsLoading(false);
        return { success: false, error: 'This employee account has been deactivated. Contact Admin.' };
      }

      setUser(profile);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(profile));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'Authentication failed. Please try again.' };
    }
  };

  const loginAsDemo = async (role: Role) => {
    setIsLoading(true);
    const emailMap: Record<Role, string> = {
      employee: 'employee@smartexpense.io',
      manager: 'manager@smartexpense.io',
      accounts: 'accounts@smartexpense.io',
      admin: 'admin@smartexpense.io',
    };

    const targetEmail = emailMap[role];
    const profile = await api.getProfileByEmail(targetEmail);
    if (profile) {
      setUser(profile);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(profile));
    }
    setIsLoading(false);
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  };

  const updateCurrentUser = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = await api.updateProfile(user.id, updates);
    setUser(updated);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginAsDemo,
        logout,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
