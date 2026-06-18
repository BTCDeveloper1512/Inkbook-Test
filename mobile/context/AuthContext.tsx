import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, clearToken, saveToken } from '@/lib/api';
import { Platform } from 'react-native';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'studio_owner' | 'admin';
  avatar?: string;
}

interface AuthContextType {
  user: User | null | undefined;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string, role: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiGet<User>('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await apiPost<User>('/auth/login', { email, password });
    setUser(data);
    return data;
  };

  const register = async (email: string, password: string, name: string, role: string): Promise<User> => {
    const data = await apiPost<User>('/auth/register', { email, password, name, role });
    setUser(data);
    return data;
  };

  const logout = async () => {
    try {
      await apiPost('/auth/logout');
    } catch {}
    await clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
