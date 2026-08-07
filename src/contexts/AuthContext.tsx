import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, type ApiSession, type ApiUser } from '@/lib/api';

export type AppRole = 'dev' | 'admin' | 'gate' | 'office';

interface AuthContextType {
  user: ApiUser | null;
  session: ApiSession | null;
  userRole: AppRole | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [session, setSession] = useState<ApiSession | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      if (!api.token) {
        setLoading(false);
        return;
      }

      try {
        const session = await api.me();
        setSession(session);
        setUser(session.user);
        setUserRole(session.user.role || 'gate');
      } catch {
        api.setToken(null);
        setSession(null);
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const session = await api.login(username, password);
      setSession(session);
      setUser(session.user);
      setUserRole(session.user.role || 'gate');
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Erro ao autenticar' };
    }
  };

  const signOut = async () => {
    await api.logout();
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
