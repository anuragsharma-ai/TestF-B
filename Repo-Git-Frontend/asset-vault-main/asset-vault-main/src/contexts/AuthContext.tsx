import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { API_ENDPOINTS } from '@/config/api';
import api, { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, clearAuthTokens, setAuthTokens } from '@/services/api';

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
    try {
      await api.post(API_ENDPOINTS.auth.sendOtp, { email });
      return true;
    } catch {
      return false;
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string): Promise<boolean> => {
    try {
      const { data } = await api.post(API_ENDPOINTS.auth.verifyOtp, { email, otp });
      const { access, refresh, user: rawUser } = data as any;
      const userPayload: User = {
        id: String(rawUser.id),
        email: rawUser.email,
        name: rawUser.first_name || rawUser.username || rawUser.email,
        role: rawUser.role,
        locationId: rawUser.locationId,
        locationName: rawUser.locationName,
        avatar: undefined,
        assignedLocationIds: rawUser.assignedLocationIds,
      };
      setAuthTokens(access, refresh);
      setUser(userPayload);
      sessionStorage.setItem('auth_user', JSON.stringify(userPayload));
      return true;
    } catch {
      clearAuthTokens();
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('auth_user');
    clearAuthTokens();
    // Best-effort server-side logout
    api.post(API_ENDPOINTS.auth.logout).catch(() => {});
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    // Role switching is only for demo; it re-calls the backend using
    // the mapped demo emails.
    const emails: Record<UserRole, string> = {
      super_admin: 'admin@bank.com',
      location_admin: 'branch@bank.com',
      employee: 'employee@bank.com',
      third_party: 'operator@vendor.com',
    };
    const email = emails[role];
    if (!email) return;

    // Re-login with demo OTP flow
    (async () => {
      try {
        await api.post(API_ENDPOINTS.auth.sendOtp, { email });
        const { data } = await api.post(API_ENDPOINTS.auth.verifyOtp, { email, otp: '123456' });
        const { access, refresh, user: rawUser } = data as any;
        const userPayload: User = {
          id: String(rawUser.id),
          email: rawUser.email,
          name: rawUser.first_name || rawUser.username || rawUser.email,
          role: rawUser.role,
          locationId: rawUser.locationId,
          locationName: rawUser.locationName,
          avatar: undefined,
          assignedLocationIds: rawUser.assignedLocationIds,
        };
        setAuthTokens(access, refresh);
        setUser(userPayload);
        sessionStorage.setItem('auth_user', JSON.stringify(userPayload));
      } catch {
        // ignore errors in demo role switch
      }
    })();
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
