import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthState, User, UserRole } from '../types/auth.types';
import { AuthService } from '@/services/auth.service';

interface AuthContextType extends AuthState {
  login: (employeeId: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void; // 테스트용
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null
  });

  // 저장된 사용자 정보 복원
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') {
      setAuthState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          user,
          loading: false
        }));
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Auth 초기화 오류:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: null // 에러 메시지 제거 (초기화 실패는 정상적인 상황)
      }));
    }
  }, []);

  const login = async (employeeId: string, password: string): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // AuthService를 사용한 실제 인증
      const result = await AuthService.loginWithEmployeeId(employeeId, password);

      if (!result) {
        throw new Error('사번 또는 비밀번호가 올바르지 않습니다.');
      }

      const { user, firstLogin } = result;

      setAuthState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null
      });

      // 로컬 스토리지에 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(user));
      }

      // 최초 로그인인 경우 비밀번호 변경 페이지로 리다이렉트
      if (firstLogin) {
        router.push('/change-password');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('로그인 실패:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '로그인에 실패했습니다.'
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      });
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 사용자 정보 업데이트
  const updateUser = (user: User) => {
    setAuthState(prev => ({
      ...prev,
      user
    }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  };

  // 테스트용 역할 전환 함수
  const switchRole = (role: UserRole) => {
    if (authState.user) {
      const updatedUser: User = {
        ...authState.user,
        role,
        name: role === 'admin' ? '관리자' : role === 'instructor' ? '강사' : '교육생',
        department: role === 'trainee' ? '영업팀' : 'IT팀',
        position: role === 'admin' ? '관리자' : role === 'instructor' ? '강사' : '사원',
        updated_at: new Date().toISOString()
      };

      setAuthState(prev => ({
        ...prev,
        user: updatedUser
      }));

      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    switchRole,
    updateUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
