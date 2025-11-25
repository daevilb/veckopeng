import React, { createContext, useContext, useEffect, useState } from 'react';
import { securedFetch } from '../services/securedApi';

type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  familyKey: string | null;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('unknown');
  const [familyKey, setFamilyKey] = useState<string | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('veckopeng.familyKey');
    if (!storedKey) {
      setStatus('unauthenticated');
      return;
    }

    setFamilyKey(storedKey);
    setStatus('authenticated');
  }, []);

  const login = async (key: string): Promise<boolean> => {
    try {
      localStorage.setItem('veckopeng.familyKey', key);
      setFamilyKey(key);

      // Validate against backend (public health but with header)
      await securedFetch('/api/health');

      setStatus('authenticated');
      return true;
    } catch (err) {
      console.error('Failed to validate family key', err);
      localStorage.removeItem('veckopeng.familyKey');
      setFamilyKey(null);
      setStatus('unauthenticated');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('veckopeng.familyKey');
    setFamilyKey(null);
    setStatus('unauthenticated');
  };

  return (
    <AuthContext.Provider value={{ status, familyKey, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
