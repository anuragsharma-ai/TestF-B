import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOtp: (email: string) => Promise<boolean>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = sessionStorage.getItem('auth_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setIsLoading(false);
  }, []);

  const sendOtp = useCallback(async (email: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 800));
    return !!mockUsers[email];
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 1000));
    if (otp === '123456' && mockUsers[email]) {
      const u = mockUsers[email];
      setUser(u);
      sessionStorage.setItem('auth_user', JSON.stringify(u));
      sessionStorage.setItem('auth_token', 'mock-jwt-token');
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_token');
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    const emails: Record<UserRole, string> = {
      super_admin: 'admin@bank.com',
      location_admin: 'branch@bank.com',
      employee: 'employee@bank.com',
      third_party: 'operator@vendor.com',
    };
    const u = mockUsers[emails[role]];
    if (u) {
      setUser(u);
      sessionStorage.setItem('auth_user', JSON.stringify(u));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, sendOtp, verifyOtp, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
