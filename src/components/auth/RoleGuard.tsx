'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/auth.types';
import { PageContainer } from '../common/PageContainer';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login',
  fallback
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // 로그인하지 않은 경우
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // 권한이 없는 경우
      if (!allowedRoles.includes(user.role)) {
        if (fallback) return; // fallback이 있으면 표시
        router.push('/dashboard'); // 기본 대시보드로 리디렉션
      }
    }
  }, [user, loading, allowedRoles, redirectTo, router, fallback]);

  // 로딩 중
  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  // 로그인하지 않은 경우
  if (!user) {
    return null;
  }

  // 권한이 없는 경우
  if (!allowedRoles.includes(user.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-screen">
          <ShieldExclamationIcon className="w-20 h-20 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            접근 권한이 없습니다
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            이 페이지에 접근할 수 있는 권한이 없습니다.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary"
          >
            대시보드로 이동
          </button>
        </div>
      </PageContainer>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
