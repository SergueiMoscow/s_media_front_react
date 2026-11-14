import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { clearTokens, getAccessToken, setTokens } from '../api/client';
import { loginRequest } from '../api';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getAccessToken()));

  const login = useCallback(async (username: string, password: string) => {
    const { access, refresh } = await loginRequest(username, password);
    setTokens(access, refresh);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, login, logout }),
    [isAuthenticated, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
