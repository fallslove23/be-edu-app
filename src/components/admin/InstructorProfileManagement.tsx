/**
 * 강사 프로필 관리 컴포넌트
 * - InstructorManagement로 통합되었습니다
 * - 이 컴포넌트는 하위 호환성을 위해 유지됩니다
 */

import { useEffect } from 'react';

export default function InstructorProfileManagement() {
  useEffect(() => {
    // InstructorManagement로 리디렉션
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('page', 'instructor-management');
    window.history.replaceState({}, '', currentUrl);

    // 페이지 새로고침하여 InstructorManagement 로드
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          강사 관리로 이동 중...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          강사 프로필 관리가 강사 관리 페이지로 통합되었습니다.
        </p>
      </div>
    </div>
  );
}
