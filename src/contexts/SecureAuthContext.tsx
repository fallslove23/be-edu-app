import React, { createContext, useContext, useState, useEffect } from 'react';
import { securityManager, TokenPayload } from '../utils/security';
import type { User, UserRole } from '../types/auth.types';

interface SecureAuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  sessionInfo: any | null;
}

interface SecureAuthContextType extends SecureAuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  invalidateAllSessions: () => void;
  getActiveSessions: () => any[];
  switchRole: (role: UserRole) => void;
}

const SecureAuthContext = createContext<SecureAuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(SecureAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a SecureAuthProvider');
  }
  return context;
};

interface SecureAuthProviderProps {
  children: React.ReactNode;
}

export const SecureAuthProvider: React.FC<SecureAuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<SecureAuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null,
    sessionInfo: null
  });

  // 초기화 시 토큰 검증
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('bs_auth_token');
      
      if (savedToken) {
        const payload = securityManager.verifyToken(savedToken);
        
        if (payload) {
          const user = await getUserFromPayload(payload);
          const sessionInfo = securityManager.getSessionInfo(payload.sessionId);
          
          setAuthState({
            isAuthenticated: true,
            user,
            token: savedToken,
            loading: false,
            error: null,
            sessionInfo
          });

          securityManager.logSecurityEvent('session_restored', {
            userId: payload.userId,
            sessionId: payload.sessionId
          });
        } else {
          // 토큰이 유효하지 않음
          localStorage.removeItem('bs_auth_token');
          setAuthState(prev => ({ ...prev, loading: false }));
          
          securityManager.logSecurityEvent('invalid_token_detected', {
            token: savedToken.substring(0, 20) + '...'
          });
        }
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    initAuth();
  }, []);

  // 토큰 자동 새로고침
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.token) return;

    const checkTokenRefresh = () => {
      if (securityManager.shouldRefreshToken(authState.token!)) {
        refreshToken();
      }
    };

    const interval = setInterval(checkTokenRefresh, 5 * 60 * 1000); // 5분마다 체크
    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.token]);

  const login = async (email: string, password: string): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // 실제로는 서버 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 비밀번호 검증 (실제로는 서버에서 처리)
      const isValidLogin = await validateCredentials(email, password);
      
      if (!isValidLogin) {
        securityManager.logSecurityEvent('failed_login_attempt', {
          email,
          timestamp: new Date().toISOString(),
          ip: 'localhost'
        });
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
      }

      // 사용자 정보 가져오기 (Mock)
      const user = await getUserByEmail(email);
      
      // JWT 토큰 생성
      const token = securityManager.generateToken(user.id, user.email, user.role);
      
      setAuthState({
        isAuthenticated: true,
        user,
        token,
        loading: false,
        error: null,
        sessionInfo: securityManager.getSessionInfo(securityManager.verifyToken(token)!.sessionId)
      });

      // 토큰 저장
      localStorage.setItem('bs_auth_token', token);
      
      securityManager.logSecurityEvent('successful_login', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '로그인에 실패했습니다.'
      }));
    }
  };

  const logout = () => {
    if (authState.token && authState.user) {
      const payload = securityManager.verifyToken(authState.token);
      if (payload) {
        securityManager.invalidateSession(payload.sessionId);
        securityManager.logSecurityEvent('user_logout', {
          userId: authState.user.id,
          sessionId: payload.sessionId
        });
      }
    }

    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,
      sessionInfo: null
    });
    
    localStorage.removeItem('bs_auth_token');
  };

  const refreshToken = async (): Promise<boolean> => {
    if (!authState.token || !authState.user) return false;

    try {
      const newToken = securityManager.refreshToken(
        authState.token,
        authState.user.email,
        authState.user.role
      );

      if (newToken) {
        const payload = securityManager.verifyToken(newToken)!;
        const sessionInfo = securityManager.getSessionInfo(payload.sessionId);
        
        setAuthState(prev => ({
          ...prev,
          token: newToken,
          sessionInfo
        }));

        localStorage.setItem('bs_auth_token', newToken);
        
        securityManager.logSecurityEvent('token_refreshed', {
          userId: authState.user.id
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error('토큰 새로고침 실패:', error);
      logout();
      return false;
    }
  };

  const invalidateAllSessions = () => {
    if (authState.user) {
      securityManager.invalidateAllSessions(authState.user.id);
      securityManager.logSecurityEvent('all_sessions_invalidated', {
        userId: authState.user.id
      });
      logout();
    }
  };

  const getActiveSessions = () => {
    return authState.user ? securityManager.getActiveSessions(authState.user.id) : [];
  };

  // 테스트용 역할 전환 함수
  const switchRole = (role: UserRole) => {
    if (authState.user && authState.token) {
      const updatedUser: User = {
        ...authState.user,
        role,
        name: role === 'admin' ? '관리자' : role === 'instructor' ? '강사' : '교육생',
        department: role === 'trainee' ? '영업팀' : 'IT팀'
      };

      // 새 토큰 생성
      const newToken = securityManager.generateToken(updatedUser.id, updatedUser.email, updatedUser.role);
      const payload = securityManager.verifyToken(newToken)!;
      const sessionInfo = securityManager.getSessionInfo(payload.sessionId);

      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
        token: newToken,
        sessionInfo
      }));

      localStorage.setItem('bs_auth_token', newToken);
      
      securityManager.logSecurityEvent('role_switched', {
        userId: updatedUser.id,
        newRole: role,
        previousRole: authState.user.role
      });
    }
  };

  return (
    <SecureAuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        refreshToken,
        invalidateAllSessions,
        getActiveSessions,
        switchRole
      }}
    >
      {children}
    </SecureAuthContext.Provider>
  );
};

// Mock 함수들 (실제로는 API 호출)
async function validateCredentials(email: string, password: string): Promise<boolean> {
  // 실제로는 서버에서 해시된 비밀번호와 비교
  const validCredentials = [
    { email: 'admin@company.com', password: 'admin123' },
    { email: 'instructor@company.com', password: 'instructor123' },
    { email: 'trainee@company.com', password: 'trainee123' },
    { email: 'manager@company.com', password: 'manager123' }
  ];

  return validCredentials.some(cred => 
    cred.email === email && cred.password === password
  );
}

async function getUserByEmail(email: string): Promise<User> {
  const userMap: Record<string, User> = {
    'admin@company.com': {
      id: 'admin1',
      name: '관리자',
      email: 'admin@company.com',
      phone: '010-0000-0000',
      employee_id: 'EMP001',
      role: 'admin',
      department: 'IT팀',
      position: '관리자',
      hire_date: new Date().toISOString(),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    'instructor@company.com': {
      id: 'instructor1',
      name: '김강사',
      email: 'instructor@company.com',
      phone: '010-1111-1111',
      employee_id: 'EMP002',
      role: 'instructor',
      department: '교육팀',
      position: '강사',
      hire_date: new Date().toISOString(),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    'trainee@company.com': {
      id: 'trainee1',
      name: '이교육생',
      email: 'trainee@company.com',
      phone: '010-2222-2222',
      employee_id: 'EMP003',
      role: 'trainee',
      department: '영업팀',
      position: '교육생',
      hire_date: new Date().toISOString(),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    'manager@company.com': {
      id: 'manager1',
      name: '박매니저',
      email: 'manager@company.com',
      phone: '010-3333-3333',
      employee_id: 'EMP004',
      role: 'manager',
      department: '인사팀',
      position: '매니저',
      hire_date: new Date().toISOString(),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  };

  return userMap[email] || userMap['trainee@company.com'];
}

async function getUserFromPayload(payload: TokenPayload): Promise<User> {
  // 실제로는 서버에서 사용자 정보 조회
  return {
    id: payload.userId,
    name: '사용자',
    email: payload.email,
    phone: '010-0000-0000',
    employee_id: 'EMP000',
    role: payload.role as UserRole,
    department: payload.role === 'trainee' ? '영업팀' : 'IT팀',
    position: payload.role,
    hire_date: new Date().toISOString(),
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}