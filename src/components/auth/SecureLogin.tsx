import React, { useState, useEffect } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
  LockClosedIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const SecureLogin: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  const { login, loading, error } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
      await login(employeeId, password);
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



  return (

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-black py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors z-50"
        title={`테마 변경 (${theme === 'light' ? '라이트' : theme === 'dark' ? '다크' : '시스템 설정'})`}
      >
        {theme === 'light' ? (
          <SunIcon className="w-6 h-6" />
        ) : theme === 'dark' ? (
          <MoonIcon className="w-6 h-6" />
        ) : (
          <ComputerDesktopIcon className="w-6 h-6" />
        )}
      </button>

      <div className="max-w-md w-full space-y-8 relative z-10 bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl border border-white/50 dark:border-gray-700 p-8 rounded-3xl shadow-2xl">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 transform rotate-3 hover:rotate-0 transition-all duration-300">
            <ShieldCheckIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            BS/SS 학습 관리 시스템
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
            Secure Access Portal
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* 보안 상태 표시 */}
          <div className="bg-green-500/10 dark:bg-green-900/20 p-4 rounded-xl border border-green-200/50 dark:border-green-800/50 backdrop-blur-sm">
            <div className="flex items-center justify-center">
              <LockClosedIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="ml-2 text-xs font-medium text-green-800 dark:text-green-200">
                SSL 256-bit Encrypted Connection
              </span>
            </div>
          </div>

          {/* 계정 잠금 알림 */}
          {isLocked && (
            <div className="bg-destructive/10 dark:bg-red-900/20 p-4 rounded-xl border border-destructive/20 dark:border-red-800/50 backdrop-blur-sm animate-pulse">
              <div className="flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 text-destructive dark:text-red-400" />
                <span className="ml-2 text-sm text-destructive dark:text-red-200 font-medium">
                  계정이 잠겼습니다.
                  {lockoutTime > 0 && ` ${formatLockoutTime(lockoutTime)} 후 다시 시도하세요.`}
                </span>
              </div>
            </div>
          )}

          {/* 로그인 실패 경고 */}
          {loginAttempts > 0 && loginAttempts < 5 && (
            <div className="bg-yellow-50/50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200/50 dark:border-yellow-800/50 backdrop-blur-sm">
              <div className="flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <span className="ml-2 text-sm text-yellow-800 dark:text-yellow-200">
                  로그인 실패 {loginAttempts}/5 회
                </span>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 ml-1 mb-1">
                  사번
                </label>
                <input
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  autoComplete="username"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={isLocked}
                  className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 dark:disabled:bg-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white transition-all duration-200"
                  placeholder="사번을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 ml-1 mb-1">
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
                    className="block w-full px-4 py-3 pr-10 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 dark:disabled:bg-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white transition-all duration-200"
                    placeholder="비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLocked}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
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
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                  로그인 상태 유지
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 dark:bg-red-900/20 p-3 rounded-xl border border-destructive/20 dark:border-red-800/50 backdrop-blur-sm">
                <p className="text-sm text-destructive dark:text-red-300 text-center font-medium">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || isLocked}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    로그인 중...
                  </span>
                ) : isLocked ? (
                  `잠김 (${formatLockoutTime(lockoutTime)})`
                ) : (
                  '로그인'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SecureLogin;