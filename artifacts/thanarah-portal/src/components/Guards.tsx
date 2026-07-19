import React, { ReactNode, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'wouter';
import { LogoSpinner } from './LogoSpinner';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <LogoSpinner size={72} />;
  }

  if (!user) return null;

  return <>{children}</>;
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user && !['admin', 'owner', 'superadmin'].includes(user.role)) {
      setLocation('/dashboard');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return null;
  if (!user || !['admin', 'owner', 'superadmin'].includes(user.role)) return null;

  return <>{children}</>;
}
