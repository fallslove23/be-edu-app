import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthState, User, UserRole } from '../types/auth.types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void; // 테스트용
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null
  });

  // 테스트용 - 실제로는 localStorage나 API에서 가져올 것
  useEffect(() => {
    const savedUser = localStorage.getItem('bs_learning_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        user
      }));
    } else {
      // 기본적으로 관리자로 설정 (테스트용)
      const defaultUser: User = {
        id: '1',
        name: '관리자',
        email: 'admin@company.com',
        role: 'admin',
        department: 'IT팀',
        created_at: new Date().toISOString()
      };
      
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: defaultUser
      }));
      localStorage.setItem('bs_learning_user', JSON.stringify(defaultUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // 실제로는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data
      const mockUser: User = {
        id: '1',
        name: email === 'trainee@test.com' ? '김교육' : '관리자',
        email,
        role: email === 'trainee@test.com' ? 'trainee' : 'admin',
        department: email === 'trainee@test.com' ? '영업팀' : 'IT팀',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };

      setAuthState({
        isAuthenticated: true,
        user: mockUser,
        loading: false,
        error: null
      });

      localStorage.setItem('bs_learning_user', JSON.stringify(mockUser));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: '로그인에 실패했습니다.'
      }));
    }
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null
    });
    localStorage.removeItem('bs_learning_user');
  };

  // 테스트용 역할 전환 함수
  const switchRole = (role: UserRole) => {
    if (authState.user) {
      const updatedUser: User = {
        ...authState.user,
        role,
        name: role === 'admin' ? '관리자' : role === 'instructor' ? '강사' : '교육생',
        department: role === 'trainee' ? '영업팀' : 'IT팀'
      };

      setAuthState(prev => ({
        ...prev,
        user: updatedUser
      }));

      localStorage.setItem('bs_learning_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};