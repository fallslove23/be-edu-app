'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 최초 로그인 여부 확인
    const checkFirstLogin = async () => {
      if (user) {
        const firstLogin = await AuthService.checkFirstLogin(user.id);
        setIsFirstLogin(firstLogin);
      }
    };
    checkFirstLogin();
  }, [user]);

  const validatePassword = (password: string): boolean => {
    // 비밀번호 검증: 8자 이상, 영문/숫자 포함
    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return false;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasLetter || !hasNumber) {
      setError('비밀번호는 영문과 숫자를 포함해야 합니다.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }

    // 입력 검증
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (oldPassword === newPassword) {
      setError('새 비밀번호는 기존 비밀번호와 달라야 합니다.');
      return;
    }

    if (!validatePassword(newPassword)) {
      return;
    }

    try {
      setLoading(true);

      const result = await AuthService.changePassword(
        user.id,
        oldPassword,
        newPassword
      );

      if (result) {
        setSuccess('비밀번호가 성공적으로 변경되었습니다.');

        // 2초 후 대시보드로 이동
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError('비밀번호 변경에 실패했습니다. 기존 비밀번호를 확인해주세요.');
      }
    } catch (err) {
      console.error('비밀번호 변경 오류:', err);
      setError('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isFirstLogin) {
      // 최초 로그인인 경우 취소 불가
      setError('최초 로그인 시 비밀번호 변경이 필수입니다.');
    } else {
      router.back();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">로그인이 필요합니다.</p>
          <Button onClick={() => router.push('/login')} className="mt-4">
            로그인 페이지로 이동
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isFirstLogin ? '초기 비밀번호 변경' : '비밀번호 변경'}
          </h2>
          {isFirstLogin && (
            <p className="mt-2 text-center text-sm text-red-600">
              보안을 위해 초기 비밀번호를 변경해주세요.
            </p>
          )}
          <p className="mt-2 text-center text-sm text-gray-600">
            사용자: {user.name} ({user.employee_id})
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">
                {isFirstLogin ? '기본 비밀번호' : '현재 비밀번호'}
              </label>
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={isFirstLogin ? 'osstem' : '현재 비밀번호 입력'}
                required
                disabled={loading}
                autoComplete="current-password"
              />
              {isFirstLogin && (
                <p className="mt-1 text-xs text-gray-500">
                  초기 비밀번호: osstem
                </p>
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                새 비밀번호
              </label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 입력 (8자 이상, 영문/숫자 포함)"
                required
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                새 비밀번호 확인
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호 재입력"
                required
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </Button>

            {!isFirstLogin && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1"
              >
                취소
              </Button>
            )}
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>비밀번호 요구사항:</p>
            <ul className="list-disc list-inside ml-2">
              <li>최소 8자 이상</li>
              <li>영문자 포함</li>
              <li>숫자 포함</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}
