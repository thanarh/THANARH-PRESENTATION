import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useGetCurrentUser } from '@workspace/api-client-react';
import { UserProfile } from '@workspace/api-client-react/src/generated/api.schemas';
import { useLocation } from 'wouter';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (user: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [_, setLocation] = useLocation();

  const { data: currentUser, isLoading } = useGetCurrentUser({
    query: {
      retry: false,
    }
  });

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    } else if (!isLoading) {
      setUser(null);
    }
  }, [currentUser, isLoading]);

  const login = (newUser: UserProfile) => {
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
    setLocation('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
