'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserSummary } from '@lpms/types';
import { authApi } from './api/auth';

interface MfaPendingState {
  sessionToken: string;
  email: string;
}

interface AuthContextType {
  user: UserSummary | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaPending: MfaPendingState | null;
  setMfaPending: (pending: MfaPendingState | null) => void;
  setUser: (user: UserSummary | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mfaPending, setMfaPending] = useState<MfaPendingState | null>(null);

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Thử lấy thông tin người dùng ban đầu
    refreshUser();
  }, []);

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setMfaPending(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        mfaPending,
        setMfaPending,
        setUser,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
