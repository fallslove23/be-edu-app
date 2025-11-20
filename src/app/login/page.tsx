'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SecureLogin from '@/components/auth/SecureLogin';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading, logout } = useAuth();

  useEffect(() => {
    // URL에 logout 파라미터가 있으면 로그아웃
    const shouldLogout = searchParams.get('logout') === 'true';
    if (shouldLogout) {
      logout();
      // URL에서 logout 파라미터 제거
      router.replace('/login');
      return;
    }

    // 이미 로그인된 사용자는 대시보드로 리다이렉트
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, logout, router, searchParams]);

  // 로딩 중이거나 이미 인증된 경우 아무것도 표시하지 않음
  if (loading || isAuthenticated) {
    return null;
  }

  return <SecureLogin />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
