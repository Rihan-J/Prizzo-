import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'VENDOR' | 'ADMIN';
  vendor?: {
    id: string;
    storeName: string;
    isVerified: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isVendor: boolean;
  isAdmin: boolean;
  authLoading: boolean;
  hasSeenOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: string, storeName?: string) => Promise<void>;
  logout: () => void;
  setOnboardingSeen: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    return localStorage.getItem('prizzo_onboarding') === 'true';
  });

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('prizzo_token');
    if (!token) {
      setAuthLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch (err) {
      console.error('Failed to restore session:', err);
      localStorage.removeItem('prizzo_token');
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('prizzo_token', res.data.token);
      setUser(res.data.user);
    }
  };

  const signup = async (name: string, email: string, password: string, role: string, storeName?: string) => {
    const res = await api.post('/auth/register', { name, email, password, role, storeName });
    if (res.data.token) {
      localStorage.setItem('prizzo_token', res.data.token);
      setUser(res.data.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('prizzo_token');
    setUser(null);
    window.location.href = '/login';
  };

  const setOnboardingSeen = () => {
    setHasSeenOnboarding(true);
    localStorage.setItem('prizzo_onboarding', 'true');
  };

  return (
    <AuthContext.Provider value={{
      user, 
      isLoggedIn: !!user, 
      isVendor: user?.role === 'VENDOR',
      isAdmin: user?.role === 'ADMIN',
      authLoading,
      hasSeenOnboarding, 
      login, 
      signup, 
      logout,
      setOnboardingSeen
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
