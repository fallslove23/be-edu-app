import React, { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  ShieldCheckIcon, 
  ExclamationCircleIcon,
  LockClosedIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const SecureLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  const { login, loading, error } = useAuth();

  // 계정 잠금 타이머
  useEffect(() => {
    if (isLocked && lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLocked, lockoutTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) return;

    try {
      await login(email, password);
      // 성공하면 시도 횟수 초기화
      setLoginAttempts(0);
    } catch (error) {
      // 실패 시 시도 횟수 증가
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      // 5회 실패 시 계정 잠금 (30초)
      if (newAttempts >= 5) {
        setIsLocked(true);
        setLockoutTime(30);
      }
    }
  };

  const formatLockoutTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 테스트 계정 정보
  const testAccounts = [
    { email: 'admin@company.com', password: 'admin123', role: '관리자' },
    { email: 'instructor@company.com', password: 'instructor123', role: '강사' },
    { email: 'manager@company.com', password: 'manager123', role: '매니저' },
    { email: 'trainee@company.com', password: 'trainee123', role: '교육생' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center bg-blue-600 rounded-full">
            <ShieldCheckIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            BS 학습 관리 시스템
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            보안 로그인
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* 보안 상태 표시 */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center">
              <LockClosedIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="ml-2 text-sm text-green-800 dark:text-green-200">
                SSL 암호화 연결
              </span>
            </div>
          </div>

          {/* 계정 잠금 알림 */}
          {isLocked && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="ml-2 text-sm text-red-800 dark:text-red-200">
                  너무 많은 로그인 시도로 인해 계정이 일시적으로 잠겼습니다.
                  {lockoutTime > 0 && ` ${formatLockoutTime(lockoutTime)} 후 다시 시도하세요.`}
                </span>
              </div>
            </div>
          )}

          {/* 로그인 실패 경고 */}
          {loginAttempts > 0 && loginAttempts < 5 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <span className="ml-2 text-sm text-yellow-800 dark:text-yellow-200">
                  로그인 실패 {loginAttempts}/5 회. {5 - loginAttempts}번 더 실패하면 계정이 잠깁니다.
                </span>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  이메일 주소
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLocked}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="이메일을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  비밀번호
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLocked}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLocked}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLocked}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  로그인 상태 유지
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || isLocked}
                className="btn-primary"
              >
                {loading ? '로그인 중...' : isLocked ? `잠김 (${formatLockoutTime(lockoutTime)})` : '로그인'}
              </button>
            </div>
          </form>

          {/* 테스트 계정 정보 */}
          <div className="mt-8 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">테스트 계정</h3>
            <div className="space-y-2">
              {testAccounts.map((account, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 dark:text-gray-400">{account.role}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                    }}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {account.email}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureLogin;