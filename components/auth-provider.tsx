'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UsuarioAuth } from '@/lib/models';
import type { Rol } from '@/lib/constants';
import { AuthRepository } from '@/lib/repositories';
import { api } from '@/lib/api-client';

interface AuthContextValue {
  user: UsuarioAuth | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (...roles: Rol[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioAuth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedAuth = api.getStoredAuth();
        if (storedAuth && storedAuth.user) {
          setUser(storedAuth.user as UsuarioAuth);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const u = await AuthRepository.login(email, password);
    if (u) {
      setUser(u);
      return true;
    }
    return false;
  };

  const logout = async (): Promise<void> => {
    await api.logout();
    setUser(null);
  };

  const hasRole = (...roles: Rol[]): boolean => {
    if (!user) return false;
    return roles.includes(user.rol);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
