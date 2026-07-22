import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useGetCurrentUser, setAuthTokenGetter, type UserProfile } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';

const ACCESS_TOKEN_KEY  = 'thanarah_access_token';
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
  const queryClient   = useQueryClient();
  const refreshing    = useRef(false);

  const hasToken = Boolean(getStoredAccessToken());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentUser, isLoading, isError } = useGetCurrentUser({
    query: { retry: false, enabled: hasToken } as any,
  });

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      return;
    }
    if (isLoading) return;

    // Not loading, no user, but we had a token → might be expired → try refresh
    if (isError && hasToken && !refreshing.current) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        clearTokens();
        setUser(null);
        return;
      }

      refreshing.current = true;

      // Derive API base: same origin in dev (Vite proxy), BASE_URL prefix otherwise
      const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
      fetch(`${base}/api/auth/refresh`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refreshToken }),
      })
        .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((data: { accessToken?: string; refreshToken?: string }) => {
          if (data.accessToken && data.refreshToken) {
            storeTokens(data.accessToken, data.refreshToken);
            // Invalidate all queries so /api/auth/me retries with new token
            queryClient.invalidateQueries();
          } else {
            throw new Error('No tokens in refresh response');
          }
        })
        .catch(() => {
          clearTokens();
          setUser(null);
          setLocation('/login');
        })
        .finally(() => {
          refreshing.current = false;
        });
    } else if (!isLoading && !currentUser) {
      setUser(null);
    }
  }, [currentUser, isLoading, isError, hasToken, queryClient, setLocation]);

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
