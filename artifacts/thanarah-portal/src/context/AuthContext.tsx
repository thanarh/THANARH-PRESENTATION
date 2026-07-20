import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useGetCurrentUser, setAuthTokenGetter, type UserProfile } from '@workspace/api-client-react';
import { useLocation } from 'wouter';

const ACCESS_TOKEN_KEY = 'thanarah_access_token';
const REFRESH_TOKEN_KEY = 'thanarah_refresh_token';

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function storeTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Register the token getter once so every API call includes Authorization: Bearer
setAuthTokenGetter(getStoredAccessToken);

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (user: UserProfile, tokens: { accessToken: string; refreshToken: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [_, setLocation] = useLocation();

  // Only attempt /api/auth/me when a token is present
  const hasToken = Boolean(getStoredAccessToken());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentUser, isLoading } = useGetCurrentUser({
    query: { retry: false, enabled: hasToken } as any,
  });

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    } else if (!isLoading) {
      setUser(null);
    }
  }, [currentUser, isLoading]);

  const login = (newUser: UserProfile, tokens: { accessToken: string; refreshToken: string }) => {
    storeTokens(tokens.accessToken, tokens.refreshToken);
    setUser(newUser);
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    setLocation('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading: hasToken ? isLoading : false, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
