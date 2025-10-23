import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
// Secure Auth Context를 안전하게 가져오기 위한 fallback
let useAuth: any;
try {
  useAuth = require('../../contexts/SecureAuthContext').useAuth;
} catch {
  useAuth = () => ({
    isAuthenticated: false,
    user: null,
    sessionInfo: null,
    getActiveSessions: () => [],
    invalidateAllSessions: () => {},
    refreshToken: async () => false
  });
}

// 입력 검증 및 살균화
export const inputValidator = {
  // XSS 방지를 위한 HTML 태그 제거
  sanitizeHTML: (input: string): string => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  },

  // SQL 인젝션 방지를 위한 특수문자 이스케이프
  sanitizeSQL: (input: string): string => {
    return input.replace(/['";\\]/g, '\\$&');
  },

  // 이메일 검증
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  // 안전한 패스워드 검증
  validatePassword: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) errors.push('최소 8자 이상');
    if (!/[A-Z]/.test(password)) errors.push('대문자 포함');
    if (!/[a-z]/.test(password)) errors.push('소문자 포함');
    if (!/[0-9]/.test(password)) errors.push('숫자 포함');
    if (!/[!@#$%^&*]/.test(password)) errors.push('특수문자 포함');
    if (password.length > 128) errors.push('최대 128자');
    
    return { valid: errors.length === 0, errors };
  },

  // 파일 이름 검증
  validateFileName: (filename: string): boolean => {
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    const maxLength = 255;
    return !dangerousChars.test(filename) && filename.length <= maxLength;
  }
};

// 권한 관리 시스템
export const permissionManager = {
  // 역할별 권한 매트릭스
  rolePermissions: {
    app_admin: ['read', 'write', 'delete', 'admin', 'manage_users', 'system_config'],
    course_manager: ['read', 'write', 'manage_courses', 'view_reports'],
    instructor: ['read', 'write', 'manage_own_courses', 'grade_students'],
    trainee: ['read', 'view_own_data'],
    guest: ['read_public']
  } as const,

  // 권한 확인
  hasPermission: (userRole: string, permission: string): boolean => {
    const permissions = permissionManager.rolePermissions[userRole as keyof typeof permissionManager.rolePermissions];
    return permissions?.includes(permission as any) || false;
  },

  // 리소스별 접근 권한 확인
  canAccessResource: (userRole: string, resource: string, action: string): boolean => {
    const resourcePermissions = {
      courses: {
        read: ['app_admin', 'course_manager', 'instructor', 'trainee'],
        write: ['app_admin', 'course_manager', 'instructor'],
        delete: ['app_admin', 'course_manager']
      },
      users: {
        read: ['app_admin', 'course_manager'],
        write: ['app_admin'],
        delete: ['app_admin']
      },
      exams: {
        read: ['app_admin', 'course_manager', 'instructor', 'trainee'],
        write: ['app_admin', 'course_manager', 'instructor'],
        delete: ['app_admin', 'course_manager']
      }
    } as const;

    const allowedRoles = resourcePermissions[resource as keyof typeof resourcePermissions]?.[action as keyof typeof resourcePermissions.courses];
    return allowedRoles?.includes(userRole) || false;
  }
};

// 보안 감사 로그
export const securityAudit = {
  logSecurityEvent: (event: {
    type: 'login' | 'logout' | 'access_denied' | 'data_export' | 'permission_change' | 'suspicious_activity';
    userId?: string;
    resource?: string;
    details?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      ...event,
      timestamp,
      userAgent: navigator.userAgent,
      ip: 'client-side', // 서버에서 실제 IP 로깅 필요
      sessionId: sessionStorage.getItem('sessionId')
    };

    // 로컬 스토리지에 임시 저장 (실제 환경에서는 서버로 전송)
    const existingLogs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    existingLogs.push(logEntry);
    
    // 최대 1000개 항목만 유지
    if (existingLogs.length > 1000) {
      existingLogs.splice(0, existingLogs.length - 1000);
    }
    
    localStorage.setItem('securityLogs', JSON.stringify(existingLogs));

    // 중요도가 높은 이벤트는 즉시 알림
    if (event.severity === 'high' || event.severity === 'critical') {
      console.warn('Security Alert:', logEntry);
    }
  },

  getSecurityLogs: (filters?: { 
    type?: string; 
    severity?: string; 
    startDate?: Date; 
    endDate?: Date; 
  }) => {
    const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    
    if (!filters) return logs;
    
    return logs.filter((log: any) => {
      if (filters.type && log.type !== filters.type) return false;
      if (filters.severity && log.severity !== filters.severity) return false;
      if (filters.startDate && new Date(log.timestamp) < filters.startDate) return false;
      if (filters.endDate && new Date(log.timestamp) > filters.endDate) return false;
      return true;
    });
  }
};

// 세션 관리
export const sessionManager = {
  // 세션 타임아웃 설정 (30분)
  SESSION_TIMEOUT: 30 * 60 * 1000,
  
  startSession: () => {
    const sessionId = crypto.randomUUID();
    const startTime = Date.now();
    
    sessionStorage.setItem('sessionId', sessionId);
    sessionStorage.setItem('sessionStart', startTime.toString());
    sessionStorage.setItem('lastActivity', startTime.toString());
    
    securityAudit.logSecurityEvent({
      type: 'login',
      details: 'Session started',
      severity: 'low'
    });
  },

  updateActivity: () => {
    sessionStorage.setItem('lastActivity', Date.now().toString());
  },

  checkSession: (): boolean => {
    const lastActivity = sessionStorage.getItem('lastActivity');
    if (!lastActivity) return false;
    
    const timeSinceActivity = Date.now() - parseInt(lastActivity);
    return timeSinceActivity < sessionManager.SESSION_TIMEOUT;
  },

  endSession: () => {
    securityAudit.logSecurityEvent({
      type: 'logout',
      details: 'Session ended',
      severity: 'low'
    });
    
    sessionStorage.removeItem('sessionId');
    sessionStorage.removeItem('sessionStart');
    sessionStorage.removeItem('lastActivity');
  }
};

// 보안 컴포넌트들
const SecureInput: React.FC<{
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  validation?: 'email' | 'password' | 'filename';
  className?: string;
}> = ({ type = 'text', value, onChange, placeholder, validation, className = '' }) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // 기본 살균화
    const sanitizedValue = inputValidator.sanitizeHTML(newValue);
    onChange(sanitizedValue);

    // 검증
    let validationResult = { valid: true, errors: [] };
    
    if (validation === 'email') {
      validationResult.valid = inputValidator.validateEmail(sanitizedValue);
      if (!validationResult.valid) validationResult.errors = ['유효한 이메일 주소를 입력하세요'];
    } else if (validation === 'password') {
      validationResult = inputValidator.validatePassword(sanitizedValue);
    } else if (validation === 'filename') {
      validationResult.valid = inputValidator.validateFileName(sanitizedValue);
      if (!validationResult.valid) validationResult.errors = ['유효하지 않은 파일명입니다'];
    }
    
    setErrors(validationResult.errors);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type={type === 'password' && showPassword ? 'text' : type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`mobile-input w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.length > 0 ? 'border-red-500' : 'border-gray-300'
          } ${className}`}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      
      {errors.length > 0 && (
        <div className="mt-1 text-sm text-red-600">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center space-x-1">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SecurityDashboard: React.FC = () => {
  const { user } = useAuth();
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [sessionInfo, setSessionInfo] = useState({
    active: false,
    startTime: '',
    lastActivity: '',
    timeRemaining: 0
  });

  useEffect(() => {
    // 보안 로그 로드
    setSecurityLogs(securityAudit.getSecurityLogs().slice(-10));
    
    // 세션 정보 업데이트
    const updateSessionInfo = () => {
      const sessionStart = sessionStorage.getItem('sessionStart');
      const lastActivity = sessionStorage.getItem('lastActivity');
      const isActive = sessionManager.checkSession();
      
      if (sessionStart && lastActivity) {
        const remaining = sessionManager.SESSION_TIMEOUT - (Date.now() - parseInt(lastActivity));
        setSessionInfo({
          active: isActive,
          startTime: new Date(parseInt(sessionStart)).toLocaleString(),
          lastActivity: new Date(parseInt(lastActivity)).toLocaleString(),
          timeRemaining: Math.max(0, remaining)
        });
      }
    };

    updateSessionInfo();
    const interval = setInterval(updateSessionInfo, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-6">
        <ShieldCheckIcon className="h-6 w-6 text-green-500" />
        <h2 className="text-xl font-semibold">보안 대시보드</h2>
      </div>
      
      {/* 현재 세션 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <LockClosedIcon className="h-5 w-5 text-green-600" />
            <span className="font-medium">세션 상태</span>
          </div>
          <p className={`text-sm ${sessionInfo.active ? 'text-green-600' : 'text-red-600'}`}>
            {sessionInfo.active ? '활성' : '비활성'}
          </p>
          {sessionInfo.active && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              남은 시간: {Math.floor(sessionInfo.timeRemaining / 60000)}분
            </p>
          )}
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <KeyIcon className="h-5 w-5 text-blue-600" />
            <span className="font-medium">권한 레벨</span>
          </div>
          <p className="text-sm text-blue-600 capitalize">{user?.role}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {permissionManager.rolePermissions[user?.role as keyof typeof permissionManager.rolePermissions]?.length || 0}개 권한
          </p>
        </div>
      </div>
      
      {/* 최근 보안 이벤트 */}
      <div>
        <h3 className="text-lg font-medium mb-3">최근 보안 이벤트</h3>
        <div className="space-y-2">
          {securityLogs.map((log, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <ClockIcon className="h-4 w-4 text-gray-400" />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium capitalize">{log.type.replace('_', ' ')}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    log.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    log.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    log.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {log.severity}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;