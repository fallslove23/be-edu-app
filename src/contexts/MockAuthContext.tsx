import React, { createContext, useContext, useState } from 'react';
import type { User, UserRole } from '../types/auth.types';

interface MockAuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  sessionInfo: any | null;
}

interface MockAuthContextType extends MockAuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  invalidateAllSessions: () => void;
  getActiveSessions: () => any[];
  switchRole: (role: UserRole) => void;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a SecureAuthProvider');
  }
  return context;
};

interface MockAuthProviderProps {
  children: React.ReactNode;
}

export const SecureAuthProvider: React.FC<MockAuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<MockAuthState>({
    isAuthenticated: true, // 개발 모드에서는 항상 인증된 상태
    user: {
      id: 'mock-user-1',
      name: '관리자',
      email: 'admin@bs-learning.com',
      phone: '010-1234-5678',
      employee_id: 'EMP001',
      role: 'admin',
      department: 'IT팀',
      position: '시스템 관리자',
      hire_date: '2024-01-01',
      status: 'active',
      avatar: '',
      permissions: ['admin'],
      last_login: '2024-08-21',
      created_at: '2024-01-01',
      updated_at: '2024-08-21'
    },
    token: 'mock-token',
    loading: false,
    error: null,
    sessionInfo: {
      sessionId: 'mock-session',
      createdAt: new Date(),
      ipAddress: '127.0.0.1'
    }
  });

  const login = async (email: string, password: string) => {
    // Mock login - 개발 모드에서는 항상 성공
    setAuthState(prev => ({
      ...prev,
      isAuthenticated: true,
      loading: false,
      error: null
    }));
  };

  const logout = () => {
    setAuthState(prev => ({
      ...prev,
      isAuthenticated: false,
      user: null,
      token: null
    }));
  };

  const refreshToken = async () => {
    return true; // 개발 모드에서는 항상 성공
  };

  const invalidateAllSessions = () => {
    // Mock implementation
  };

  const getActiveSessions = () => {
    return []; // Mock implementation
  };

  const switchRole = (role: UserRole) => {
    if (authState.user) {
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, role } : null
      }));
    }
  };

  const contextValue: MockAuthContextType = {
    ...authState,
    login,
    logout,
    refreshToken,
    invalidateAllSessions,
    getActiveSessions,
    switchRole
  };

  return (
    <MockAuthContext.Provider value={contextValue}>
      {children}
    </MockAuthContext.Provider>
  );
};